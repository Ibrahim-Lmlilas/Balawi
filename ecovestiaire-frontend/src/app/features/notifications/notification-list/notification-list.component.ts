import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../services/notification.service';
import { ChatService } from '../../../services/chat.service';
import { Notification, NotificationType } from '../../../models/notification.model';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="min-h-screen bg-white">
      <div class="max-w-lg mx-auto px-4 sm:px-6 py-10 md:py-16">
        
        <!-- HEADER -->
        <div class="mb-10 border-b-[6px] border-balawi-bg pb-5 flex items-end justify-between gap-6">
          <div class="space-y-3">
            <h1 class="text-3xl md:text-5xl font-heading text-balawi-bg uppercase tracking-tighter leading-none italic">
              ALERTES <span class="text-balawi-neon bg-balawi-bg px-3">BALAWI</span>
            </h1>
            <div class="w-24 h-2 bg-balawi-neon"></div>
          </div>
          <div *ngIf="(notificationService.unreadCount$ | async) || 0 > 0"
               class="px-4 py-2 bg-balawi-neon border-[3px] border-balawi-bg font-heading text-xl text-balawi-bg uppercase shadow-[4px_4px_0px_0px_#0B0B0B] italic">
            {{ notificationService.unreadCount$ | async }}
          </div>
        </div>

        <!-- CONTENT BOX -->
        <div class="border-[4px] border-balawi-bg bg-white overflow-hidden shadow-[12px_12px_0px_0px_#A3FF12] relative min-h-[400px] flex flex-col">
          
          <div *ngIf="isLoading()" class="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12">
            <div class="brutalist-loader">
              <div class="loader-box bg-balawi-neon"></div>
              <div class="loader-box bg-balawi-neon"></div>
              <div class="loader-box bg-balawi-neon"></div>
            </div>
            <p class="mt-8 font-heading text-balawi-bg uppercase tracking-[0.3em] animate-pulse text-[10px] italic font-bold">SYNCHRONISATION DES FLUX...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && (notificationService.notifications$ | async)?.length === 0" class="p-12 md:p-16 text-center flex-1 flex flex-col items-center justify-center">
            <div class="w-16 h-16 bg-balawi-bg text-balawi-neon flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_#A3FF12] rotate-12">
              <mat-icon class="!text-3xl !w-8 !h-8">notifications_off</mat-icon>
            </div>
            <h3 class="text-2xl font-heading text-balawi-bg uppercase mb-3 italic">ZÉRO ALERTE</h3>
            <p class="font-slogan text-[10px] text-balawi-bg/40 uppercase tracking-[0.2em] mb-8 font-bold max-w-xs leading-relaxed">VOTRE RADAR EST VIDE POUR LE MOMENT.</p>
            <button routerLink="/" class="px-8 py-3 bg-balawi-bg text-balawi-neon font-heading text-lg uppercase tracking-widest hover:bg-balawi-neon hover:text-balawi-bg transition-all italic border-[3px] border-balawi-bg">
              EXPLORER →
            </button>
          </div>

          <!-- List -->
          <div *ngIf="!isLoading() && (notificationService.notifications$ | async) as notifications" class="flex-1 flex flex-col">
            <div class="divide-y-[3px] divide-balawi-bg">
              <div 
                *ngFor="let notif of notifications.slice(currentPage() * pageSize, (currentPage() + 1) * pageSize)"
                (click)="handleNotificationClick(notif)"
                class="p-4 md:p-5 hover:bg-balawi-neon/20 cursor-pointer transition-all flex items-center gap-4 group relative overflow-hidden"
                [ngClass]="notif.isRead ? 'bg-white' : 'bg-balawi-neon/5'"
              >
                <!-- Unread Neon Strip -->
                <div *ngIf="!notif.isRead" class="absolute left-0 top-0 bottom-0 w-2 bg-balawi-neon border-r-[3px] border-balawi-bg shadow-[4px_0_15px_rgba(163,255,18,0.5)]"></div>

                <div 
                  class="w-12 h-12 md:w-14 md:h-14 border-[3px] border-balawi-bg flex items-center justify-center shrink-0 transition-all group-hover:-rotate-6 shadow-[3px_3px_0px_0px_#0B0B0B] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1"
                  [ngClass]="getBrutalistIconBg(notif.type)"
                >
                  <mat-icon class="!text-xl !w-6 !h-6 flex items-center justify-center" [ngClass]="getBrutalistIconColor(notif.type)">
                    {{ getIconName(notif.type) }}
                  </mat-icon>
                </div>
                
                <div class="flex-1 min-w-0 py-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span *ngIf="!notif.isRead" class="px-2 py-0.5 bg-balawi-bg text-balawi-neon font-heading text-[8px] uppercase tracking-widest italic animate-pulse">NOUVEAU</span>
                    <span class="text-[9px] font-heading text-balawi-bg/30 uppercase tracking-[0.2em] italic font-bold">
                      {{ notif.createdAt | date:'HH:mm · dd/MM/yy' }}
                    </span>
                  </div>
                  <p class="text-sm md:text-base font-slogan text-balawi-bg leading-tight uppercase tracking-tight group-hover:translate-x-1 transition-transform italic" 
                     [class.font-black]="!notif.isRead" [class.font-medium]="notif.isRead">
                    {{ notif.message }}
                  </p>
                </div>

                <mat-icon class="!text-lg !w-5 !h-5 text-balawi-bg/20 group-hover:text-balawi-bg group-hover:translate-x-1 transition-all">chevron_right</mat-icon>
              </div>
            </div>

            <!-- PAGINATION -->
            <div *ngIf="notifications.length > pageSize" class="mt-auto p-4 md:p-5 bg-gray-50 border-t-[4px] border-balawi-bg flex items-center justify-between">
              <button 
                [disabled]="currentPage() === 0"
                (click)="prevPage(); $event.stopPropagation()"
                class="px-5 py-2 font-heading text-sm uppercase tracking-widest transition-all border-[3px] border-balawi-bg shadow-[4px_4px_0px_0px_#0B0B0B] disabled:opacity-30 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 hover:bg-balawi-neon active:scale-95 italic"
              >
                ← PRÉC
              </button>
              
              <div class="font-heading text-base text-balawi-bg uppercase tracking-tighter italic">
                PAGE {{ currentPage() + 1 }} / {{ Math.ceil(notifications.length / pageSize) }}
              </div>

              <button 
                [disabled]="(currentPage() + 1) * pageSize >= notifications.length"
                (click)="nextPage(); $event.stopPropagation()"
                class="px-5 py-2 font-heading text-sm uppercase tracking-widest transition-all border-[3px] border-balawi-bg shadow-[4px_4px_0px_0px_#0B0B0B] disabled:opacity-30 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 hover:bg-balawi-neon active:scale-95 italic"
              >
                SUIV →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .brutalist-loader {
      display: flex;
      gap: 12px;
    }
    .loader-box {
      width: 24px;
      height: 24px;
      border: 4px solid #0B0B0B;
      animation: brutalist-bounce 0.6s infinite alternate;
    }
    .loader-box:nth-child(2) { animation-delay: 0.2s; }
    .loader-box:nth-child(3) { animation-delay: 0.4s; }
    @keyframes brutalist-bounce {
      to { transform: translateY(-20px) rotate(45deg); background-color: #A3FF12; }
    }
  `]
})
export class NotificationListComponent implements OnInit, OnDestroy {
  public notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private chatService = inject(ChatService);

  isLoading = signal(true);
  currentPage = signal(0);
  pageSize = 5;
  Math = Math;
  private wsSubscription?: Subscription;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.notificationService.fetchNotifications(false).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching notifications', err);
        this.isLoading.set(false);
      }
    });

    this.wsSubscription = this.chatService.message$.subscribe(() => {
        // Optionnel : on pourrait rafraîchir ici
    });
  }

  ngOnDestroy() {
    this.wsSubscription?.unsubscribe();
  }

  prevPage() {
    if (this.currentPage() > 0) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    this.currentPage.update(p => p + 1);
  }

  handleNotificationClick(notif: Notification) {
    notif.isRead = true;
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => console.log(`Notification ${notif.id} marked as read`),
      error: (err) => console.error(`Error marking notification ${notif.id} as read`, err)
    });

    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  getIconName(type: NotificationType): string {
    switch (type) {
      case NotificationType.NEW_FOLLOW: return 'person_add';
      case NotificationType.ITEM_LIKED: return 'favorite';
      case NotificationType.NEW_COMMENT: return 'chat_bubble';
      case NotificationType.NEW_ORDER: return 'shopping_bag';
      case NotificationType.NEW_MESSAGE: return 'chat';
      default: return 'notifications';
    }
  }

  getBrutalistIconBg(type: NotificationType): string {
    switch (type) {
      case NotificationType.NEW_FOLLOW: return 'bg-white';
      case NotificationType.ITEM_LIKED: return 'bg-white';
      case NotificationType.NEW_COMMENT: return 'bg-balawi-neon';
      case NotificationType.NEW_ORDER: return 'bg-balawi-neon';
      case NotificationType.NEW_MESSAGE: return 'bg-white';
      default: return 'bg-gray-50';
    }
  }

  getBrutalistIconColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.NEW_FOLLOW: return 'text-balawi-bg';
      case NotificationType.ITEM_LIKED: return 'text-red-500';
      case NotificationType.NEW_COMMENT: return 'text-balawi-bg';
      case NotificationType.NEW_ORDER: return 'text-balawi-bg';
      case NotificationType.NEW_MESSAGE: return 'text-balawi-bg';
      default: return 'text-balawi-bg';
    }
  }
}

