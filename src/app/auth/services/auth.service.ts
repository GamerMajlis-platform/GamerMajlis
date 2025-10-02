import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/services/api.config';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: any;
}

export interface MeResponse {
  success: boolean;
  user: any;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  private tokenKey = 'auth_token';

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
  sendEmailVerification(formData: FormData): Observable<any> {
    return this.http.post(`${API_BASE_URL}/auth/resend-verification`, formData);
  }

  signUp(formData: FormData): Observable<any> {
    return this.http.post(`${API_BASE_URL}/auth/signup`, formData);
  }

  login(formData: FormData): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, formData)
      .pipe(
        tap((res) => {
          if (res?.token) {
            localStorage.setItem(this.tokenKey, res.token);
          }
        })
      );
  }

  discordLogin(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/auth/discord/login`);
  }

  getDiscordAuthUrl(): string {
    return `${API_BASE_URL}/auth/discord/login`;
  }

  discordCallback(code: string, state: string): Observable<LoginResponse> {
    console.log(
      'Sending Discord callback request with code:',
      code,
      'and state:',
      state
    );

    if (!code) {
      throw new Error('Authorization code is required for Discord callback');
    }

    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/discord/callback`, {
        code,
        state,
      })
      .pipe(
        tap((res) => {
          console.log('Discord callback response:', res);
          if (res?.success && res?.token) {
            localStorage.setItem(this.tokenKey, res.token);
            console.log('Discord authentication token stored successfully');
          } else {
            console.warn(
              'Discord callback response missing token or success flag'
            );
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${API_BASE_URL}/auth/logout`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => localStorage.removeItem(this.tokenKey)));
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${API_BASE_URL}/auth/me`, {
      headers: this.authHeaders(),
    });
  }

  validateToken(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/auth/validate-token`, {
      headers: this.authHeaders(),
    });
  }

  // Discord account management
  linkDiscordAccount(code: string): Observable<any> {
    const form = new FormData();
    form.append('code', code);
    return this.http.post(`${API_BASE_URL}/auth/discord/link`, form, {
      headers: this.authHeaders(),
    });
  }

  unlinkDiscordAccount(): Observable<any> {
    return this.http.post(
      `${API_BASE_URL}/auth/discord/unlink`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getDiscordUserInfo(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/auth/discord/user-info`, {
      headers: this.authHeaders(),
    });
  }

  refreshDiscordToken(): Observable<any> {
    return this.http.post(
      `${API_BASE_URL}/auth/discord/refresh`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getToken(): string | null {
    try {
      console.log(localStorage.getItem(this.tokenKey));
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }
}
