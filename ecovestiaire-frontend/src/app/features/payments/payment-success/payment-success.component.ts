import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto bg-white border-[6px] border-balawi-bg shadow-[20px_20px_0px_0px_#A3FF12] p-12">
        <div class="flex items-center gap-4 md:gap-6 mb-10 pb-6 border-b-[4px] border-balawi-bg">
          <div class="w-12 h-12 md:w-16 md:h-16 bg-balawi-neon text-balawi-bg flex items-center justify-center border-[4px] border-balawi-bg shadow-[4px_4px_0px_0px_#0B0B0B] md:shadow-[6px_6px_0px_0px_#0B0B0B] flex-shrink-0">
            <mat-icon class="!text-2xl md:!text-4xl !w-auto !h-auto">check_circle</mat-icon>
          </div>
          <h1 class="text-2xl md:text-4xl font-heading text-balawi-bg uppercase tracking-tight italic leading-none">
            PAIEMENT <span class="bg-balawi-bg text-balawi-neon px-2">CONFIRMÉ</span>
          </h1>
        </div>

        <p class="font-slogan text-lg text-balawi-bg leading-relaxed uppercase tracking-wider">
          MERCI ! VOTRE PAIEMENT A ÉTÉ PRIS EN COMPTE. SI LE STATUT N’APPARAÎT PAS IMMÉDIATEMENT, IL SERA MIS À JOUR AUTOMATIQUEMENT DANS QUELQUES INSTANTS.
        </p>

        <div *ngIf="itemId" class="mt-6 font-heading text-xs text-balawi-bg/30 uppercase tracking-widest">
          ARTICLE: #{{ itemId }}<span *ngIf="orderId"> — COMMANDE: #{{ orderId }}</span>
        </div>

        <div class="mt-12 flex flex-col gap-6">
          <a routerLink="/" 
             class="w-full py-5 bg-balawi-neon text-balawi-bg font-heading text-xl uppercase tracking-widest border-[4px] border-balawi-bg shadow-[10px_10px_0px_0px_#0B0B0B] hover:shadow-none hover:translate-x-[10px] hover:translate-y-[10px] transition-all flex items-center justify-center gap-4">
            RETOUR À L’ACCUEIL
          </a>
          <div class="flex flex-col sm:flex-row gap-4">
            <a *ngIf="itemId" [routerLink]="['/items', itemId]" 
               class="flex-1 py-4 border-[4px] border-balawi-bg font-heading text-sm uppercase tracking-widest text-balawi-bg hover:bg-balawi-neon transition-all text-center">
              VOIR L'ARTICLE
            </a>
            <a routerLink="/favorites" 
               class="flex-1 py-4 border-[4px] border-balawi-bg font-heading text-sm uppercase tracking-widest text-balawi-bg hover:bg-balawi-neon transition-all text-center">
              MES FAVORIS
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentSuccessComponent {
  itemId: number | null;
  orderId: number | null;

  constructor(route: ActivatedRoute) {
    const itemIdParam = route.snapshot.queryParamMap.get('itemId');
    const orderIdParam = route.snapshot.queryParamMap.get('orderId');

    this.itemId = itemIdParam ? Number(itemIdParam) : null;
    this.orderId = orderIdParam ? Number(orderIdParam) : null;
  }
}
