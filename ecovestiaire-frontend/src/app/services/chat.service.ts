import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import {
  ConversationSummaryResponse,
  MessageResponse,
  SendMessageRequest,
  StartConversationRequest
} from '../models/chat.model';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private stompClient: Client | null = null;

  private messageSubject = new BehaviorSubject<MessageResponse | null>(null);
  public message$ = this.messageSubject.asObservable();

  private conversationsSubject = new BehaviorSubject<ConversationSummaryResponse[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
        this.getConversations().subscribe();
      } else {
        this.disconnect();
        this.conversationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  // --- REST API ---

  getConversations(): Observable<ConversationSummaryResponse[]> {
    return this.http.get<ConversationSummaryResponse[]>(`${this.baseUrl}/api/conversations`).pipe(
      map(convs => convs.map(c => ({
        ...c,
        otherUserProfilePhotoUrl: this.authService.toAbsoluteUrl(c.otherUserProfilePhotoUrl) || ''
      }))),
      tap(convs => {
        this.conversationsSubject.next(convs);
        const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this.unreadCountSubject.next(totalUnread);
      })
    );
  }

  getConversationMessages(id: number, page: number = 0, size: number = 20): Observable<MessageResponse[]> {
    return this.http.get<any>(`${this.baseUrl}/api/conversations/${id}/messages`, {
      params: { page: page.toString(), size: size.toString() }
    }).pipe(
      map(response => {
        if (response && Array.isArray(response.content)) {
          return response.content;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  startConversation(request: StartConversationRequest): Observable<ConversationSummaryResponse> {
    return this.http.post<ConversationSummaryResponse>(`${this.baseUrl}/api/conversations`, request);
  }

  sendMessage(conversationId: number, content: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/api/conversations/${conversationId}/messages`, { content });
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/conversations/messages/${messageId}`);
  }

  updateMessage(messageId: number, content: string): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/api/conversations/messages/${messageId}`, { content });
  }

  // --- WebSocket (STOMP) ---

  private connect() {
    const token = this.authService.getToken();
    if (!token) return;

    // URL absolue qui fonctionne en Docker (via nginx proxy) ET en dev (via proxy Angular)
    const wsUrl = `${window.location.protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    console.log('Connecting to WebSocket via SockJS...', wsUrl);

    this.stompClient = new Client({
      webSocketFactory: () => {
        return new SockJS(wsUrl);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('STOMP Connected: ' + frame);

      // Subscribe aux messages du chat privé
      this.stompClient?.subscribe('/user/queue/chat', (message: Message) => {
        if (message.body) {
          const msg: MessageResponse = JSON.parse(message.body);
          console.log('Message received via WS:', msg);
          this.messageSubject.next(msg);
          this.getConversations().subscribe();
        }
      });

      // Subscribe aux notifications
      this.stompClient?.subscribe('/user/queue/notifications', (message: Message) => {
        console.log('Notification received via WS:', message.body);
        this.notificationService.fetchNotifications().subscribe();
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  private disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}

