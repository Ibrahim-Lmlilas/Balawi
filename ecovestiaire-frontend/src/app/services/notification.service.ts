import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private authService = inject(AuthService);

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private normalizeNotification(raw: any, markAsRead: boolean): Notification {
    const readFromBackend =
      typeof raw?.isRead === 'boolean'
        ? raw.isRead
        : typeof raw?.read === 'boolean'
          ? raw.read
          : false;

    return {
      id: raw?.id,
      type: raw?.type,
      message: raw?.message,
      link: raw?.link,
      isRead: markAsRead ? true : readFromBackend,
      createdAt: raw?.createdAt
    } as Notification;
  }

  constructor() {
    // Refresh notifications when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.fetchNotifications().subscribe();
      } else {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  fetchNotifications(markAsRead: boolean = false): Observable<Notification[]> {
    let params = new HttpParams();
    if (markAsRead) {
      params = params.set('markAsRead', 'true');
    }

    return this.http.get<any[]>(`${this.baseUrl}/notifications`, { params }).pipe(
      tap((rows) => {
        console.log('Notifications received (markAsRead=' + markAsRead + '):', rows);

        const processed = (rows || []).map((r) => this.normalizeNotification(r, markAsRead));
        this.notificationsSubject.next(processed);
        const unread = processed.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unread);
      })
    );
  }

  markAllAsRead(): Observable<Notification[]> {
    return this.fetchNotifications(true);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        const unread = updatedNotifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unread);
      })
    );
  }
}
