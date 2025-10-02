import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  EventCardData,
  EventType,
  LocationType,
  EventAttendance,
} from '../../../../core/interfaces/events.models';
import { EventsService } from '../../../../core/services/events.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent {
  @Input({ required: true }) event!: EventCardData;
  @Input() showActions: boolean = true;
  @Input() isLoading: boolean = false;

  @Output() register = new EventEmitter<number>();
  @Output() unregister = new EventEmitter<number>();
  @Output() viewDetails = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  private eventsService = inject(EventsService);

  // State signals
  showAttendees = signal<boolean>(false);
  attendees = signal<EventAttendance[]>([]);
  loadingAttendees = signal<boolean>(false);
  isHovered = signal<boolean>(false);

  // Computed properties for better performance
  eventDate = computed(() => {
    if (!this.event) return '';
    const date = new Date(this.event.startDateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  eventTime = computed(() => {
    if (!this.event) return '';
    const date = new Date(this.event.startDateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  isUpcoming = computed(() => {
    if (!this.event) return false;
    return new Date(this.event.startDateTime) > new Date();
  });

  attendancePercentage = computed(() => {
    if (!this.event || !this.event.maxAttendees) return 0;
    return Math.round(
      (this.event.currentAttendees / this.event.maxAttendees) * 100
    );
  });

  spotsFilled = computed(() => {
    if (!this.event || !this.event.maxAttendees) return false;
    return this.event.currentAttendees >= this.event.maxAttendees;
  });

  spotsAvailable = computed(() => {
    if (!this.event || !this.event.maxAttendees) return 0;
    return this.event.maxAttendees - this.event.currentAttendees;
  });

  getEventTypeIcon(): string {
    switch (this.event?.eventType) {
      case 'TOURNAMENT':
        return '🏆';
      case 'WORKSHOP':
        return '🎓';
      case 'MEETUP':
        return '👥';
      case 'COMMUNITY_GATHERING':
        return '🎮';
      default:
        return '📅';
    }
  }

  getLocationIcon(): string {
    switch (this.event?.locationType) {
      case 'VIRTUAL':
        return '💻';
      case 'PHYSICAL':
        return '📍';
      case 'HYBRID':
        return '🌐';
      default:
        return '📍';
    }
  }

  getStatusColor(): string {
    switch (this.event?.status) {
      case 'REGISTRATION_OPEN':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'REGISTRATION_CLOSED':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'ONGOING':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'COMPLETED':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'CANCELLED':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  }

  getStatusText(): string {
    switch (this.event?.status) {
      case 'REGISTRATION_OPEN':
        return 'Registration Open';
      case 'REGISTRATION_CLOSED':
        return 'Registration Closed';
      case 'ONGOING':
        return 'Live Now';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'DRAFT':
        return 'Draft';
      default:
        return '';
    }
  }

  onRegisterClick(): void {
    if (this.event.canRegister && !this.isLoading) {
      this.register.emit(this.event.id);
    }
  }

  onUnregisterClick(): void {
    if (this.event.isUserRegistered && !this.isLoading) {
      this.unregister.emit(this.event.id);
    }
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.event.id);
  }

  onEdit(): void {
    this.edit.emit(this.event.id);
  }

  onDelete(): void {
    this.delete.emit(this.event.id);
  }

  getDaysUntilEvent(): number {
    const now = new Date();
    const eventDate = new Date(this.event.startDateTime);
    const diffTime = eventDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getRelativeTime(): string {
    const days = this.getDaysUntilEvent();
    if (days < 0) return 'Past event';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  }

  toggleAttendees(): void {
    this.showAttendees.update((show) => !show);
    if (this.showAttendees() && this.attendees().length === 0) {
      this.loadAttendees();
    }
  }

  loadAttendees(): void {
    this.loadingAttendees.set(true);
    this.eventsService.getEventAttendees(this.event.id, 0, 10).subscribe({
      next: (response) => {
        this.attendees.set(response.attendees);
        this.loadingAttendees.set(false);
      },
      error: (error) => {
        console.error('Error loading attendees:', error);
        this.loadingAttendees.set(false);
      },
    });
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  getEventDuration(): string {
    if (!this.event.startDateTime) return 'Duration not specified';

    const start = new Date(this.event.startDateTime);
    // Since EventCardData doesn't have endDateTime, we'll show start time only
    return start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
