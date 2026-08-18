import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
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

  private _currentUser = signal<User | null>(this.loadFromStorage());
  currentUser = this._currentUser.asReadonly();

  isAuthenticated() {
    return this._currentUser() !== null;
  }

  login(email: string, password: string) {
    return this.http.post<User>(`${this.api}/login`, { email, password });
  }

  register(payload: RegisterPayload) {
    return this.http.post<{ message: string; userId: number }>(`${this.api}/register`, payload);
  }

  setCurrentUser(user: User) {
    localStorage.setItem('hcf_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('hcf_user');
    this._currentUser.set(null);
  }

  private loadFromStorage(): User | null {
    const raw = localStorage.getItem('hcf_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}