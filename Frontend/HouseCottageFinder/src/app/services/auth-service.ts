import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  createdAt: string;
  favoritesCount: number;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private api = '/api/auth';

  private _currentUser = signal<User | null>(null);
  currentUser = this._currentUser.asReadonly();

  private _loaded = signal(false);
  loaded = this._loaded.asReadonly();

  constructor() {
    this.restoreSession();
  }

  isAuthenticated() {
    return this._currentUser() !== null;
  }

  login(email: string, password: string) {
    return this.http.post<{ user: User }>(`${this.api}/login`, { email, password });
  }

  logout() {
    this.http.post(`${this.api}/logout`, {}).subscribe({
      next: () => {
        this._currentUser.set(null);
      },
    });
  }

  register(payload: RegisterPayload) {
    return this.http.post<{ message: string; userId: number }>(`${this.api}/register`, payload);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.api}/profile`);
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.http.put<User & { message: string }>(`${this.api}/profile`, payload);
  }

  setCurrentUser(user: User) {
    this._currentUser.set(user);
  }

  private restoreSession() {
    this.http.get<User>(`${this.api}/me`).subscribe({
      next: (user) => {
        this._currentUser.set(user);
        this._loaded.set(true);
      },
      error: () => {
        this._currentUser.set(null);
        this._loaded.set(true);
      },
    });
  }
}
