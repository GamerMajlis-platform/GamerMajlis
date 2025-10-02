import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
  EventSearchParams,
  EventListResponse,
  EventResponse,
  AttendeesResponse,
  AttendanceResponse,
  TrendingEventsResponse,
  EventStats,
  EventCardData,
} from '../interfaces/events.models';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly API_URL = `${API_BASE_URL}/events`;

  // State management
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private filtersSubject = new BehaviorSubject<EventFilters>({});

  public events$ = this.eventsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get Events List
  getEvents(params: EventSearchParams = {}): Observable<EventListResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined)
      httpParams = httpParams.set('size', params.size.toString());
    if (params.eventType)
      httpParams = httpParams.set('eventType', params.eventType);
    if (params.gameCategory)
      httpParams = httpParams.set('gameCategory', params.gameCategory);
    if (params.locationType)
      httpParams = httpParams.set('locationType', params.locationType);
    if (params.myEvents !== undefined)
      httpParams = httpParams.set('myEvents', params.myEvents.toString());
    if (params.upcoming !== undefined)
      httpParams = httpParams.set('upcoming', params.upcoming.toString());
    if (params.competitive !== undefined)
      httpParams = httpParams.set('competitive', params.competitive.toString());
    if (params.freeEvents !== undefined)
      httpParams = httpParams.set('freeEvents', params.freeEvents.toString());
    if (params.startDate)
      httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    this.loadingSubject.next(true);

    return this.http
      .get<EventListResponse>(this.API_URL, { params: httpParams })
      .pipe(
        tap((response) => {
          this.eventsSubject.next(response.events);
          this.loadingSubject.next(false);
        })
      );
  }

  // Get Event Details
  getEventById(eventId: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${this.API_URL}/${eventId}`);
  }

  // Create Event
  createEvent(eventData: CreateEventRequest): Observable<EventResponse> {
    const formData = new FormData();

    // Convert eventData to FormData
    Object.keys(eventData).forEach((key) => {
      const value = (eventData as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    return this.http.post<EventResponse>(this.API_URL, formData);
  }

  // Update Event
  updateEvent(
    eventId: number,
    eventData: UpdateEventRequest
  ): Observable<EventResponse> {
    const formData = new FormData();

    // Convert eventData to FormData
    Object.keys(eventData).forEach((key) => {
      const value = (eventData as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    return this.http.put<EventResponse>(`${this.API_URL}/${eventId}`, formData);
  }

  // Delete Event
  deleteEvent(
    eventId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API_URL}/${eventId}`
    );
  }

  // Register for Event
  registerForEvent(eventId: number): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(
      `${this.API_URL}/${eventId}/register`,
      {}
    );
  }

  // Unregister from Event
  unregisterFromEvent(
    eventId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API_URL}/${eventId}/unregister`,
      {}
    );
  }

  // Get Event Attendees
  getEventAttendees(
    eventId: number,
    page: number = 0,
    size: number = 20
  ): Observable<AttendeesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AttendeesResponse>(
      `${this.API_URL}/${eventId}/attendees`,
      { params }
    );
  }

  // Check-in to Event
  checkInToEvent(eventId: number): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(
      `${this.API_URL}/${eventId}/check-in`,
      {}
    );
  }

  // Search Events
  searchEvents(params: EventSearchParams): Observable<EventListResponse> {
    let httpParams = new HttpParams();

    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined)
      httpParams = httpParams.set('size', params.size.toString());
    if (params.eventType)
      httpParams = httpParams.set('eventType', params.eventType);
    if (params.locationType)
      httpParams = httpParams.set('locationType', params.locationType);
    if (params.gameCategory)
      httpParams = httpParams.set('gameCategory', params.gameCategory);

    this.loadingSubject.next(true);

    return this.http
      .get<EventListResponse>(`${this.API_URL}/search`, { params: httpParams })
      .pipe(
        tap((response) => {
          this.loadingSubject.next(false);
        })
      );
  }

  // Get Trending Events
  getTrendingEvents(limit: number = 10): Observable<TrendingEventsResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TrendingEventsResponse>(`${this.API_URL}`);
  }

  // Utility Methods

  // Transform Event to EventCardData
  transformToCardData(
    event: Event,
    isUserRegistered: boolean = false
  ): EventCardData {
    const now = new Date();
    const registrationDeadline = event.registrationDeadline
      ? new Date(event.registrationDeadline)
      : null;
    const eventStart = new Date(event.startDateTime);

    return {
      ...event,
      isUserRegistered,
      canRegister:
        event.requiresRegistration &&
        event.status === 'REGISTRATION_OPEN' &&
        eventStart > now &&
        (!event.maxAttendees || event.currentAttendees < event.maxAttendees),
      registrationDeadlinePassed: registrationDeadline
        ? registrationDeadline < now
        : false,
    };
  }

  // Get User's Events Statistics
  getUserEventStats(): Observable<EventStats> {
    // This would typically be a separate API endpoint
    return this.getEvents({ myEvents: true }).pipe(
      map((response) => ({
        totalEvents: response.totalElements,
        upcomingEvents: response.events.filter(
          (e) => new Date(e.startDateTime) > new Date()
        ).length,
        myEvents: response.totalElements,
        attendedEvents: response.events.filter((e) => e.status === 'COMPLETED')
          .length,
        hostedEvents: response.events.length,
      }))
    );
  }

  // Check if user can edit event (assuming user is organizer)
  canUserEditEvent(event: Event, currentUserId: number): boolean {
    return event.organizer.id === currentUserId;
  }

  // Check if event registration is open
  isRegistrationOpen(event: Event): boolean {
    const now = new Date();
    const eventStart = new Date(event.startDateTime);
    const registrationDeadline = event.registrationDeadline
      ? new Date(event.registrationDeadline)
      : eventStart;

    return (
      event.requiresRegistration &&
      event.status === 'REGISTRATION_OPEN' &&
      now < registrationDeadline &&
      (!event.maxAttendees || event.currentAttendees < event.maxAttendees)
    );
  }

  // Check if event has started
  hasEventStarted(event: Event): boolean {
    return new Date() >= new Date(event.startDateTime);
  }

  // Check if event has ended
  hasEventEnded(event: Event): boolean {
    if (!event.endDateTime) return false;
    return new Date() >= new Date(event.endDateTime);
  }

  // Format event date for display
  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get event duration
  getEventDuration(event: Event): string {
    if (!event.endDateTime) return 'Duration not specified';

    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hours`;
    return `${hours}h ${minutes}m`;
  }

  // Update local filters
  updateFilters(filters: EventFilters): void {
    this.filtersSubject.next(filters);
  }

  // Clear all filters
  clearFilters(): void {
    this.filtersSubject.next({});
  }

  // Refresh events list
  refreshEvents(): void {
    const currentFilters = this.filtersSubject.value;
    this.getEvents(currentFilters).subscribe();
  }
}
