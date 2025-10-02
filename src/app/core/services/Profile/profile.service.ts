import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  ProfileResponse,
  ProfileUpdateRequest,
  ProfilePictureResponse,
  GamingStatsUpdateResponse,
  ProfileSearchResponse,
  ProfileSuggestionsResponse,
  GamingStatistics,
} from '../../interfaces/Profile/profile.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private _HttpClient = inject(HttpClient);

  private authHeaders(): HttpHeaders | undefined {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) return new HttpHeaders({ Authorization: `Bearer ${token}` });
    } catch {}
    return undefined;
  }

  // Legacy method - keeping for compatibility
  getUserData(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    return this._HttpClient.get(`${API_BASE_URL}/auth/me`, { headers });
  }

  // 1. Get My Profile
  getMyProfile(): Observable<ProfileResponse> {
    return this._HttpClient.get<ProfileResponse>(`${API_BASE_URL}/profile/me`, {
      headers: this.authHeaders(),
    });
  }

  // 2. Get User Profile by ID
  getUserProfile(userId: number): Observable<ProfileResponse> {
    return this._HttpClient.get<ProfileResponse>(
      `${API_BASE_URL}/profile/${userId}`
    );
  }

  // 3. Update Profile
  updateProfile(
    profileData: ProfileUpdateRequest
  ): Observable<ProfileResponse> {
    const formData = new FormData();

    if (profileData.displayName) {
      formData.append('displayName', profileData.displayName);
    }
    if (profileData.bio) {
      formData.append('bio', profileData.bio);
    }
    if (profileData.gamingPreferences) {
      formData.append('gamingPreferences', profileData.gamingPreferences);
    }
    if (profileData.socialLinks) {
      formData.append('socialLinks', profileData.socialLinks);
    }
    if (profileData.privacySettings) {
      formData.append('privacySettings', profileData.privacySettings);
    }

    return this._HttpClient.put<ProfileResponse>(
      `${API_BASE_URL}/profile/me`,
      formData,
      {
        headers: this.authHeaders(),
      }
    );
  }

  // 4. Upload Profile Picture
  uploadProfilePicture(file: File): Observable<ProfilePictureResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this._HttpClient.post<ProfilePictureResponse>(
      `${API_BASE_URL}/profile/me/profile-picture`,
      formData,
      { headers: this.authHeaders() }
    );
  }

  // 5. Remove Profile Picture
  removeProfilePicture(): Observable<ProfilePictureResponse> {
    return this._HttpClient.delete<ProfilePictureResponse>(
      `${API_BASE_URL}/profile/me/profile-picture`,
      { headers: this.authHeaders() }
    );
  }

  // 6. Update Gaming Statistics
  updateGamingStatistics(
    gamingStats: GamingStatistics
  ): Observable<GamingStatsUpdateResponse> {
    const formData = new FormData();
    formData.append('gamingStatistics', JSON.stringify(gamingStats));

    return this._HttpClient.post<GamingStatsUpdateResponse>(
      `${API_BASE_URL}/profile/me/gaming-stats`,
      formData,
      { headers: this.authHeaders() }
    );
  }

  // 7. Search Profiles
  searchProfiles(
    query: string,
    page: number = 0,
    size: number = 20
  ): Observable<ProfileSearchResponse> {
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      size: size.toString(),
    });

    return this._HttpClient.get<ProfileSearchResponse>(
      `${API_BASE_URL}/profile/search?${params.toString()}`
    );
  }

  // 8. Get Profile Suggestions
  getProfileSuggestions(
    limit: number = 10
  ): Observable<ProfileSuggestionsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return this._HttpClient.get<ProfileSuggestionsResponse>(
      `${API_BASE_URL}/profile/suggestions?${params.toString()}`,
      { headers: this.authHeaders() }
    );
  }

  // Helper methods for parsing JSON strings
  parseGamingPreferences(preferencesStr?: string): any {
    if (!preferencesStr) return {};
    try {
      return JSON.parse(preferencesStr);
    } catch {
      return {};
    }
  }

  parseSocialLinks(socialLinksStr?: string): any {
    if (!socialLinksStr) return {};
    try {
      return JSON.parse(socialLinksStr);
    } catch {
      return {};
    }
  }

  parseGamingStatistics(statisticsStr?: string): any {
    if (!statisticsStr) return {};
    try {
      return JSON.parse(statisticsStr);
    } catch {
      return {};
    }
  }

  parsePrivacySettings(settingsStr?: string): any {
    if (!settingsStr) return { profileVisible: true };
    try {
      return JSON.parse(settingsStr);
    } catch {
      return { profileVisible: true };
    }
  }
}
