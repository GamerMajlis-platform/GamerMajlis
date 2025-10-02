import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  BehaviorSubject,
  combineLatest,
} from 'rxjs';

import { EventsService } from '../../core/services/events.service';
import { EventCardComponent } from './components/event-card/event-card.component';
import {
  Event,
  EventFilters,
  EventType,
  LocationType,
  EventCardData,
  EventSearchParams,
} from '../../core/interfaces/events.models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    EventCardComponent,
  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css',
})
export class EventsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventsService = inject(EventsService);

  // State
  events = signal<EventCardData[]>([]);
  trendingEvents = signal<Event[]>([]);
  loading = signal<boolean>(false);
  totalPages = signal<number>(1);
  currentPage = signal<number>(0);
  totalElements = signal<number>(0);
  showAdvancedFilters = signal<boolean>(false);

  // Quick filter state
  private quickFilters = signal<{ [key: string]: boolean }>({
    upcoming: true,
    free: false,
    online: false,
    tournaments: false,
  });

  // Search and Filters
  searchForm!: FormGroup;
  activeView = signal<'upcoming' | 'ongoing' | 'past'>('upcoming');

  // Filter options
  eventTypes: EventType[] = [
    'TOURNAMENT',
    'COMMUNITY_GATHERING',
    'WORKSHOP',
    'MEETUP',
  ];
  locationTypes: LocationType[] = ['VIRTUAL', 'PHYSICAL', 'HYBRID'];
  gameCategories = [
    'FPS',
    'MOBA',
    'RPG',
    'Strategy',
    'Sports',
    'Racing',
    'Puzzle',
    'Action',
  ];

  // Computed properties
  hasEvents = computed(() => this.events().length > 0);
  hasNextPage = computed(() => this.currentPage() < this.totalPages() - 1);
  hasPrevPage = computed(() => this.currentPage() > 0);

  ngOnInit(): void {
    this.initializeSearchForm();
    this.setupSearchSubscription();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      query: [''],
      eventType: [''],
      locationType: [''],
      gameCategory: [''],
      upcoming: [true],
      competitive: [''],
      freeEvents: [''],
    });
  }

  private setupSearchSubscription(): void {
    this.searchForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(0);
        this.searchEvents();
      });
  }

  private loadInitialData(): void {
    this.loadTrendingEvents();
    this.loadEvents();
  }

  private loadEvents(): void {
    this.loading.set(true);

    const searchParams: EventSearchParams = {
      ...this.getSearchParams(),
      page: this.currentPage(),
      size: 12,
    };

    this.eventsService
      .getEvents(searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const cardData = response.events.map(
            (event) => this.eventsService.transformToCardData(event, false) // TODO: Check user registration status
          );

          this.events.set(cardData);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.loading.set(false);
        },
      });
  }

  private loadTrendingEvents(): void {
    this.eventsService
      .getTrendingEvents(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trendingEvents.set(response.events);
        },
        error: (error) => {
          console.error('Error loading trending events:', error);
        },
      });
  }

  private getSearchParams(): EventSearchParams {
    const formValue = this.searchForm.value;
    const params: EventSearchParams = {};

    if (formValue.query) params.query = formValue.query;
    if (formValue.eventType) params.eventType = formValue.eventType;
    if (formValue.locationType) params.locationType = formValue.locationType;
    if (formValue.gameCategory) params.gameCategory = formValue.gameCategory;
    if (formValue.competitive !== '')
      params.competitive = formValue.competitive;
    if (formValue.freeEvents !== '') params.freeEvents = formValue.freeEvents;

    // Handle view-based filtering
    const view = this.activeView();

    if (view === 'upcoming') {
      // Future events only
      params.upcoming = true;
    } else if (view === 'ongoing') {
      // Events that are currently happening (user's registered events)
      params.myEvents = true;
      params.upcoming = true; // Only show upcoming/ongoing events
    } else if (view === 'past') {
      // Past events only
      params.upcoming = false;
    }

    return params;
  }

  searchEvents(): void {
    this.currentPage.set(0);
    this.loadEvents();
  }

  onViewChange(view: 'upcoming' | 'ongoing' | 'past'): void {
    this.activeView.set(view);
    this.currentPage.set(0);

    // Clear the query when switching views for a fresh start
    this.searchForm.patchValue({ query: '' }, { emitEvent: false });

    // Load events for the selected view
    this.searchEvents();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNextPage(): void {
    if (this.hasNextPage()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  onPrevPage(): void {
    if (this.hasPrevPage()) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  onRegisterForEvent(eventId: number): void {
    this.eventsService
      .registerForEvent(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          // Update the event in the list
          this.updateEventRegistrationStatus(eventId, true);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          // Handle error (show toast, etc.)
        },
      });
  }

  onUnregisterFromEvent(eventId: number): void {
    this.eventsService
      .unregisterFromEvent(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Unregistration successful:', response);
          // Update the event in the list
          this.updateEventRegistrationStatus(eventId, false);
        },
        error: (error) => {
          console.error('Unregistration failed:', error);
          // Handle error (show toast, etc.)
        },
      });
  }

  onViewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  onCreateEvent(): void {
    this.router.navigate(['/events/create']);
  }

  onEditEvent(eventId: number): void {
    this.router.navigate(['/events', eventId, 'edit']);
  }

  onDeleteEvent(eventId: number): void {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventsService
        .deleteEvent(eventId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Event deleted:', response);
            // Remove event from list
            this.events.update((events) =>
              events.filter((e) => e.id !== eventId)
            );
          },
          error: (error) => {
            console.error('Delete failed:', error);
            // Handle error (show toast, etc.)
          },
        });
    }
  }

  clearFilters(): void {
    this.searchForm.reset({
      query: '',
      eventType: '',
      locationType: '',
      gameCategory: '',
      upcoming: true,
      competitive: '',
      freeEvents: '',
    });

    // Reset quick filters
    this.quickFilters.set({
      upcoming: true,
      free: false,
      online: false,
      tournaments: false,
    });
  }

  private updateEventRegistrationStatus(
    eventId: number,
    isRegistered: boolean
  ): void {
    this.events.update((events) =>
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              isUserRegistered: isRegistered,
              currentAttendees: isRegistered
                ? event.currentAttendees + 1
                : Math.max(0, event.currentAttendees - 1),
            }
          : event
      )
    );
  }

  getDisplayedEvents(): EventCardData[] {
    return this.events();
  }

  trackByEventId(index: number, event: EventCardData): number {
    return event.id;
  }
}
