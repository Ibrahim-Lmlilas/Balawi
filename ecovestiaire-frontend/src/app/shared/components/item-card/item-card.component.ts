import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item } from '../../../models/item.model';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ItemService } from '../../../services/item.service';
import Swal from 'sweetalert2';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, MatMenuModule, MatButtonModule],
  templateUrl: './item-card.component.html',
  styleUrls: ['./item-card.component.scss']
})
export class ItemCardComponent {
  public authService = inject(AuthService);
  private itemService = inject(ItemService);
  private router = inject(Router);

  @Input({ required: true }) item!: Item;
  @Input() showActions: boolean = false;
  @Input() hideSeller: boolean = false;
  @Input() compactMetadata: boolean = false;

  @Output() deleted = new EventEmitter<number>();

  photoIndex = 0;

  get currentPhoto(): string {
    const photos = this.item?.photos || [];
    return photos[this.photoIndex] || 'assets/images/placeholder-item.jpg';
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const currentlyFavorite = this.item.isFavorite;

    if (currentlyFavorite) {
      this.itemService.removeFavorite(this.item.id).subscribe({
        next: () => {
          this.item = {
            ...this.item,
            isFavorite: false,
            likesCount: Math.max(0, (this.item.likesCount || 0) - 1)
          };
        },
        error: (err) => console.error('Error removing favorite', err)
      });
    } else {
      this.itemService.toggleFavorite(this.item.id).subscribe({
        next: () => {
          this.item = {
            ...this.item,
            isFavorite: true,
            likesCount: (this.item.likesCount || 0) + 1
          };
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Ajouté aux favoris !',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            background: '#ffffff',
            color: '#1f2937',
            iconColor: '#10b981'
          });
        },
        error: (err: any) => {
          console.error('Error adding favorite', err);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Erreur lors de l\'ajout',
            showConfirmButton: false,
            timer: 2500
          });
        }
      });
    }
  }

  editItem(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/items', this.item.id, 'edit']);
  }

  deleteItem(event: Event) {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    Swal.fire({
      title: 'Supprimer l\'article',
      text: 'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.itemService.deleteItem(this.item.id).subscribe({
        next: () => {
          this.deleted.emit(this.item.id);
          Swal.fire({
            title: 'Supprimé',
            text: 'L\'article a été supprimé.',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error deleting item', err);
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de supprimer cet article.',
            icon: 'error'
          });
        }
      });
    });
  }

  prevPhoto(event: Event) {
    event.stopPropagation();
    const photos = this.item?.photos || [];
    if (photos.length <= 1) return;
    this.photoIndex = (this.photoIndex - 1 + photos.length) % photos.length;
  }

  nextPhoto(event: Event) {
    event.stopPropagation();
    const photos = this.item?.photos || [];
    if (photos.length <= 1) return;
    this.photoIndex = (this.photoIndex + 1) % photos.length;
  }
}
