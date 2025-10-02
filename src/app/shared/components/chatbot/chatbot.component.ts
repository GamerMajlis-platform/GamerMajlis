// chatbot.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../core/services/chatbot.service';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  isOpen = false;
  messages: Message[] = [];
  currentMessage = '';
  isTyping = false;
  typingTimeout: any;
  _PLATFORM_ID = inject(PLATFORM_ID);
  _ChatbotService = inject(ChatbotService);

  ngOnInit(): void {
    // Load chat history from localStorage
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      this.loadChatHistory();
    }

    // Add welcome message if no history
    if (this.messages.length === 0) {
      this.addMessage({
        text: "What's up! Let us know how we can assist! 🎮",
        sender: 'bot',
      });
    }
  }

  ngOnDestroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  toggleChatbot(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
      }, 300);

      this.scrollToBottom();
    }
  }
  quickActions: string[] = ['Tournament info', 'Account help', 'Report issue'];

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  sendMessage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const messageText = this.currentMessage.trim();
    if (!messageText) return;

    // Add user message
    this.addMessage({
      text: messageText,
      sender: 'user',
    });

    this.currentMessage = '';
    this.showTypingIndicator();

    // Send message to chatbot service and get response
    this._ChatbotService.sendMessageAndGetResponse(messageText).subscribe({
      next: (response) => {
        // Only process non-empty responses (when status is 'done')
        if (response && response.trim()) {
          this.hideTypingIndicator();
          this.addMessage({
            text: response,
            sender: 'bot',
          });
        }
      },
      error: (error) => {
        console.error('Chatbot error:', error);
        this.hideTypingIndicator();
        this.addMessage({
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
        });
      },
    });
  }

  private addMessage(messageData: Partial<Message>): void {
    const message: Message = {
      id: this.generateId(),
      text: messageData.text || '',
      sender: messageData.sender || 'user',
      timestamp: new Date(),
      isTyping: messageData.isTyping || false,
    };

    this.messages.push(message);
    this.saveChatHistory();

    setTimeout(() => {
      this.scrollToBottom();
    }, 50);
  }

  private showTypingIndicator(): void {
    this.isTyping = true;

    const typingMessage: Message = {
      id: 'typing',
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true,
    };

    this.messages.push(typingMessage);
    this.scrollToBottom();
  }

  private hideTypingIndicator(): void {
    this.isTyping = false;
    this.messages = this.messages.filter((msg) => msg.id !== 'typing');
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  private loadChatHistory(): void {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      const savedMessages = localStorage.getItem('gamermajlis-chat-history');
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          this.messages = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    }
  }

  private saveChatHistory(): void {
    // Only save non-typing messages
    const messagesToSave = this.messages.filter((msg) => !msg.isTyping);

    // Limit history to last 50 messages
    const limitedMessages = messagesToSave.slice(-50);

    try {
      if (isPlatformBrowser(this._PLATFORM_ID)) {
        localStorage.setItem(
          'gamermajlis-chat-history',
          JSON.stringify(limitedMessages)
        );
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  clearChat(): void {
    this.messages = [];
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      localStorage.removeItem('gamermajlis-chat-history');
    }

    // Add welcome message again
    this.addMessage({
      text: 'Chat cleared! How can I help you today? 🎮',
      sender: 'bot',
    });
  }

  // Handle quick action clicks
  handleQuickAction(action: string): void {
    this.currentMessage = action;
    this.sendMessage();
  }

  // Format timestamp for display
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  // Check if should show timestamp
  shouldShowTimestamp(index: number): boolean {
    if (index === 0) return true;

    const currentMsg = this.messages[index];
    const prevMsg = this.messages[index - 1];

    // Show timestamp if more than 5 minutes apart
    const timeDiff =
      currentMsg.timestamp.getTime() - prevMsg.timestamp.getTime();
    return timeDiff > 5 * 60 * 1000;
  }
}
