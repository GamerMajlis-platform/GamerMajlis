export interface ITournaments {
  id: number;
  name: string;
  description: string;
  gameTitle: string;
  gameMode: string;
  tournamentType: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  status: string;
  isPublic: boolean;
  organizer: Organizer;
  moderators: Moderator[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  requiresApproval?: boolean;
}

export interface Organizer {
  id: number;
  displayName: string;
  profilePictureUrl: string;
}

export interface Moderator {
  id: number;
  displayName: string;
}

export interface CreateTournamentDto {
  name: string;
  description: string;
  gameTitle: string;
  gameMode: string;
  tournamentType: string;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  status: string;
  isPublic: boolean;
  requiresApproval: boolean;
}

export interface UpdateTournamentDto {
  name?: string;
  description?: string;
  maxParticipants?: number;
  prizePool?: number;
  registrationDeadline?: string;
  status?: string;
  [key: string]: any;
}

export interface TournamentParticipant {
  id: number;
  participant: {
    id: number;
    displayName: string;
    profilePictureUrl: string;
  };
  status: string;
  registeredAt: string;
  checkedIn: boolean;
  disqualified: boolean;
  wins: number;
  losses: number;
}

export interface ParticipationDetails {
  id: number;
  tournament: {
    id: number;
    name: string;
  };
  participant: {
    id: number;
    displayName: string;
    profilePictureUrl: string;
  };
  status: string;
  registeredAt: string;
  checkedIn: boolean;
  disqualified: boolean;
  disqualificationReason: string | null;
  wins: number;
  losses: number;
  currentRound: number;
}
