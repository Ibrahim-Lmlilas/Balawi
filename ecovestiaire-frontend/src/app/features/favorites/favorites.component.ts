import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  private itemService = inject(ItemService);
  private router = inject(Router);

  favorites = signal<Item[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.isLoading.set(true);
    this.itemService.getFavorites().subscribe({
      next: (items) => {
        this.favorites.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading favorites', err);
        this.isLoading.set(false);
      }
    });
  }

  removeFavorite(item: Item) {
    if (!item.id) {
      console.error('Item ID is missing', item);
      return;
    }
    this.itemService.removeFavorite(item.id).subscribe({
      next: () => {
        this.favorites.update(favs => favs.filter(f => f.id !== item.id));
      },
      error: (err) => console.error('Error removing favorite', err)
    });
  }

  buyItem(item: Item) {
    // Rediriger vers checkout ou simuler achat
    this.router.navigate(['/items', item.id]);
  }
}
