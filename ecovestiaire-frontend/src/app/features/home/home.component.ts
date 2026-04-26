import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../services/item.service';
import { Item, Category } from '../../models/item.model';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ItemCardComponent, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private itemService = inject(ItemService);
  private router = inject(Router);

  @ViewChild('categoryScroll') categoryScroll!: ElementRef<HTMLDivElement>;

  categories: Category[] = [];
  trendingItems: Item[] = [];
  trendingSlots: Array<Item | null> = [null, null, null, null];
  isLoading = signal(true);

  currentSlide = 0;
  private slideInterval: any;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user && user.role === 'ADMIN') {
        this.router.navigate(['/admin']);
        return;
      }
    }

    this.isLoading.set(true);

    this.itemService.getCategories().subscribe({
      next: (cats) => { this.categories = cats || []; },
      error: (err) => { console.error('Error fetching categories', err); this.categories = []; }
    });

    this.loadTrendingItems();

    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % 3;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    clearInterval(this.slideInterval);
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % 3;
    }, 5000);
  }

  loadTrendingItems() {
    this.itemService.getTrendingItems().subscribe({
      next: (items) => {
        this.trendingItems = items || [];
        if (this.authService.isLoggedIn()) {
          this.itemService.getFavorites().subscribe({
            next: (favs) => {
              const favIds = new Set(favs.map(f => Number(f.id)));
              this.trendingItems.forEach(it => { it.isFavorite = favIds.has(Number(it.id)); });
              this.updateSlots();
            },
            error: () => this.updateSlots()
          });
        } else {
          this.updateSlots();
        }
      },
      error: (err) => {
        console.error('Error fetching trending items', err);
        this.trendingItems = [];
        this.updateSlots();
      }
    });
  }

  private updateSlots() {
    this.trendingSlots = Array.from({ length: 4 }, (_, i) => this.trendingItems[i] ?? null);
    this.isLoading.set(false);
  }

  scrollCategories(direction: 'left' | 'right') {
    if (!this.categoryScroll?.nativeElement) return;
    const amount = direction === 'left' ? -350 : 350;
    this.categoryScroll.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }

  explore() { this.router.navigate(['/search']); }

  onCategoryClick(categoryId: number) {
    this.router.navigate(['/search'], { queryParams: { categoryId } });
  }

  startSelling() { this.router.navigate(['/items/publish']); }
}