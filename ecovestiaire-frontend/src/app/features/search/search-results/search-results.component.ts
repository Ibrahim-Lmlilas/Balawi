import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../../services/item.service';
import { Category, Item } from '../../../models/item.model';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, ItemCardComponent, MatIconModule, FormsModule],
  templateUrl: './search-results.component.html'
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);

  query = signal('');
  selectedCategoryId = signal<number | null>(null);
  categories = signal<Category[]>([]);
  allItems = signal<Item[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  showCategories = signal(true);
  showPrice = signal(true);

  minPrice: number | null = null;
  maxPrice: number | null = null;

  page = signal(1);
  pageSize = 12;

  totalPages = computed(() => {
    const total = this.allItems().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  pagedItems = computed(() => {
    const p = this.page();
    const start = (p - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.allItems().slice(start, end);
  });

  ngOnInit() {
    this.loadCategories();
    this.route.queryParamMap.subscribe((params) => {
      const q = (params.get('q') || '').trim();
      const catId = params.get('categoryId');
      const minP = params.get('minPrice');
      const maxP = params.get('maxPrice');
      
      this.query.set(q);
      this.selectedCategoryId.set(catId ? Number(catId) : null);
      this.minPrice = minP ? Number(minP) : null;
      this.maxPrice = maxP ? Number(maxP) : null;
      this.page.set(1);

      this.loadItems(q, this.selectedCategoryId());
    });
  }

  private loadCategories() {
    this.itemService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: (err) => console.error('Error loading categories', err)
    });
  }

  private loadItems(q: string, categoryId: number | null) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: any = {
      includeSold: false,
      page: 1,
      pageSize: 50
    };
    
    if (q) filters.q = q;
    if (categoryId) filters.categoryId = categoryId;
    if (this.minPrice !== null && this.minPrice !== undefined) filters.minPrice = this.minPrice;
    if (this.maxPrice !== null && this.maxPrice !== undefined) filters.maxPrice = this.maxPrice;

    console.log('DEBUG: SearchResults - Loading items with filters:', filters);

    this.itemService.getItems(filters).subscribe({
      next: (items) => {
        this.allItems.set(items || []);
        this.syncFavorites();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching items', err);
        this.allItems.set([]);
        this.errorMessage.set('Unable to load items');
        this.isLoading.set(false);
      }
    });
  }

  onCategoryChange(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
    this.page.set(1);
    this.updateUrl();
    this.loadItems(this.query(), categoryId);
  }

  onPriceChange() {
    this.page.set(1);
    this.updateUrl();
    this.loadItems(this.query(), this.selectedCategoryId());
  }

  private updateUrl() {
    const queryParams: any = {};
    
    if (this.query()) {
      queryParams.q = this.query();
    }

    if (this.selectedCategoryId()) {
      queryParams.categoryId = this.selectedCategoryId();
    }

    if (this.minPrice !== null && this.minPrice !== undefined) {
      queryParams.minPrice = this.minPrice;
    }

    if (this.maxPrice !== null && this.maxPrice !== undefined) {
      queryParams.maxPrice = this.maxPrice;
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private syncFavorites() {
    if (this.authService.isLoggedIn()) {
      this.itemService.getFavorites().subscribe({
        next: (favs) => {
          const favIds = new Set(favs.map(f => Number(f.id)));
          this.allItems.update(items => {
            items.forEach(it => {
              it.isFavorite = favIds.has(Number(it.id));
            });
            return [...items];
          });
        }
      });
    }
  }

  prevPage() {
    this.page.set(Math.max(1, this.page() - 1));
  }

  nextPage() {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }
}
