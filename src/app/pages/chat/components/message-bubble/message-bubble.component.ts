import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, ChatUser } from '../../../../core/interfaces/chat.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;
  @Input() showSenderName = true;
  @Output() reply = new EventEmitter<ChatMessage>();
  @Output() react = new EventEmitter<{ message: ChatMessage; emoji: string }>();
  @Output() moreActions = new EventEmitter<ChatMessage>();
  @Output() imageClick = new EventEmitter<string>();
  @Output() fileDownload = new EventEmitter<{
    url: string;
    fileName?: string;
  }>();
  @Output() deleteMessage = new EventEmitter<ChatMessage>();

  private authService = inject(AuthService);

  currentUserId = computed(() => {
    // Get current user ID from auth service
    return 1; // Mock value - replace with actual auth service call
  });

  isOwnMessage(): boolean {
    return this.message.sender.id === this.currentUserId();
  }

  getMessageContainerClass(): string {
    return this.isOwnMessage() ? 'justify-end' : 'justify-start';
  }

  getMessageBubbleClass(): string {
    const base = 'max-w-[70%] rounded-2xl px-4 py-2 relative group';

    if (this.isOwnMessage()) {
      return `${base} bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto`;
    } else {
      return `${base} bg-white/10 backdrop-blur-sm text-white border border-white/20`;
    }
  }

  getReactionsContainerClass(): string {
    return this.isOwnMessage() ? 'justify-end mr-10' : 'justify-start ml-10';
  }

  onReply(): void {
    this.reply.emit(this.message);
  }

  onReact(): void {
    // For now, emit with a heart emoji - could open emoji picker
    this.react.emit({ message: this.message, emoji: '❤️' });
  }

  onDelete(): void {
    this.deleteMessage.emit(this.message);
  }

  onMoreActions(): void {
    this.moreActions.emit(this.message);
  }

  onImageClick(url: string): void {
    this.imageClick.emit(url);
  }

  onFileDownload(url: string, fileName?: string): void {
    this.fileDownload.emit({ url, fileName });
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  trackByReactionId(index: number, reaction: any): string {
    return `${reaction.emoji}-${reaction.user.id}`;
  }

  getReactionCount(emoji: string): number {
    return this.message.reactions?.filter((r) => r.emoji === emoji).length || 0;
  }
}
