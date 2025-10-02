import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';

// User interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  profilePictureUrl?: string;
  bio?: string;
  location?: string;
  gamingInterests?: string[];
  totalScore: number;
  level: number;
  joinDate: string;
  lastActiveDate: string;
  isOnline: boolean;
  currentGame?: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  followers: number;
  following: number;
  friendsCount: number;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  profilePictureUrl?: string;
  role: 'ADMIN' | 'USER';
  isOnline: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  currentGame?: string;
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    showOnlineStatus: boolean;
  };
}

export interface OnlineUser {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
  status: 'ONLINE' | 'IN_GAME' | 'AWAY';
  currentGame?: string;
  lastSeen?: string;
}

// API Response interfaces
export interface UserResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface UsersListResponse {
  success: boolean;
  message: string;
  users: User[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OnlineUsersResponse {
  success: boolean;
  message: string;
  onlineUsers: OnlineUser[];
  count: number;
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;
  user: CurrentUser;
}

export interface UserFilters {
  search?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  gameTitle?: string;
  minLevel?: number;
  maxLevel?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:8080/api';

  // Get current authenticated user
  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.baseUrl}/users/me`);
  }

  // Get user profile by ID
  getUserProfile(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${userId}`);
  }

  // Get online users for chat
  getOnlineUsers(filters?: UserFilters): Observable<OnlineUsersResponse> {
    let params = new HttpParams();

    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.gameTitle) {
      params = params.set('gameTitle', filters.gameTitle);
    }

    return this.http
      .get<OnlineUsersResponse>(`${this.baseUrl}/users/online`, { params })
      .pipe(
        catchError((error) => {
          console.warn('Failed to fetch online users, using mock data:', error);

          // Return mock data as fallback
          const mockUsers: OnlineUser[] = [
            {
              id: 1,
              displayName: 'GamerPro',
              profilePictureUrl: '/images/user4.jpg',
              status: 'ONLINE',
              currentGame: 'Call of Duty',
            },
            {
              id: 2,
              displayName: 'FifaKing',
              profilePictureUrl: '/images/user4.jpg',
              status: 'IN_GAME',
              currentGame: 'FIFA 24',
            },
            {
              id: 3,
              displayName: 'RocketLeaguer',
              profilePictureUrl: '/images/user4.jpg',
              status: 'ONLINE',
            },
            {
              id: 4,
              displayName: 'ApexLegend',
              profilePictureUrl: '/images/user4.jpg',
              status: 'AWAY',
            },
            {
              id: 5,
              displayName: 'MinecraftBuilder',
              profilePictureUrl: '/images/user4.jpg',
              status: 'ONLINE',
              currentGame: 'Minecraft',
            },
          ];

          const mockResponse: OnlineUsersResponse = {
            success: true,
            message: 'Mock online users loaded',
            onlineUsers: mockUsers,
            count: mockUsers.length,
          };

          return of(mockResponse);
        })
      );
  }

  // Search users
  searchUsers(
    query: string,
    page: number = 0,
    size: number = 20
  ): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<UsersListResponse>(`${this.baseUrl}/users/search`, {
      params,
    });
  }

  // Update user status (online, in-game, etc.)
  updateUserStatus(
    status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY',
    currentGame?: string
  ): Observable<{ success: boolean; message: string }> {
    const body: any = { status };
    if (currentGame) {
      body.currentGame = currentGame;
    }

    return this.http.patch<{ success: boolean; message: string }>(
      `${this.baseUrl}/users/me/status`,
      body
    );
  }

  // Get user friends (for direct messaging)
  getUserFriends(
    page: number = 0,
    size: number = 50
  ): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<UsersListResponse>(
      `${this.baseUrl}/users/me/friends`,
      { params }
    );
  }

  // Send friend request
  sendFriendRequest(
    userId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/users/${userId}/friend-request`,
      {}
    );
  }

  // Accept friend request
  acceptFriendRequest(
    userId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.baseUrl}/users/me/friend-requests/${userId}/accept`,
      {}
    );
  }

  // Decline friend request
  declineFriendRequest(
    userId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.baseUrl}/users/me/friend-requests/${userId}/decline`,
      {}
    );
  }

  // Get current user ID (helper method)
  getCurrentUserId(): number | null {
    return this.authService.getCurrentUserId();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
