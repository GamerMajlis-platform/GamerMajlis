import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { EventsService } from '../../../../core/services/events.service';
import {
  Event,
  EventAttendance,
} from '../../../../core/interfaces/events.models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);

  // State
  event = signal<Event | null>(null);
  attendees = signal<EventAttendance[]>([]);
  loading = signal<boolean>(true);
  attendeesLoading = signal<boolean>(false);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isUserRegistered = signal<boolean>(false);
  userCanEdit = signal<boolean>(false);
  showFullDescription = signal<boolean>(false);

  // Computed properties
  eventExists = computed(() => this.event() !== null);

  canRegister = computed(() => {
    const event = this.event();
    if (!event) return false;
    return (
      this.eventsService.isRegistrationOpen(event) &&
      !this.isUserRegistered() &&
      event.status === 'REGISTRATION_OPEN' &&
      (!event.maxAttendees || event.currentAttendees < event.maxAttendees)
    );
  });

  hasStarted = computed(() => {
    const event = this.event();
    return event ? this.eventsService.hasEventStarted(event) : false;
  });

  hasEnded = computed(() => {
    const event = this.event();
    return event ? this.eventsService.hasEventEnded(event) : false;
  });

  eventDuration = computed(() => {
    const event = this.event();
    return event ? this.eventsService.getEventDuration(event) : '';
  });

  formattedStartDate = computed(() => {
    const event = this.event();
    return event ? this.eventsService.formatEventDate(event.startDateTime) : '';
  });

  formattedEndDate = computed(() => {
    const event = this.event();
    if (!event?.endDateTime) return '';
    return this.eventsService.formatEventDate(event.endDateTime);
  });

  isEventFree = computed(() => {
    const event = this.event();
    return !event?.entryFee || event.entryFee === 0;
  });

  isFull = computed(() => {
    const event = this.event();
    if (!event?.maxAttendees) return false;
    return event.currentAttendees >= event.maxAttendees;
  });

  daysUntilEvent = computed(() => {
    const event = this.event();
    if (!event) return 0;
    const now = new Date();
    const start = new Date(event.startDateTime);
    const diff = start.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  ngOnInit(): void {
    this.loadEventDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEventDetails(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const eventId = +params['id'];
          return this.eventsService.getEventById(eventId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.event.set(response.event);
          this.loading.set(false);

          // Check if user is the organizer (can edit/delete)
          // TODO: Compare with current user ID from auth service
          // this.userCanEdit.set(response.event.organizer.id === currentUser.id);

          // Load attendees if registration is open
          if (response.event.requiresRegistration) {
            this.loadAttendees();
          }
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.loading.set(false);
          // Navigate back or show error
          this.router.navigate(['/events']);
        },
      });
  }

  private loadAttendees(): void {
    const event = this.event();
    if (!event) return;

    this.attendeesLoading.set(true);
    this.eventsService
      .getEventAttendees(event.id, this.currentPage(), 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.attendees.set(response.attendees);
          this.totalPages.set(response.totalPages);
          this.attendeesLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading attendees:', error);
          this.attendeesLoading.set(false);
        },
      });
  }

  onRegister(): void {
    const event = this.event();
    if (!event || !this.canRegister()) return;

    this.eventsService
      .registerForEvent(event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.isUserRegistered.set(true);
          // Update attendee count
          this.event.update((event) =>
            event
              ? {
                  ...event,
                  currentAttendees: event.currentAttendees + 1,
                }
              : null
          );
          this.loadAttendees();
        },
        error: (error) => {
          console.error('Registration failed:', error);
        },
      });
  }

  onUnregister(): void {
    const event = this.event();
    if (!event || !this.isUserRegistered()) return;

    this.eventsService
      .unregisterFromEvent(event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Unregistration successful:', response);
          this.isUserRegistered.set(false);
          // Update attendee count
          this.event.update((event) =>
            event
              ? {
                  ...event,
                  currentAttendees: Math.max(0, event.currentAttendees - 1),
                }
              : null
          );
          this.loadAttendees();
        },
        error: (error) => {
          console.error('Unregistration failed:', error);
        },
      });
  }

  onCheckIn(): void {
    const event = this.event();
    if (!event || !this.hasStarted()) return;

    this.eventsService
      .checkInToEvent(event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Check-in successful:', response);
          this.loadAttendees();
        },
        error: (error) => {
          console.error('Check-in failed:', error);
        },
      });
  }

  onEdit(): void {
    const event = this.event();
    if (!event) return;
    this.router.navigate(['/events', event.id, 'edit']);
  }

  onDelete(): void {
    const event = this.event();
    if (!event) return;

    if (
      confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      this.eventsService
        .deleteEvent(event.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Event deleted:', response);
            this.router.navigate(['/events']);
          },
          error: (error) => {
            console.error('Delete failed:', error);
          },
        });
    }
  }

  onAttendeesPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAttendees();
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  getEventTypeIcon(): string {
    const event = this.event();
    if (!event) return '📅';

    switch (event.eventType) {
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
    const event = this.event();
    if (!event) return '📍';

    switch (event.locationType) {
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
    const event = this.event();
    if (!event) return 'text-gray-400';

    switch (event.status) {
      case 'REGISTRATION_OPEN':
        return 'text-green-400';
      case 'REGISTRATION_CLOSED':
        return 'text-yellow-400';
      case 'ONGOING':
        return 'text-blue-400';
      case 'COMPLETED':
        return 'text-gray-400';
      case 'CANCELLED':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  getStatusText(): string {
    const event = this.event();
    if (!event) return '';

    switch (event.status) {
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

  getAttendancePercentage(): number {
    const event = this.event();
    if (!event || !event.maxAttendees) return 0;
    return Math.round((event.currentAttendees / event.maxAttendees) * 100);
  }

  shareEvent(): void {
    const event = this.event();
    if (!event) return;

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
      console.log('Event link copied to clipboard');
    }
  }

  toggleDescription(): void {
    this.showFullDescription.update((val) => !val);
  }

  getViewCount(): number {
    return this.event()?.viewCount || 0;
  }

  getInterestedCount(): number {
    return this.event()?.interestedCount || 0;
  }

  formatCurrency(
    amount: number | undefined,
    currency: string | undefined
  ): string {
    if (!amount) return 'Free';
    return `${amount.toFixed(2)} ${currency || 'USD'}`;
  }

  getRegistrationDeadline(): string {
    const event = this.event();
    if (!event?.registrationDeadline) return 'No deadline';
    return this.eventsService.formatEventDate(event.registrationDeadline);
  }

  isRegistrationDeadlinePassed(): boolean {
    const event = this.event();
    if (!event?.registrationDeadline) return false;
    return new Date(event.registrationDeadline) < new Date();
  }

  getTimeUntilStart(): string {
    const event = this.event();
    if (!event) return '';

    const now = new Date();
    const start = new Date(event.startDateTime);
    const diff = start.getTime() - now.getTime();

    if (diff < 0) return 'Event has started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    return `Starts in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  viewOrganizerProfile(): void {
    const event = this.event();
    if (!event?.organizer?.id) return;
    this.router.navigate(['/profile', event.organizer.id]);
  }
}
