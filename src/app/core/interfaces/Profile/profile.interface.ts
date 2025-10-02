export interface User {
  id: number;
  displayName: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  gamingPreferences?: string; // JSON string
  socialLinks?: string; // JSON string
  gamingStatistics?: string; // JSON string
  roles: UserRole[];
  discordUsername?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  privacySettings?: string; // JSON string
  emailVerified?: boolean;
  isOnline?: boolean;
}

export type UserRole =
  | 'REGULAR_GAMER'
  | 'TOURNAMENT_ORGANIZER'
  | 'MODERATOR'
  | 'ADMIN';

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  gamingPreferences?: string; // JSON string
  socialLinks?: string; // JSON string
  privacySettings?: string; // JSON string
}

export interface GamingStatistics {
  totalGames?: number;
  winRate?: number;
  favoriteGames?: string[];
  favoriteMap?: string;
  rankAchievements?: string[];
  totalWins?: number;
  totalLosses?: number;
  averageKDA?: number;
  hoursPlayed?: number;
}

export interface SocialLinks {
  twitter?: string;
  twitch?: string;
  youtube?: string;
  instagram?: string;
  discord?: string;
}

export interface GamingPreferences {
  favoriteGames?: string[];
  preferredGameModes?: string[];
  playStyle?: string;
  availableHours?: string[];
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
}

export interface PrivacySettings {
  profileVisible?: boolean;
  showEmail?: boolean;
  showGamingStats?: boolean;
  showSocialLinks?: boolean;
  allowDirectMessages?: boolean;
  showOnlineStatus?: boolean;
}

export interface ProfileSearchResponse {
  success: boolean;
  message: string;
  profiles: ProfileSearchResult[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProfileSearchResult {
  id: number;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  roles: UserRole[];
  createdAt: string;
}

export interface ProfileSuggestionsResponse {
  success: boolean;
  message: string;
  suggestions: ProfileSuggestion[];
}

export interface ProfileSuggestion {
  id: number;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  commonInterests?: string[];
  mutualConnections?: number;
  matchScore?: number;
}

export interface ProfilePictureResponse {
  success: boolean;
  message: string;
  profilePictureUrl?: string;
}

export interface GamingStatsUpdateResponse {
  success: boolean;
  message: string;
  gamingStatistics: string; // JSON string
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
