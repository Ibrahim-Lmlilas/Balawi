import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';
import { UserProfileResponse } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = inject(API_BASE_URL);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (token && savedUser && !this.isTokenExpired(token)) {
      const user = JSON.parse(savedUser);
      if (user.profilePhotoUrl) {
        user.profilePhotoUrl = this.toAbsoluteUrl(user.profilePhotoUrl) || undefined;
      }
      this.currentUserSubject.next(user);
    } else if (savedUser || token) {
      // Token is expired or missing — clear storage so the user is redirected to login
      this.clearAuthStorage();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, formData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      const exp = Number(payload?.exp);
      if (!Number.isFinite(exp)) return true;

      const nowSeconds = Math.floor(Date.now() / 1000);
      return exp <= nowSeconds;
    } catch {
      return true;
    }
  }

  private clearAuthStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private normalizeUploadsPath(path: string): string {
    if (path.includes('/uploads/')) {
      const parts = path.split('/uploads/');
      return 'uploads/' + parts[parts.length - 1];
    }
    return path;
  }

  public toAbsoluteUrl(path: string | null | undefined): string {
    if (!path || path === 'null' || path === 'undefined') return '/images/default-avatar.png';
    
    // Si c'est déjà une URL complète
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Nettoyage générique si on passe par le proxy Nginx en prod
      return path.replace('/api/uploads/', '/uploads/');
    }
    
    // Déterminer la base de l'URL
    // Si baseUrl est relative (ex: /api), on reste en relatif
    if (this.baseUrl.startsWith('/')) {
      const apiBase = this.baseUrl.replace(/\/api$/, '');
      let cleaned = path.startsWith('/') ? path : '/' + path;
      
      // S'assurer qu'on utilise /uploads/ et pas /api/uploads/
      if (cleaned.startsWith('/api/uploads/')) {
        cleaned = cleaned.replace('/api/uploads/', '/uploads/');
      } else if (!cleaned.startsWith('/uploads/')) {
        // Si c'est juste un nom de fichier ou un chemin sans /uploads/
        cleaned = '/uploads/' + (cleaned.startsWith('/') ? cleaned.substring(1) : cleaned);
      }
      
      return `${apiBase}${cleaned}`.replace(/\/+/g, '/');
    }

    // Si baseUrl est absolue
    const apiBase = this.baseUrl.replace(/\/api$/, '');
    let cleaned = path;
    if (cleaned.startsWith('/api/')) cleaned = cleaned.substring(4);
    if (!cleaned.startsWith('/uploads/') && !cleaned.startsWith('uploads/')) {
      cleaned = '/uploads/' + (cleaned.startsWith('/') ? cleaned.substring(1) : cleaned);
    }
    if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;

    const finalUrl = `${apiBase}${cleaned}`.replace(/([^:]\/)\/+/g, "$1");
    return finalUrl;
  }

  public hasPhoto(path: string | null | undefined): boolean {
    if (!path || path === 'null' || path === 'undefined' || path === '') return false;
    // Vérifier si c'est une URL de placeholder
    if (path.includes('avatar-placeholder.png') || path.includes('avatar.jpg')) return false;
    return true;
  }

  public handleAuthentication(response: AuthResponse, rememberMe: boolean): void {
    const user: User = {
      id: response.userId,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      role: response.role,
      profilePhotoUrl: response.profilePhotoUrl ? (this.toAbsoluteUrl(response.profilePhotoUrl) || undefined) : undefined
    };
    
    const token = response.token;
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getUserStorage(): Storage | null {
    if (localStorage.getItem('user')) return localStorage;
    if (sessionStorage.getItem('user')) return sessionStorage;
    if (localStorage.getItem('token')) return localStorage;
    if (sessionStorage.getItem('token')) return sessionStorage;
    return null;
  }

  updateCurrentUserFromProfile(profile: UserProfileResponse): void {
    const current = this.currentUserSubject.value;
    if (!current) return;

    const updated: User = {
      ...current,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email ?? current.email,
      bio: profile.bio,
      profilePhotoUrl: profile.profilePhotoUrl ? (this.toAbsoluteUrl(profile.profilePhotoUrl) || undefined) : undefined
    };

    const storage = this.getUserStorage();
    if (storage) {
      storage.setItem('user', JSON.stringify(updated));
    }

    this.currentUserSubject.next(updated);
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.clearAuthStorage();
      return false;
    }
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
}
