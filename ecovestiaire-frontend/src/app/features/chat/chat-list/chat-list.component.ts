import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../services/chat.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-white">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        
        <!-- HEADER -->
        <div class="mb-10 border-b-[6px] border-balawi-bg pb-5 flex flex-col gap-3">
          <h1 class="text-3xl md:text-5xl font-heading text-balawi-bg uppercase tracking-tighter leading-none italic">
            MESSAGES <span class="text-balawi-neon bg-balawi-bg px-3">BALAWI</span>
          </h1>
          <div class="w-24 h-2 bg-balawi-neon"></div>
        </div>

        <div class="border-[4px] border-balawi-bg bg-white overflow-hidden shadow-[12px_12px_0px_0px_#A3FF12] relative min-h-[400px] flex flex-col">
          
          <div *ngIf="isLoading()" class="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12">
            <div class="brutalist-loader">
              <div class="loader-box bg-balawi-neon"></div>
              <div class="loader-box bg-balawi-neon"></div>
              <div class="loader-box bg-balawi-neon"></div>
            </div>
            <p class="mt-8 font-heading text-balawi-bg uppercase tracking-[0.3em] animate-pulse text-[10px] italic font-bold">CHARGEMENT DES DISCUSSIONS...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && (chatService.conversations$ | async)?.length === 0" class="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <div class="w-14 h-14 bg-balawi-bg text-balawi-neon flex items-center justify-center mx-auto mb-5 shadow-[5px_5px_0px_0px_#A3FF12] rotate-6">
              <mat-icon class="!text-2xl">chat_bubble_outline</mat-icon>
            </div>
            <h3 class="text-xl font-heading text-balawi-bg uppercase mb-2 italic">CANAL VIDE</h3>
            <p class="font-slogan text-[9px] text-balawi-bg/40 uppercase tracking-[0.2em] mb-6 font-bold leading-relaxed max-w-[180px] mx-auto">AUCUNE DISCUSSION ACTIVE.</p>
            <button routerLink="/search" class="px-6 py-2.5 bg-balawi-bg text-balawi-neon font-heading text-xs uppercase tracking-widest hover:bg-balawi-neon hover:text-balawi-bg transition-all italic border-[2px] border-balawi-bg">
              DÉCOUVRIR →
            </button>
          </div>

          <!-- List -->
          <div *ngIf="!isLoading() && (chatService.conversations$ | async) as conversations" class="flex-1 flex flex-col">
            <div class="divide-y-[2px] divide-balawi-bg">
              <a 
                *ngFor="let conv of conversations.slice(currentPage() * pageSize, (currentPage() + 1) * pageSize)"
                [routerLink]="['/messages', conv.id]"
                class="p-4 md:p-5 hover:bg-balawi-neon/15 flex items-center gap-4 transition-all group relative overflow-hidden"
              >
                <!-- Unread Neon Strip -->
                <div *ngIf="conv.unreadCount > 0 && !conv.lastMessageFromMe" class="absolute left-0 top-0 bottom-0 w-1.5 bg-balawi-neon border-r-[2px] border-balawi-bg"></div>

                <!-- Avatar -->
                <div class="relative shrink-0">
                  <div class="w-11 h-11 md:w-13 md:h-13 border-[3px] border-balawi-bg flex items-center justify-center overflow-hidden shrink-0 bg-white transition-transform group-hover:-rotate-3 shadow-[3px_3px_0px_0px_#0B0B0B]">
                    <img 
                      *ngIf="authService.hasPhoto(conv.otherUserProfilePhotoUrl); else noPhoto"
                      [src]="authService.toAbsoluteUrl(conv.otherUserProfilePhotoUrl)" 
                      class="w-full h-full object-cover"
                      [alt]="conv.otherUserFirstName"
                    >
                    <ng-template #noPhoto>
                      <mat-icon class="text-balawi-bg !text-2xl">person</mat-icon>
                    </ng-template>
                  </div>
                  <!-- Unread Count Badge -->
                  <div *ngIf="conv.unreadCount > 0" 
                       class="absolute -top-1 -right-1 w-5 h-5 bg-balawi-neon border-[2px] border-balawi-bg text-balawi-bg font-heading text-[9px] flex items-center justify-center shadow-[2px_2px_0px_0px_#0B0B0B] animate-bounce">
                    {{ conv.unreadCount }}
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col gap-0 py-0.5">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm md:text-base font-heading text-balawi-bg uppercase tracking-tight truncate group-hover:translate-x-1 transition-transform italic" [class.font-black]="conv.unreadCount > 0 && !conv.lastMessageFromMe">
                      {{ conv.otherUserFirstName }} {{ conv.otherUserLastName }}
                    </h3>
                    <span class="text-[7px] font-heading text-balawi-bg/30 uppercase tracking-widest whitespace-nowrap italic font-bold">
                      {{ conv.lastMessageAt | date:'HH:mm' }}
                    </span>
                  </div>
                  
                  <p class="font-slogan text-[9px] md:text-[10px] text-balawi-bg/60 uppercase tracking-wider truncate" [class.font-bold]="conv.unreadCount > 0 && !conv.lastMessageFromMe" [class.text-balawi-bg]="conv.unreadCount > 0 && !conv.lastMessageFromMe">
                    <span *ngIf="conv.lastMessageFromMe" class="bg-balawi-bg text-balawi-neon px-1 py-0.5 mr-1 text-[7px] tracking-widest italic">VOUS</span>
                    {{ conv.lastMessageContent }}
                  </p>
                  
                  <div class="mt-0.5 flex items-center gap-1.5">
                    <div class="px-1 py-0.5 bg-balawi-neon/20 border border-balawi-bg/10 font-heading text-[6px] uppercase tracking-widest italic font-bold">ITEM</div>
                    <span class="text-[8px] font-heading text-balawi-bg/40 uppercase tracking-tight truncate italic">{{ conv.itemTitle }}</span>
                  </div>
                </div>

                <!-- Chevron -->
                <mat-icon class="!text-lg !w-5 !h-5 text-balawi-bg/20 group-hover:text-balawi-bg group-hover:translate-x-1 transition-all">chevron_right</mat-icon>
              </a>
            </div>

            <!-- PAGINATION -->
            <div *ngIf="conversations.length > pageSize" class="mt-auto p-4 md:p-5 bg-gray-50 border-t-[3px] border-balawi-bg flex items-center justify-between">
              <button 
                [disabled]="currentPage() === 0"
                (click)="prevPage(); $event.stopPropagation()"
                class="px-5 py-2 font-heading text-xs uppercase tracking-widest transition-all border-[3px] border-balawi-bg shadow-[4px_4px_0px_0px_#0B0B0B] disabled:opacity-30 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 hover:bg-balawi-neon active:scale-95 italic"
              >
                ← PRÉC
              </button>
              
              <div class="font-heading text-sm text-balawi-bg uppercase tracking-tighter italic">
                {{ currentPage() + 1 }} / {{ Math.ceil(conversations.length / pageSize) }}
              </div>

              <button 
                [disabled]="(currentPage() + 1) * pageSize >= conversations.length"
                (click)="nextPage(); $event.stopPropagation()"
                class="px-5 py-2 font-heading text-xs uppercase tracking-widest transition-all border-[3px] border-balawi-bg shadow-[4px_4px_0px_0px_#0B0B0B] disabled:opacity-30 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 hover:bg-balawi-neon active:scale-95 italic"
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
export class ChatListComponent implements OnInit {
  public chatService = inject(ChatService);
  public authService = inject(AuthService);
  isLoading = signal(true);
  currentPage = signal(0);
  pageSize = 5;
  Math = Math;

  ngOnInit() {
    this.chatService.getConversations().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  prevPage() {
    if (this.currentPage() > 0) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    this.currentPage.update(p => p + 1);
  }
}
