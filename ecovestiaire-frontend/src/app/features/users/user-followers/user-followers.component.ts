import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UserService, UserSearchResult } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-user-followers',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  templateUrl: './user-followers.component.html',
  styleUrls: ['./user-followers.component.scss']
})
export class UserFollowersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  userId = signal<number | null>(null);
  currentUserId = signal<number | null>(null);
  activeTab = signal<'followers' | 'following'>('following');
  searchQuery = signal('');

  followers = signal<UserSearchResult[]>([]);
  following = signal<UserSearchResult[]>([]);
  isLoading = signal(true);

  /** IDs des utilisateurs que MOI (currentUser) je suis */
  myFollowingIds = signal<Set<number>>(new Set());

  isOwnProfile = computed(() => {
    return this.userId() === this.currentUserId();
  });

  filteredUsers = computed(() => {
    const list = this.activeTab() === 'followers' ? this.followers() : this.following();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(u =>
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    // Déterminer l'onglet actif basé sur l'URL
    const path = this.route.snapshot.url[this.route.snapshot.url.length - 1].path;
    this.activeTab.set(path === 'followers' ? 'followers' : 'following');

    const id = Number(this.route.snapshot.params['id']);
    this.userId.set(id);

    // On prend la PREMIÈRE émission de currentUser$ (take(1)) pour être sûr
    // que currentUserId est bien lu avant d'appeler loadData
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      const currentId = user?.id ?? null;
      this.currentUserId.set(currentId);
      this.loadData(id, currentId);
    });
  }

  loadData(profileId: number, currentId: number | null) {
    this.isLoading.set(true);

    // Charge les following du currentUser uniquement si connecté et profil différent
    const myFollowing$ = (currentId && currentId !== profileId)
      ? this.userService.getFollowing(currentId)
      : of([]);

    forkJoin({
      followers: this.userService.getFollowers(profileId),
      following: this.userService.getFollowing(profileId),
      myFollowing: myFollowing$
    }).subscribe({
      next: (res) => {
        this.followers.set(res.followers.map(u => this.userService.normalizeSearchResultPhotoUrl(u)));
        this.following.set(res.following.map(u => this.userService.normalizeSearchResultPhotoUrl(u)));
        this.myFollowingIds.set(new Set(res.myFollowing.map(u => u.id)));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading follow data', err);
        this.isLoading.set(false);
      }
    });
  }

  /** Retourne true si le currentUser suit cet utilisateur */
  iFollowUser(userId: number): boolean {
    return this.myFollowingIds().has(userId);
  }

  /**
   * Devine le genre à partir du prénom pour afficher "Ton ami" ou "Ton amie".
   * Heuristique simple basée sur les terminaisons féminines françaises/arabes courantes.
   */
  getFriendLabel(firstName: string): string {
    const name = firstName.trim().toLowerCase();
    const feminineEndings = ['a', 'ia', 'ya', 'ie', 'ée', 'ine', 'ette', 'elle', 'ène', 'eme', 'ima', 'ama', 'oua', 'iya'];
    const isFeminine = feminineEndings.some(ending => name.endsWith(ending));
    return isFeminine ? 'Ton amie' : 'Ton ami';
  }

  switchTab(tab: 'followers' | 'following') {
    this.activeTab.set(tab);
    // Mettre à jour l'URL sans recharger le composant
    const id = this.userId();
    this.router.navigate(['/users', id, tab], { replaceUrl: true });
  }

  unfollow(user: UserSearchResult) {
    this.userService.unfollowUser(user.id).subscribe({
      next: () => {
        this.following.update(list => list.filter(u => u.id !== user.id));
      },
      error: (err) => console.error('Error unfollowing', err)
    });
  }

  removeFollower(user: UserSearchResult) {
    // Note: Typiquement, c'est le même endpoint ou un endpoint spécifique DELETE /followers/{id}
    // Si le backend ne l'a pas encore, on peut le simuler ou attendre
    console.log('Remove follower not yet implemented on backend');
  }
}
