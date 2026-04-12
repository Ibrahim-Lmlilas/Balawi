import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto bg-white border-[6px] border-balawi-bg shadow-[20px_20px_0px_0px_#ef4444] p-12">
        <div class="flex items-center gap-6 mb-10 pb-6 border-b-[4px] border-balawi-bg">
          <div class="w-16 h-16 bg-red-500 text-white flex items-center justify-center border-[4px] border-balawi-bg shadow-[6px_6px_0px_0px_#0B0B0B]">
            <mat-icon class="!text-4xl">cancel</mat-icon>
          </div>
          <h1 class="text-3xl md:text-5xl font-heading text-balawi-bg uppercase tracking-tight italic leading-none">
            PAIEMENT <span class="bg-red-500 text-white px-2">ANNULÉ</span>
          </h1>
        </div>

        <p class="font-slogan text-lg text-balawi-bg leading-relaxed uppercase tracking-wider">
          LE PAIEMENT A ÉTÉ ANNULÉ. UNE COMMANDE A PU ÊTRE CRÉÉE ET L’ARTICLE PEUT ÊTRE TEMPORAIREMENT RÉSERVÉ. SI L’ARTICLE N’APPARAÎT PLUS, RÉESSAYE DANS QUELQUES MINUTES.
        </p>

        <div *ngIf="itemId" class="mt-6 font-heading text-xs text-balawi-bg/30 uppercase tracking-widest">
          ARTICLE: #{{ itemId }}<span *ngIf="orderId"> — COMMANDE: #{{ orderId }}</span>
        </div>

        <div class="mt-12 flex flex-col gap-6">
          <button
            *ngIf="orderId && isLoggedIn()"
            type="button"
            (click)="cancelReservation()"
            [disabled]="isCancelling()"
            class="w-full py-5 bg-red-500 text-white font-heading text-xl uppercase tracking-widest border-[4px] border-balawi-bg shadow-[10px_10px_0px_0px_#0B0B0B] hover:shadow-none hover:translate-x-[10px] hover:translate-y-[10px] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            <mat-icon *ngIf="!isCancelling()">delete_sweep</mat-icon>
            <div *ngIf="isCancelling()" class="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ isCancelling() ? 'ANNULATION…' : 'ANNULER LA RÉSERVATION' }}
          </button>

          <div class="flex flex-col sm:flex-row gap-4">
            <a *ngIf="itemId" [routerLink]="['/items', itemId]" 
               class="flex-1 py-4 border-[4px] border-balawi-bg font-heading text-sm uppercase tracking-widest text-balawi-bg hover:bg-balawi-neon transition-all text-center">
              VOIR L'ARTICLE
            </a>
            <a routerLink="/" 
               class="flex-1 py-4 bg-balawi-neon text-balawi-bg border-[4px] border-balawi-bg font-heading text-sm uppercase tracking-widest transition-all text-center">
              RETOUR ACCUEIL
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentCancelComponent {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  itemId: number | null;
  orderId: number | null;

  isLoggedIn = signal(false);
  isCancelling = signal(false);

  constructor(route: ActivatedRoute) {
    const itemIdParam = route.snapshot.queryParamMap.get('itemId');
    const orderIdParam = route.snapshot.queryParamMap.get('orderId');

    this.itemId = itemIdParam ? Number(itemIdParam) : null;
    this.orderId = orderIdParam ? Number(orderIdParam) : null;

    this.isLoggedIn.set(this.authService.isLoggedIn());
  }

  cancelReservation() {
    if (!this.orderId) return;
    if (!this.isLoggedIn()) return;
    if (this.isCancelling()) return;

    this.isCancelling.set(true);

    this.orderService.cancelOrder(this.orderId).subscribe({
      next: () => {
        this.isCancelling.set(false);
      },
      error: (err) => {
        console.error('Error cancelling order', err);
        this.isCancelling.set(false);
      }
    });
  }
}
