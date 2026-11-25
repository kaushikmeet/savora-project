import { Injectable, signal } from '@angular/core';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth.model';
import { Api } from './api';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private readonly TOKEN_KEY = 'savora_access_token';
  private readonly USER_KEY = 'savora_user';
  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());

  constructor(
    private readonly api: Api, 
    private readonly router: Router){}

    get accessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  login(payload: LoginRequest) {
    return this.api.post<AuthResponse>('/auth/login', payload);
  }

  register(payload: RegisterRequest) {
    return this.api.post<AuthResponse>('/auth/register', payload);
  }

  saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);

    if (response.user) {
      localStorage.setItem(
        this.USER_KEY,
        JSON.stringify(response.user),
      );
      this.currentUser.set(response.user);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  private getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) as AuthUser : null;
    } catch {
      return null;
    }
  }
}
