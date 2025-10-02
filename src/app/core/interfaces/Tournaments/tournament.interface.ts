export interface Tournament {
  id: number;
  name: string;
  description: string;
  gameTitle: string;
  gameMode: string;
  tournamentType: 'ELIMINATION' | 'ROUND_ROBIN' | 'SWISS';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  status: TournamentStatus;
  isPublic: boolean;
  requiresApproval?: boolean;
  organizer: TournamentOrganizer;
  moderators?: TournamentModerator[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentOrganizer {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface TournamentModerator {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface TournamentParticipation {
  id: number;
  tournament: {
    id: number;
    name: string;
  };
  participant: TournamentParticipant;
  status: ParticipationStatus;
  registeredAt: string;
  checkedIn: boolean;
  disqualified: boolean;
  disqualificationReason?: string;
  wins?: number;
  losses?: number;
  currentRound?: number;
}

export interface TournamentParticipant {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface CreateTournamentRequest {
  name: string;
  description: string;
  gameTitle: string;
  gameMode: string;
  tournamentType: 'ELIMINATION' | 'ROUND_ROBIN' | 'SWISS';
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  status: TournamentStatus;
  isPublic: boolean;
  requiresApproval?: boolean;
}

export interface UpdateTournamentRequest {
  name?: string;
  description?: string;
  maxParticipants?: number;
  prizePool?: number;
  registrationDeadline?: string;
  rules?: string;
  status?: TournamentStatus;
}

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParticipationStatus =
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'ELIMINATED'
  | 'WINNER'
  | 'DISQUALIFIED';

export interface TournamentListItem {
  id: number;
  name: string;
  gameTitle: string;
  status: TournamentStatus;
  currentParticipants: number;
  maxParticipants: number;
  startDate: string;
  prizePool: number;
  currency: string;
  organizer: {
    id: number;
    displayName: string;
  };
}

export interface TournamentFilters {
  gameTitle?: string;
  status?: TournamentStatus;
  organizerId?: number;
  search?: string;
  minPrizePool?: number;
  maxPrizePool?: number;
}
