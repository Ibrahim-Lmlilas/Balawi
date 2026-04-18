import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModerationService } from '../../../services/admin/admin-moderation.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OrderResponse } from '../../../services/order.service';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
  private moderationService = inject(AdminModerationService);

  orders = signal<OrderResponse[]>([]);
  allOrders = signal<OrderResponse[]>([]);
  isLoading = signal(true);
  currentPage = signal(0);
  query = signal('');
  sort = signal<'createdAt,desc' | 'createdAt,asc'>('createdAt,desc');

  // ── Pagination locale ──────────────────────────
  readonly pageSize = 6;
  page = signal(0);

  get pagedOrders(): OrderResponse[] {
    const start = this.page() * this.pageSize;
    return this.orders().slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.orders().length / this.pageSize); }
  get pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  goToPage(p: number) { if (p >= 0 && p < this.totalPages) this.page.set(p); }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.moderationService.getAllOrders(this.currentPage(), 100, {
      q: this.query().trim() || undefined,
      sort: this.sort()
    }).subscribe({
      next: (response) => {
        const rawOrders = response.content || response;
        this.allOrders.set(rawOrders);
        this.applyLocalFilter();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur chargement commandes', err);
        this.isLoading.set(false);
      }
    });
  }

  applyLocalFilter() {
    const q = this.query().toLowerCase().trim();
    let filtered = [...this.allOrders()];

    if (q) {
      filtered = filtered.filter(o =>
        o.itemTitle?.toLowerCase().includes(q) ||
        o.buyerName?.toLowerCase().includes(q) ||
        o.sellerName?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return this.sort() === 'createdAt,desc' ? dateB - dateA : dateA - dateB;
    });

    this.orders.set(filtered);
    this.page.set(0);
  }

  applyFilters() {
    this.currentPage.set(0);
    this.loadOrders();
  }

  resetFilters() {
    this.query.set('');
    this.sort.set('createdAt,desc');
    this.applyFilters();
  }

  onQueryInput(value: string) {
    this.query.set(value);
  }

  onSortChange(value: string) {
    if (value === 'createdAt,asc' || value === 'createdAt,desc') {
      this.sort.set(value);
      this.applyFilters();
    }
  }

  availableStatuses = ['PENDING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED'];

  updateOrderStatus(orderId: number, newStatus: string) {
    import('sweetalert2').then(m => {
      const Swal = m.default;
      Swal.fire({
        title: 'Confirmer le changement',
        text: `Voulez-vous vraiment changer le statut en ${this.getStatusLabel(newStatus)} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#A3FF12', // Neon
        cancelButtonColor: '#0B0B0B', // Black
        confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">Confirmer</span>',
        cancelButtonText: '<span style="color: #FFFFFF; font-weight: bold; font-family: \'Inter\', sans-serif;">Annuler</span>',
        background: '#FFFFFF',
        customClass: {
          title: 'font-heading text-balawi-bg text-2xl',
          htmlContainer: 'font-slogan text-gray-600',
          confirmButton: 'rounded-xl border border-balawi-bg',
          cancelButton: 'rounded-xl'
        },
        heightAuto: false
      }).then((result) => {
        if (result.isConfirmed) {
          this.moderationService.updateOrderStatus(orderId, newStatus).subscribe({
            next: () => {
              this.loadOrders();
              Swal.fire({
                title: 'Mis à jour !',
                text: 'Le statut de la commande a été modifié.',
                icon: 'success',
                confirmButtonColor: '#A3FF12',
                confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">OK</span>',
                customClass: {
                  title: 'font-heading text-balawi-bg text-2xl',
                  confirmButton: 'rounded-xl border border-balawi-bg'
                },
                heightAuto: false
              });
            },
            error: (err: any) => {
              console.error('Erreur update status', err);
              Swal.fire({
                title: 'Erreur',
                text: 'Impossible de modifier le statut.',
                icon: 'error',
                confirmButtonColor: '#0B0B0B',
                confirmButtonText: '<span style="color: #FFFFFF; font-weight: bold; font-family: \'Inter\', sans-serif;">OK</span>',
                customClass: {
                  title: 'font-heading text-balawi-bg text-2xl',
                  confirmButton: 'rounded-xl'
                },
                heightAuto: false
              });
              this.loadOrders(); // reload to reset dropdown
            }
          });
        } else {
           this.loadOrders(); // reload to reset dropdown
        }
      });
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-balawi-neon text-balawi-bg border border-balawi-bg';
      case 'PAID': return 'bg-balawi-bg text-white border border-balawi-bg';
      case 'PENDING_PAYMENT': return 'bg-gray-100 text-gray-500 border border-gray-200';
      case 'CANCELLED': return 'bg-red-500 text-white border border-red-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Terminée';
      case 'PAID': return 'Payée';
      case 'PENDING_PAYMENT': return 'En attente';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }
}
