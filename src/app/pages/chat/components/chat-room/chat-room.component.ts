import {
  Component,
  Input,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChatRoom,
  ChatMessage,
  ChatUser,
} from '../../../../core/interfaces/chat.models';
import { ChatService } from '../../../../core/services/chat.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  styles: [
    `
      .messages-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .messages-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      .messages-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #6fffe9 0%, #5bc0be 100%);
        border-radius: 10px;
      }
      .messages-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #5bc0be 0%, #6fffe9 100%);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .message-enter {
        animation: slideIn 0.3s ease-out;
      }

      .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(111, 255, 233, 0.2);
      }

      .glass-card-hover:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(111, 255, 233, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(111, 255, 233, 0.2);
      }
    `,
  ],
  templateUrl: './chat-room.component.html',
})
export class ChatRoomComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @Input() room?: ChatRoom;
  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef<HTMLDivElement>;

  // Make chatService public for template access
  public chatService = inject(ChatService);
  private destroy$ = new Subject<void>();
  private isScrolledToBottom = true;

  // State
  replyToMessage = signal<ChatMessage | undefined>(undefined);
  isLoadingMessages = signal(false);
  hasMoreMessages = signal(true);

  // Computed properties
  messages = computed(() => {
    return this.room ? this.chatService.getMessagesForRoom(this.room.id) : [];
  });

  typingUsers = computed(() => {
    return this.room
      ? this.chatService.getTypingUsersForRoom(this.room.id)
      : [];
  });

  connectionStatus = computed(() => this.chatService.connectionStatus());

  messageGroups = computed(() => {
    const messages = this.messages();
    const groups: { date: string; messages: ChatMessage[] }[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      let group = groups.find((g) => g.date === messageDate);

      if (!group) {
        group = { date: messageDate, messages: [] };
        groups.push(group);
      }

      group.messages.push(message);
    });

    return groups;
  });

  constructor() {
    // Auto-scroll effect when new messages arrive
    effect(() => {
      const messages = this.messages();
      if (messages.length > 0 && this.isScrolledToBottom) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    if (this.room) {
      this.loadMessages();
      this.subscribeToEvents();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['room'] && this.room) {
      const existing = this.chatService.getMessagesForRoom(this.room.id);
      if (!existing || existing.length === 0) {
        this.loadMessages();
      }
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToEvents() {
    this.chatService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (message.chatRoom?.id === this.room?.id) {
          this.checkScrollPosition();
        }
      });
  }

  private loadMessages() {
    if (!this.room) return;
    this.isLoadingMessages.set(true);
    this.chatService.getChatMessages(this.room.id, 0, 50).subscribe({
      next: () => {
        this.isLoadingMessages.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages.set(false);
      },
    });
  }

  onScroll(event: Event) {
    const container = event.target as HTMLDivElement;
    const threshold = 100;
    if (
      container.scrollTop < threshold &&
      this.hasMoreMessages() &&
      !this.isLoadingMessages()
    ) {
      this.loadMoreMessages();
    }
    this.checkScrollPosition();
  }

  private loadMoreMessages() {
    if (!this.room || this.isLoadingMessages()) return;
    const currentMessages = this.messages();
    const oldestMessage = currentMessages[0];
    if (!oldestMessage) return;

    this.isLoadingMessages.set(true);
    this.chatService
      .getChatMessages(
        this.room.id,
        Math.floor(currentMessages.length / 50),
        50,
        { beforeMessageId: oldestMessage.id }
      )
      .subscribe({
        next: (response) => {
          this.isLoadingMessages.set(false);
          this.hasMoreMessages.set(response.messages.length === 50);
        },
        error: (error) => {
          console.error('Error loading more messages:', error);
          this.isLoadingMessages.set(false);
        },
      });
  }

  private checkScrollPosition() {
    if (!this.messagesContainer) return;
    const container = this.messagesContainer.nativeElement;
    const threshold = 100;
    this.isScrolledToBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
  }

  private scrollToBottom() {
    if (!this.messagesContainer) return;
    const container = this.messagesContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
    this.isScrolledToBottom = true;
  }

  // Message Actions
  setReplyToMessage(message: ChatMessage) {
    this.replyToMessage.set(message);
  }

  clearReplyToMessage() {
    this.replyToMessage.set(undefined);
  }

  onMessageSent() {
    this.scrollToBottom();
  }

  onMessageReact(event: { message: ChatMessage; emoji: string }) {
    console.log('React to message:', event);
    // TODO: Implement reaction API call
  }

  onMessageMoreActions(message: ChatMessage) {
    console.log('More actions for message:', message);
  }

  deleteMessage(message: ChatMessage) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    this.chatService.deleteMessage(message.id).subscribe({
      next: () => console.log('Message deleted'),
      error: (err) => console.error('Failed to delete message:', err),
    });
  }

  onImageClick(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  onFileDownload(event: { url: string; fileName?: string }) {
    const link = document.createElement('a');
    link.href = event.url;
    link.download = event.fileName || 'download';
    link.click();
  }

  shouldShowSenderName(message: ChatMessage, messages: ChatMessage[]): boolean {
    if (this.room?.type === 'DIRECT_MESSAGE') return false;
    const messageIndex = messages.indexOf(message);
    if (messageIndex === 0) return true;
    const previousMessage = messages[messageIndex - 1];
    return previousMessage.sender.id !== message.sender.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  trackByDate(
    index: number,
    group: { date: string; messages: ChatMessage[] }
  ): string {
    return group.date;
  }

  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  // Room Actions
  showMembers() {
    if (!this.room) return;
    this.chatService.getChatRoomMembers(this.room.id).subscribe({
      next: (response) => {
        console.log('Room members:', response.members);
        // TODO: Show members modal/sidebar
      },
      error: (err) => console.error('Failed to load members:', err),
    });
  }

  openRoomSettings() {
    console.log('Open room settings for:', this.room);
    // TODO: Open settings modal
  }

  leaveRoom() {
    if (
      !this.room ||
      !confirm(`Are you sure you want to leave ${this.room.name}?`)
    )
      return;
    this.chatService.leaveChatRoom(this.room.id).subscribe({
      next: () => console.log('Left room successfully'),
      error: (err) => console.error('Failed to leave room:', err),
    });
  }
}
