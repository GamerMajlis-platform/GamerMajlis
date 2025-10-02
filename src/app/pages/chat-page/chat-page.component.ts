import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatService } from '../../core/services/chat.service';
import { ChatRoom } from '../../core/interfaces/chat.models';
import { LanguageService } from '../../core/services/language.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  templateUrl: './chat-page.component.html',
  selector: 'app-chat-page',
  styleUrl: './chat-page.component.css',
  imports: [CommonModule, FormsModule, TranslateModule],
})
export class ChatPageComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  languageService = inject(LanguageService);
  translate = inject(TranslateService);
  private destroy$ = new Subject<void>();
  _PLATFORM_ID = inject(PLATFORM_ID);

  // Window object for responsive checks

  // ViewChild for scrolling
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  private shouldScrollToBottom = true;

  // Current language and direction
  currentLang = signal<'en' | 'ar'>('en');
  isRTL = computed(() => this.currentLang() === 'ar');

  // State
  selectedRoom = signal<ChatRoom | undefined>(undefined);
  showMembersSidebar = signal(false);
  showOnlineUsers = signal(false);
  showCreateRoomModal = signal(false);
  showNewMessageModal = signal(false);
  searchQuery = signal('');
  roomFilter = signal<'ALL' | 'GROUP' | 'DIRECT_MESSAGE'>('ALL');
  messageText = signal('');
  selectedFile = signal<File | null>(null);
  replyToMessage = signal<any | null>(null);
  hoveredMessageId = signal<number | null>(null);
  showEmojiPicker = signal(false);
  isCreatingRoom = signal(false);
  isCreatingDM = signal(false);
  private typingTimeout: any;
  private notificationPermission: NotificationPermission = 'default';

  // Create Room Form
  newRoom = signal({
    name: '',
    description: '',
    type: 'GROUP' as 'GROUP' | 'DIRECT_MESSAGE',
    gameTitle: '',
    maxMembers: 50,
  });

  // New DM Form
  newDM = signal({
    receiverId: 0,
    initialMessage: '',
  });

  // Computed
  rooms = computed(() => {
    let rooms = this.chatService.rooms();
    const filter = this.roomFilter();
    const search = this.searchQuery().toLowerCase();

    if (filter !== 'ALL') {
      rooms = rooms.filter((r) => r.type === filter);
    }

    if (search) {
      rooms = rooms.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.gameTitle?.toLowerCase().includes(search)
      );
    }

    return rooms;
  });

  messages = computed(() => {
    const room = this.selectedRoom();
    return room ? this.chatService.getMessagesForRoom(room.id).reverse() : [];
  });

  typingUsers = computed(() => {
    const room = this.selectedRoom();
    return room ? this.chatService.getTypingUsersForRoom(room.id) : [];
  });

  connectionStatus = computed(() => this.chatService.connectionStatus());
  onlineUsers = computed(() => this.chatService.onlineUsers());

  // Window object for responsive checks (SSR-safe)
  window?: Window;

  ngOnInit() {
    // Initialize window object only in browser
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.window = window;
    }

    // Subscribe to language changes
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.currentLang.set(lang);
      });

    // Initialize WebSocket (automatically connects)
    this.chatService.reconnect();

    // Load initial rooms
    this.chatService.getUserChatRooms().subscribe();

    // Load online users

    // Subscribe to new messages and show notifications
    this.chatService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        console.log('🔔 [ChatPage] New message received from WebSocket:', {
          messageId: message.id,
          senderId: message.sender?.id,
          content: message.content,
          isOwnMessage: this.isOwnMessage(message.sender?.id),
        });

        if (message && !this.isOwnMessage(message.sender?.id)) {
          this.showNotification(message);
        }

        // Auto-scroll to bottom when new message arrives
        setTimeout(() => this.scrollToBottom('smooth'), 100);
      });

    // Request notification permission
    this.requestNotificationPermission();

    // Effect to scroll when messages change
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0 && this.shouldScrollToBottom) {
        setTimeout(() => this.scrollToBottom('auto'), 100);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom.set(room);
    this.shouldScrollToBottom = true;

    // Join room (which internally calls getChatMessages)
    this.chatService.joinChatRoom(room.id).subscribe({
      next: (response) => {
        console.log('✅ Joined room:', room.id, response);
      },
      error: (err) => {
        console.error('❌ Failed to join room:', err);
      },
    });

    // Also explicitly load messages to ensure they're fetched
    // (This is redundant with joinChatRoom's internal call, but ensures reliability)
    this.chatService.getChatMessages(room.id, 0, 50).subscribe({
      next: (response) => {
        console.log(
          '✅ Messages loaded:',
          response.messages?.length || 0,
          'messages'
        );
        // Scroll to bottom after messages load
        setTimeout(() => this.scrollToBottom('auto'), 200);
      },
      error: (err) => {
        console.error('❌ Failed to load messages:', err);
      },
    });
  }

  toggleMembersSidebar() {
    this.showMembersSidebar.update((v) => !v);
  }

  toggleOnlineUsers() {
    this.showOnlineUsers.update((v) => !v);
  }

  // Helper methods for template
  isDifferentDay(msg1: any, msg2: any): boolean {
    if (!msg1 || !msg2) return true;
    const date1 = new Date(msg1.createdAt).toDateString();
    const date2 = new Date(msg2.createdAt).toDateString();
    return date1 !== date2;
  }

  formatMessageDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  isOwnMessage(senderId: number): boolean {
    return senderId === this.chatService['authService'].getCurrentUserId();
  }

  // Message sending
  sendMessage() {
    const room = this.selectedRoom();
    const content = this.messageText().trim();
    const file = this.selectedFile();
    const replyTo = this.replyToMessage();

    if (!room || (!content && !file)) return;

    const messageType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'TEXT' = file
      ? this.getFileType(file)
      : 'TEXT';
    const messageData = {
      content,
      messageType,
      file: file || undefined,
      replyToMessageId: replyTo?.id,
    };

    console.log('📤 Sending message:', {
      roomId: room.id,
      content: messageData.content,
      type: messageData.messageType,
      hasFile: !!messageData.file,
      replyTo: messageData.replyToMessageId,
    });

    this.chatService.sendMessage(room.id, messageData).subscribe({
      next: (response) => {
        console.log('✅ Message sent successfully:', {
          messageId: response.chatMessage?.id,
          success: response.success,
          timestamp: new Date().toISOString(),
        });

        // Clear input after successful send
        this.messageText.set('');
        this.selectedFile.set(null);
        this.replyToMessage.set(null);
        this.messages();
        const room = this.selectedRoom();
        return room ? this.chatService.getMessagesForRoom(room.id) : [];

        // Stop typing indicator
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
          this.typingTimeout = null;
        }
      },
      error: (err) => {
        console.error('❌ Failed to send message:', err);
      },
    });
  }

  onMessageInput() {
    const room = this.selectedRoom();
    if (!room) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing indicator
    this.chatService
      .sendTypingIndicator({ roomId: room.id, isTyping: true })
      .subscribe();

    // Set timeout to stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.typingTimeout = null;
    }, 3000);
  }

  getFileType(file: File): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' {
    const type = file.type.split('/')[0];
    if (type === 'image') return 'IMAGE';
    if (type === 'video') return 'VIDEO';
    if (type === 'audio') return 'AUDIO';
    return 'FILE';
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Message Actions
  deleteMessage(messageId: number) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.chatService.deleteMessage(messageId).subscribe({
        next: () => {
          console.log('Message deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete message:', err);
          alert('Failed to delete message. You may not have permission.');
        },
      });
    }
  }

  replyToMsg(message: any) {
    this.replyToMessage.set(message);
    // Focus on message input (will be handled in template)
  }

  cancelReply() {
    this.replyToMessage.set(null);
  }

  reactToMessage(messageId: number, emoji: string) {
    // Placeholder for future emoji reaction feature
    console.log(`React to message ${messageId} with ${emoji}`);
    // This would call a future API: this.chatService.addReaction(roomId, messageId, emoji)
  }

  // Browser Notifications
  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        this.notificationPermission = permission;
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }

  showNotification(message: any) {
    console.log('🔔 Processing notification for message:', {
      messageId: message.id,
      roomId: message.chatRoom?.id,
      senderId: message.sender?.id,
      currentUserId: this.chatService['authService'].getCurrentUserId(),
      permission: this.notificationPermission,
    });

    if (this.notificationPermission !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      return;
    }

    // Don't show notification for own messages
    if (
      message.sender?.id === this.chatService['authService'].getCurrentUserId()
    ) {
      console.log('⚠️ Skipping notification for own message');
      return;
    }

    // Don't show notification if user is on the chat page and room is selected
    const room = this.selectedRoom();
    if (document.hasFocus() && room && message.chatRoom?.id === room.id) {
      console.log('⚠️ Skipping notification - user is viewing this room');
      return;
    }

    const title = message.chatRoom?.name || 'New Message';
    const body = `${message.sender.displayName}: ${
      message.content || '[File]'
    }`;

    console.log('✅ Showing notification:', { title, body });

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `message-${message.id}`,
      requireInteraction: false,
      silent: false,
    });

    // Play notification sound
    this.playNotificationSound();

    notification.onclick = () => {
      window.focus();
      // If message is from a different room, switch to it
      if (room?.id !== message.chatRoom?.id) {
        const targetRoom = this.chatService
          .rooms()
          .find((r) => r.id === message.chatRoom?.id);
        if (targetRoom) {
          this.selectRoom(targetRoom);
        }
      }
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }

  playNotificationSound() {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCR/y/DajTcIF2Gy6+ihUBELTKXh8bllHAU2jdXzzn0pBSl+zPLaizsKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizsKGGS56eabUBEKSKHf8bllHAU2j9Xy0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizsKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizsKGGS56eabUBEKSKHf8bllHAU2j9Ty0H4qBSh+y/DZizoKGGW76+mjUxILTKXh8bllHAU2j9Xy0H4qBSh+y/DZizoK'
      );
      audio.volume = 0.3;
      audio
        .play()
        .catch((e) => console.log('Could not play notification sound:', e));
    } catch (e) {
      console.log('Notification sound error:', e);
    }
  }

  // Scroll to bottom functionality
  scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTo({
          top: element.scrollHeight,
          behavior: behavior,
        });
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Create new room modal
  toggleCreateRoomModal() {
    this.showCreateRoomModal.update((v) => !v);
    if (!this.showCreateRoomModal()) {
      // Reset form
      this.newRoom.set({
        name: '',
        description: '',
        type: 'GROUP',
        gameTitle: '',
        maxMembers: 50,
      });
    }
  }

  createNewRoom() {
    const room = this.newRoom();

    // Prevent double submission
    if (this.isCreatingRoom()) {
      console.log(
        '⚠️ Room creation already in progress, ignoring duplicate request'
      );
      return;
    }

    if (!room.name.trim()) {
      alert('Please enter a room name');
      return;
    }

    this.isCreatingRoom.set(true);

    this.chatService
      .createChatRoom({
        name: room.name,
        description: room.description,
        type: room.type,
        gameTitle: room.gameTitle || undefined,
        maxMembers: room.maxMembers,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Room created:', response);
          this.isCreatingRoom.set(false);
          this.toggleCreateRoomModal();
          // Reload rooms
          this.chatService.getUserChatRooms().subscribe();
          // Select the new room
          if (response.chatRoom) {
            this.selectRoom(response.chatRoom);
          }
        },
        error: (err) => {
          console.error('❌ Failed to create room:', err);
          this.isCreatingRoom.set(false);
          alert('Failed to create room. Please try again.');
        },
      });
  }

  // Create new direct message modal
  toggleNewMessageModal() {
    this.showNewMessageModal.update((v) => !v);
    if (!this.showNewMessageModal()) {
      this.newDM.set({ receiverId: 0, initialMessage: '' });
    }
  }

  startDirectMessage(userId: number) {
    // Prevent double submission
    if (this.isCreatingDM()) {
      console.log(
        '⚠️ DM creation already in progress, ignoring duplicate request'
      );
      return;
    }

    this.isCreatingDM.set(true);

    this.chatService
      .startDirectMessage({
        recipientId: userId,
      })
      .subscribe({
        next: (response: any) => {
          console.log('✅ DM created:', response);
          this.isCreatingDM.set(false);
          this.toggleNewMessageModal();
          // Reload rooms
          this.chatService.getUserChatRooms().subscribe();
          // Select the new DM room
          if (response.chatRoom) {
            this.selectRoom(response.chatRoom);
          }
        },
        error: (err: any) => {
          console.error('❌ Failed to create DM:', err);
          this.isCreatingDM.set(false);
          alert('Failed to start direct message. Please try again.');
        },
      });
  }

  // Helper methods for form updates
  updateRoomName(value: string) {
    this.newRoom.update((r) => ({ ...r, name: value }));
  }

  updateRoomDescription(value: string) {
    this.newRoom.update((r) => ({ ...r, description: value }));
  }

  updateRoomType(type: 'GROUP' | 'DIRECT_MESSAGE') {
    this.newRoom.update((r) => ({ ...r, type }));
  }

  updateRoomGameTitle(value: string) {
    this.newRoom.update((r) => ({ ...r, gameTitle: value }));
  }

  updateRoomMaxMembers(value: number) {
    this.newRoom.update((r) => ({ ...r, maxMembers: value }));
  }

  // Translation helper
  t(key: string): string {
    return this.translate.instant(key);
  }
}
