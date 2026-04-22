import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserService, UserSearchResult } from '../../../services/user.service';

@Component({
  selector: 'app-search-users-results',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './search-users-results.component.html'
})
export class SearchUsersResultsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  query = signal('');
  users = signal<UserSearchResult[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  page = signal(0);
  pageSize = 10;
  totalPages = signal(1);
  totalElements = signal(0);

  pageLabel = computed(() => this.page() + 1);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const q = (params.get('q') || '').trim();
      const pageParam = Number(params.get('page') ?? 0);
      const p = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;

      this.query.set(q);
      this.page.set(p);

      if (!q) {
        this.users.set([]);
        this.totalPages.set(1);
        this.totalElements.set(0);
        this.isLoading.set(false);
        this.errorMessage.set(null);
        return;
      }

      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.userService.searchUsers(q, p, this.pageSize).subscribe({
        next: (res) => {
          this.users.set((res.content || []).map((u) => this.userService.normalizeSearchResultPhotoUrl(u)));
          this.totalPages.set(res.totalPages ?? 1);
          this.totalElements.set(res.totalElements ?? 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error searching users', err);
          this.users.set([]);
          this.totalPages.set(1);
          this.totalElements.set(0);
          this.errorMessage.set('Unable to load user results');
          this.isLoading.set(false);
        }
      });
    });
  }

  prevPage() {
    if (this.page() <= 0) return;
    this.navigateToPage(this.page() - 1);
  }

  nextPage() {
    if (this.page() >= this.totalPages() - 1) return;
    this.navigateToPage(this.page() + 1);
  }

  private navigateToPage(p: number) {
    const q = this.query();
    if (!q) return;
    this.router.navigate(['/search/users'], {
      queryParams: { q, page: p }
    });
  }
}
