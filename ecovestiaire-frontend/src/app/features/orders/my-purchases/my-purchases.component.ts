import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, OrderResponse } from '../../../services/order.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './my-purchases.component.html'
})
export class MyPurchasesComponent implements OnInit {
  private orderService = inject(OrderService);
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 6;

  ngOnInit() {
    this.loadPurchases();
  }

  loadPurchases() {
    this.loading.set(true);
    this.orderService.getMyPurchases(this.currentPage(), this.pageSize).subscribe({
      next: (res) => {
        this.orders.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadPurchases();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING_PAYMENT': return 'En attente de paiement';
      case 'PAID': return 'Payé - En attente d\'expédition';
      case 'COMPLETED': return 'Commande terminée';
      case 'CANCELLED': return 'Commande annulée';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
      case 'COMPLETED': return 'bg-balawi-neon text-balawi-bg border-balawi-bg';
      case 'PENDING_PAYMENT': return 'bg-white text-balawi-bg border-balawi-bg';
      case 'CANCELLED': return 'bg-red-500 text-white border-balawi-bg';
      default: return 'bg-gray-100 text-balawi-bg border-balawi-bg';
    }
  }

  contactSeller(order: OrderResponse) {
    if (!order.sellerId) return;

    this.chatService.startConversation({
      targetUserId: order.sellerId,
      itemId: order.itemId
    }).subscribe({
      next: (conv) => {
        this.router.navigate(['/messages', conv.id]);
      },
      error: (err) => {
        console.error('Erreur lors du démarrage de la conversation', err);
      }
    });
  }
}
