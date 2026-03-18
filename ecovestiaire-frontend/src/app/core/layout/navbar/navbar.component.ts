import { Component, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { ChatService } from '../../../services/chat.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  public authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  public chatService = inject(ChatService);
  private router = inject(Router);
  private el = inject(ElementRef);

  searchQuery = '';
  isProfileMenuOpen = signal(false);
  isSearchOpen = false;

  @ViewChild('searchInput') searchInput: any;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isProfileMenuOpen.set(false);
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 150);
    }
  }

  logout() {
    this.authService.logout();
    this.isProfileMenuOpen.set(false);
    this.router.navigate(['/login']);
  }

  handleImageError(user: any) {
    user.profilePhotoUrl = null;
  }

  onSearch() {
    const raw = this.searchQuery.trim();
    if (!raw) return;
    this.isSearchOpen = false;

    if (raw.startsWith('@')) {
      const q = raw.slice(1).trim();
      if (!q) return;
      this.router.navigate(['/search/users'], { queryParams: { q } });
      return;
    }

    this.router.navigate(['/search'], { queryParams: { q: raw } });
  }
}