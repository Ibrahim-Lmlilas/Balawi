import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { FooterComponent } from './core/layout/footer/footer.component';
import { NavbarComponent } from './core/layout/navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  title = 'ecovestiaire-frontend';
  showNavbar = true;
  showFooter = true;

  ngOnInit(): void {
    this.updateLayoutVisibility(this.router.url);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        this.updateLayoutVisibility(e.urlAfterRedirects);
      });
  }

  private updateLayoutVisibility(url: string) {
    const path = url.split('?')[0];
    
    const isAdminPage = path.startsWith('/admin');
    const isAuthPage = path === '/login' || path === '/register';
    const isDashboardPage = path.startsWith('/messages') || path === '/notifications' || path === '/favorites';
    
    // Navbar visible partout sauf Admin et Auth
    this.showNavbar = !(isAuthPage || isAdminPage);
    
    // Footer visible partout sauf Admin, Auth et Dashboard (Messages/Notifications/Favoris)
    this.showFooter = !(isAuthPage || isAdminPage || isDashboardPage);
  }
}

