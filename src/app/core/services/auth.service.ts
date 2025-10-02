import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken()
  );
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private hasToken(): boolean {
    try {
      return !!localStorage.getItem(this.storageKey);
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Demo helpers
  setToken(token: string) {
    try {
      localStorage.setItem(this.storageKey, token);
      this.isAuthenticatedSubject.next(true);
    } catch {}
  }

  clearToken() {
    try {
      localStorage.removeItem(this.storageKey);
      this.isAuthenticatedSubject.next(false);
    } catch {}
  }

  getCurrentUserId(): number | null {
    // This is a placeholder - in a real app, you'd decode the JWT token
    // For now, returning a mock user ID if authenticated
    return this.isAuthenticated() ? 1 : null;
  }

  getCurrentUserRole(): 'ADMIN' | 'USER' | null {
    if (!this.isAuthenticated()) return null;
    // Placeholder logic: if stored token === 'admin', treat as admin
    try {
      const token = localStorage.getItem(this.storageKey);
      return token === 'admin' ? 'ADMIN' : 'USER';
    } catch {
      return 'USER';
    }
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'ADMIN';
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }
}
