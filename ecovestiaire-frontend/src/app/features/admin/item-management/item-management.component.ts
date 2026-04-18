import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModerationService } from '../../../services/admin/admin-moderation.service';
import { AdminItem } from '../../../models/admin.model';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-item-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './item-management.component.html',
  styleUrls: ['./item-management.component.scss']
})
export class ItemManagementComponent implements OnInit {
  private moderationService = inject(AdminModerationService);

  items = signal<AdminItem[]>([]);
  isLoading = signal(true);
  currentPage = signal(0);

  readonly pageSize = 6;
  page = signal(0);
  searchQuery = signal('');

  get filteredItems(): AdminItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(it => 
      it.title.toLowerCase().includes(q) || 
      it.sellerFirstName.toLowerCase().includes(q)
    );
  }

  get pagedItems(): AdminItem[] {
    const start = this.page() * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filteredItems.length / this.pageSize); }
  get pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  goToPage(p: number) { if (p >= 0 && p < this.totalPages) this.page.set(p); }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.isLoading.set(true);
    this.moderationService.getItems(this.currentPage(), 100).subscribe({
      next: (response) => {
        this.items.set(response.content || response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement articles', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteItem(itemId: number) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "L'article sera définitivement supprimé !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3FF12', // Neon
      cancelButtonColor: '#0B0B0B', // Black
      confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">Oui, supprimer !</span>',
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
        this.executeDelete(itemId);
      }
    });
  }

  private executeDelete(itemId: number) {
    this.moderationService.deleteItem(itemId).subscribe({
      next: () => {
        this.items.update(list => list.filter(it => it.id !== itemId));
        Swal.fire({
          title: 'Supprimé !',
          text: 'L\'article a été supprimé.',
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
      error: (err) => {
        console.error('Erreur suppression article', err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer l\'article.',
          icon: 'error',
          confirmButtonColor: '#0B0B0B',
          confirmButtonText: '<span style="color: #FFFFFF; font-weight: bold; font-family: \'Inter\', sans-serif;">OK</span>',
          customClass: {
            title: 'font-heading text-balawi-bg text-2xl',
            confirmButton: 'rounded-xl'
          },
          heightAuto: false
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'bg-balawi-neon text-balawi-bg border border-balawi-bg';
      case 'SOLD': return 'bg-gray-100 text-gray-500 border border-gray-200';
      case 'BANNED': return 'bg-red-500 text-white border border-red-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'SOLD': return 'Vendu';
      case 'BANNED': return 'Banni';
      default: return status;
    }
  }
}
