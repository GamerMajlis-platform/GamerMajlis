// Event Management Interfaces

export type EventType =
  | 'TOURNAMENT'
  | 'COMMUNITY_GATHERING'
  | 'WORKSHOP'
  | 'MEETUP';
export type LocationType = 'VIRTUAL' | 'PHYSICAL' | 'HYBRID';
export type EventStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';
export type AttendanceStatus =
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface EventOrganizer {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  eventType: EventType;
  locationType: LocationType;
  virtualLink?: string;
  virtualPlatform?: string;
  physicalAddress?: string;
  physicalVenue?: string;
  maxAttendees?: number;
  currentAttendees: number;
  requiresRegistration: boolean;
  registrationDeadline?: string;
  registrationRequirements?: string;
  isPublic: boolean;
  gameTitle?: string;
  gameCategory?: string;
  competitive: boolean;
  entryFee?: number;
  currency?: string;
  ageRestriction?: number;
  status: EventStatus;
  organizer: EventOrganizer;
  viewCount: number;
  interestedCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EventAttendance {
  id: number;
  eventId: number;
  userId: number;
  user: {
    id: number;
    displayName: string;
    profilePictureUrl?: string;
  };
  status: AttendanceStatus;
  registeredAt: string;
  checkedInAt?: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  eventType?: EventType;
  locationType?: LocationType;
  virtualLink?: string;
  virtualPlatform?: string;
  physicalAddress?: string;
  physicalVenue?: string;
  maxAttendees?: number;
  requiresRegistration?: boolean;
  registrationDeadline?: string;
  registrationRequirements?: string;
  isPublic?: boolean;
  gameTitle?: string;
  gameCategory?: string;
  competitive?: boolean;
  entryFee?: number;
  ageRestriction?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface EventFilters {
  eventType?: EventType;
  gameCategory?: string;
  locationType?: LocationType;
  myEvents?: boolean;
  upcoming?: boolean;
  competitive?: boolean;
  freeEvents?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface EventSearchParams extends EventFilters {
  query?: string;
  page?: number;
  size?: number;
}

export interface EventListResponse {
  success: boolean;
  message: string;
  events: Event[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface EventResponse {
  success: boolean;
  message: string;
  event: Event;
}

export interface AttendeesResponse {
  success: boolean;
  message: string;
  attendees: EventAttendance[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  attendance?: EventAttendance;
  checkedInAt?: string;
}

export interface TrendingEventsResponse {
  success: boolean;
  message: string;
  events: Event[];
}

// Event Form Data Interface for Forms
export interface EventFormData {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime?: Date;
  eventType: EventType;
  locationType: LocationType;
  virtualLink?: string;
  virtualPlatform?: string;
  physicalAddress?: string;
  physicalVenue?: string;
  maxAttendees?: number;
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  registrationRequirements?: string;
  isPublic: boolean;
  gameTitle?: string;
  gameCategory?: string;
  competitive: boolean;
  entryFee?: number;
  ageRestriction?: number;
}

// Event Card Display Interface
export interface EventCardData {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  eventType: EventType;
  locationType: LocationType;
  gameCategory?: string;
  currentAttendees: number;
  maxAttendees?: number;
  competitive: boolean;
  entryFee?: number;
  organizer: EventOrganizer;
  status: EventStatus;
  isUserRegistered?: boolean;
  canRegister?: boolean;
  registrationDeadlinePassed?: boolean;
}

// Event Statistics Interface
export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  myEvents: number;
  attendedEvents: number;
  hostedEvents: number;
}
