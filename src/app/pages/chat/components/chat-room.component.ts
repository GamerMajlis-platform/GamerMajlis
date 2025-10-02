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
} from '../../../core/interfaces/chat.models';
import { ChatService } from '../../../core/services/chat.service';

import { Subject, takeUntil } from 'rxjs';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';

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
  template: `
    <!-- Modern Glass Chat Room -->
    <div *ngIf="room" class="h-full flex flex-col relative overflow-hidden">
      <!-- Animated Gradient Background -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-navy-900 via-blue-gray-900 to-dark-blue-950 opacity-95"
      ></div>
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2RkZGRTkiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"
      ></div>

      <!-- Main Content Container with Glass Effect -->
      <div
        class="relative z-10 h-full flex flex-col backdrop-blur-xl bg-white/5 border border-mint-400/20 rounded-2xl shadow-2xl shadow-navy-900/50"
      >
        <!-- Premium Header Bar -->
        <div
          class="relative px-6 py-4 border-b border-mint-400/30 bg-gradient-to-r from-navy-800/80 via-dark-blue-900/80 to-blue-gray-900/80 backdrop-blur-md"
        >
          <div class="flex items-center justify-between">
            <!-- Left: Room Info -->
            <div class="flex items-center gap-4">
              <!-- Avatar with Glow -->
              <div class="relative group">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-mint-400 to-teal-500 rounded-xl blur-md group-hover:blur-lg transition-all"
                ></div>
                <div
                  class="relative w-14 h-14 rounded-xl bg-gradient-to-br from-mint-400 via-teal-500 to-mint-600 flex items-center justify-center shadow-lg shadow-mint-500/30 group-hover:scale-105 transition-transform"
                >
                  <svg
                    *ngIf="room.type === 'GROUP'"
                    class="w-7 h-7 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                    />
                  </svg>
                  <svg
                    *ngIf="room.type === 'DIRECT_MESSAGE'"
                    class="w-7 h-7 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    />
                  </svg>
                </div>
              </div>

              <!-- Title & Metadata -->
              <div>
                <h2
                  class="text-xl font-bold bg-gradient-to-r from-mint-300 via-teal-200 to-mint-400 bg-clip-text text-transparent drop-shadow-sm"
                >
                  {{ room.name }}
                </h2>
                <div class="flex items-center gap-3 mt-1 text-sm">
                  <span
                    class="px-2 py-0.5 rounded-full bg-mint-400/20 text-mint-300 border border-mint-400/30 font-medium"
                    >{{ room.currentMembers }} members</span
                  >
                  <span
                    *ngIf="room.gameTitle"
                    class="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 font-medium"
                    >{{ room.gameTitle }}</span
                  >
                  <span
                    *ngIf="room.isPrivate"
                    class="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-medium flex items-center gap-1"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"
                      />
                    </svg>
                    Private
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center gap-2">
              <!-- Connection Status Indicator -->
              <div
                class="px-3 py-1.5 rounded-lg"
                [ngClass]="{
                  'bg-green-500/20 border border-green-400/40':
                    connectionStatus() === 'CONNECTED',
                  'bg-yellow-500/20 border border-yellow-400/40':
                    connectionStatus() === 'CONNECTING' ||
                    connectionStatus() === 'RECONNECTING',
                  'bg-red-500/20 border border-red-400/40':
                    connectionStatus() === 'FAILED' ||
                    connectionStatus() === 'DISCONNECTED'
                }"
              >
                <span
                  class="text-xs font-semibold"
                  [ngClass]="{
                    'text-green-300': connectionStatus() === 'CONNECTED',
                    'text-yellow-300':
                      connectionStatus() === 'CONNECTING' ||
                      connectionStatus() === 'RECONNECTING',
                    'text-red-300':
                      connectionStatus() === 'FAILED' ||
                      connectionStatus() === 'DISCONNECTED'
                  }"
                  >{{ connectionStatus() }}</span
                >
              </div>

              <!-- Members Button -->
              <button
                (click)="showMembers()"
                class="p-3 rounded-xl bg-mint-500/10 hover:bg-mint-500/20 border border-mint-400/30 hover:border-mint-400/60 text-mint-300 hover:text-mint-200 transition-all hover:scale-105 shadow-lg hover:shadow-mint-500/20"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                  />
                </svg>
              </button>

              <!-- Settings Button -->
              <button
                (click)="openRoomSettings()"
                class="p-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/30 hover:border-teal-400/60 text-teal-300 hover:text-teal-200 transition-all hover:scale-105 shadow-lg hover:shadow-teal-500/20"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                  />
                </svg>
              </button>

              <!-- Leave Room Button -->
              <button
                (click)="leaveRoom()"
                class="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400/60 text-red-300 hover:text-red-200 transition-all hover:scale-105 shadow-lg hover:shadow-red-500/20"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Messages Area with Custom Scrollbar -->
        <div
          #messagesContainer
          (scroll)="onScroll($event)"
          class="flex-1 overflow-y-auto px-6 py-4 space-y-4 messages-scrollbar"
        >
          <!-- Loading State -->
          <div
            *ngIf="isLoadingMessages() && messages().length === 0"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center">
              <div
                class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mint-400 border-t-transparent"
              ></div>
              <p class="mt-4 text-mint-300 font-medium">Loading messages...</p>
            </div>
          </div>

          <!-- Messages by Date Groups -->
          <div
            *ngFor="let group of messageGroups(); trackBy: trackByDate"
            class="space-y-3"
          >
            <!-- Date Divider -->
            <div class="flex items-center justify-center my-6">
              <div
                class="px-4 py-1.5 rounded-full glass-card text-sm font-semibold text-mint-300 border border-mint-400/30"
              >
                {{ formatDate(group.date) }}
              </div>
            </div>

            <!-- Messages -->
            <div
              *ngFor="let message of group.messages; trackBy: trackByMessageId"
              class="message-enter"
            >
              <app-message-bubble
                [message]="message"
                [showSenderName]="shouldShowSenderName(message, group.messages)"
                (react)="onMessageReact($event)"
                (reply)="setReplyToMessage(message)"
                (moreActions)="onMessageMoreActions(message)"
                (imageClick)="onImageClick($event)"
                (fileDownload)="onFileDownload($event)"
                (deleteMessage)="deleteMessage(message)"
              ></app-message-bubble>
            </div>
          </div>

          <!-- No Messages State -->
          <div
            *ngIf="messages().length === 0 && !isLoadingMessages()"
            class="flex flex-col items-center justify-center h-full text-center"
          >
            <div
              class="w-24 h-24 rounded-2xl bg-gradient-to-br from-mint-400/20 to-teal-500/20 flex items-center justify-center mb-6 border border-mint-400/30"
            >
              <svg
                class="w-12 h-12 text-mint-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">No messages yet</h3>
            <p class="text-gray-400">
              Start the conversation by sending your first message!
            </p>
          </div>
        </div>

        <!-- Message Input Area -->
        <div
          class="px-6 py-4 border-t border-mint-400/30 bg-gradient-to-r from-navy-800/60 via-dark-blue-900/60 to-blue-gray-900/60 backdrop-blur-md"
        >
          <!-- Message input will be handled by parent component -->
          <div class="text-center text-slate-400 py-4">
            <p>Message input managed by parent component</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State: No Room Selected -->
    <div *ngIf="!room" class="h-full flex items-center justify-center">
      <div class="text-center relative">
        <div
          class="absolute inset-0 blur-3xl bg-gradient-to-br from-mint-400/20 via-teal-500/20 to-blue-gray-500/20 rounded-full"
        ></div>
        <div class="relative">
          <div
            class="w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-mint-400/20 to-teal-500/20 flex items-center justify-center border border-mint-400/30"
          >
            <svg
              class="w-16 h-16 text-mint-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z"
              />
            </svg>
          </div>
          <h3
            class="text-3xl font-bold bg-gradient-to-r from-mint-300 to-teal-400 bg-clip-text text-transparent mb-3"
          >
            Select a Chat Room
          </h3>
          <p class="text-gray-400 text-lg">
            Choose a room from the list to start chatting
          </p>
        </div>
      </div>
    </div>
  `,
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
