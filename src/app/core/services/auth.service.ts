import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, UserSession } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/v1/auth';

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario_actual';

  // Señales reactivas para uso instantáneo en componentes
  currentUser = signal<UserSession | null>(this.obtenerUsuarioAlmacenado());
  isAuthenticated = signal<boolean>(!!this.getToken());

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);

          const user: UserSession = {
            nombreCompleto: response.nombreCompleto,
            dni: response.dni,
            rol: response.rol
          };

          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private obtenerUsuarioAlmacenado(): UserSession | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }
}
