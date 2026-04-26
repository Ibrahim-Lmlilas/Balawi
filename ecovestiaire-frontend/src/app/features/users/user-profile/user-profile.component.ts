import { Component, computed, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpdateUserProfileRequest, UserProfileResponse, UserService, UserSearchResult } from '../../../services/user.service';
import { ItemService } from '../../../services/item.service';
import { Category, Item } from '../../../models/item.model';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { AuthService } from '../../../services/auth.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { take } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, ItemCardComponent, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private itemService = inject(ItemService);
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  private http = inject(HttpClient);

  private subscriptions = new Subscription();

  routeUserId = signal<number | null>(null);
  currentUserId = signal<number | null>(null);

  profile = signal<UserProfileResponse | null>(null);
  userItems = signal<Item[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<number | null>(null);
  selectedStatus = signal<'ALL' | 'AVAILABLE' | 'SOLD'>('ALL');

  filteredItems = computed(() => {
    let items = this.userItems();
    const catId = this.selectedCategoryId();
    const status = this.selectedStatus();

    if (catId !== null) {
      items = items.filter(it => it.category.id === catId);
    }

    if (status === 'AVAILABLE') {
      items = items.filter(it => it.status === 'AVAILABLE');
    } else if (status === 'SOLD') {
      items = items.filter(it => it.status === 'SOLD');
    }

    // Tri par défaut : les plus récents en premier (si possible) ou garder l'ordre
    return items;
  });

  isLoading = signal(true);
  isLoadingItems = signal(true);
  errorMessage = signal<string | null>(null);

  isEditOpen = signal(false);
  isEditLoading = signal(false);
  isSavingProfile = signal(false);
  isUploadingPhoto = signal(false);
  editErrorMessage = signal<string | null>(null);
  avatarPreviewUrl = signal<string | null>(null);
  
  isPreviewOpen = signal(false);
  previewImageUrl = signal<string | null>(null);

  openPreview(url: string | null) {
    if (!url) return;
    this.previewImageUrl.set(url);
    this.isPreviewOpen.set(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  closePreview() {
    this.isPreviewOpen.set(false);
    this.previewImageUrl.set(null);
    document.body.style.overflow = ''; // Restore scrolling
  }

  private editProfileSnapshot = signal<UserProfileResponse | null>(null);

  editForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    bio: [''],
    country: [''],
    city: [''],
    profilePhotoUrl: ['']
  });

  countries = signal<{ name: string, code: string }[]>([]);
  availableCities = signal<string[]>([]);
  isLoadingCities = signal(false);

  countrySearch = signal('');
  citySearch = signal('');
  isCountryMenuOpen = signal(false);
  isCityMenuOpen = signal(false);

  filteredCountries = computed(() => {
    const search = this.countrySearch().toLowerCase();
    return this.countries().filter(c => c.name.toLowerCase().includes(search));
  });

  filteredCities = computed(() => {
    const search = this.citySearch().toLowerCase();
    return this.availableCities().filter(c => c.toLowerCase().includes(search));
  });

  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return `${p.firstName} ${p.lastName}`;
  });

  followersCount = signal(0);
  followingCount = signal(0);
  isFollowing = signal(false);

  /** Followers du profil visité que le currentUser suit aussi */
  mutualFriends = signal<UserSearchResult[]>([]);

  isOwnProfile = computed(() => {
    const routeId = this.routeUserId();
    const currentId = this.currentUserId();
    return routeId !== null && currentId !== null && routeId === currentId;
  });

  ngOnInit() {
    this.itemService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: (err) => console.error('Error loading categories', err)
    });

    this.loadCountries();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      const id = idParam ? Number(idParam) : NaN;

      if (isNaN(id)) return;

      this.isLoading.set(true);
      this.isLoadingItems.set(true);
      this.routeUserId.set(id);

      // On attend que currentUser$ ait émis AVANT de charger le profil
      this.authService.currentUser$.pipe(take(1)).subscribe((u) => {
        this.currentUserId.set(u?.id ?? null);

        // Load Profile
        this.userService.getPublicProfileById(id).subscribe({
          next: (p) => {
            this.profile.set(this.userService.normalizeProfilePhotoUrl(p));
            this.isLoading.set(false);
            this.loadFollowStats(id);
          },
          error: (err) => {
            console.error('Error fetching user profile', err);
            this.errorMessage.set('Unable to load profile');
            this.isLoading.set(false);
          }
        });
      });

      // Load User Items
      this.itemService.getItems({ sellerId: id, includeSold: true, pageSize: 100 }).subscribe({
        next: (items: Item[]) => {
          this.userItems.set(items);
          this.syncFavorites();
          this.isLoadingItems.set(false);
        },
        error: (err: any) => {
          console.error('Error fetching user items:', err);
          this.isLoadingItems.set(false);
        }
      });
    });
  }

  private loadCountries() {
    this.http.get<any[]>('https://restcountries.com/v3.1/all?fields=name,cca2').subscribe({
      next: (data) => {
        const sorted = data.map(c => ({
          name: c.name.common,
          code: c.cca2
        })).sort((a, b) => a.name.localeCompare(b.name));
        this.countries.set(sorted);
      },
      error: (err) => console.error('Error loading countries', err)
    });
  }

  private syncFavorites() {
    if (this.authService.isLoggedIn()) {
      this.itemService.getFavorites().subscribe({
        next: (favs) => {
          const favIds = new Set(favs.map(f => Number(f.id)));
          this.userItems.update(items => {
            items.forEach(it => {
              it.isFavorite = favIds.has(Number(it.id));
            });
            return [...items];
          });
        }
      });
    }
  }

  private loadFollowStats(userId: number) {
    const currentId = this.currentUserId();

    // Charge mes following en parallèle (si connecté et profil différent)
    const myFollowing$ = (currentId && currentId !== userId)
      ? this.userService.getFollowing(currentId)
      : of([]);

    forkJoin({
      followers: this.userService.getFollowers(userId),
      following: this.userService.getFollowing(userId),
      myFollowing: myFollowing$
    }).subscribe({
      next: ({ followers, following, myFollowing }) => {
        this.followersCount.set(followers.length);
        this.followingCount.set(following.length);

        if (currentId) {
          this.isFollowing.set(followers.some(f => f.id === currentId));
        }

        // Amis mutuels : followers du profil que moi je suis aussi
        const myFollowingIds = new Set(myFollowing.map(u => u.id));
        this.mutualFriends.set(
          followers.filter(f => myFollowingIds.has(f.id))
            .map(u => this.userService.normalizeSearchResultPhotoUrl(u))
        );
      },
      error: (err) => console.error('Error loading follow stats', err)
    });
  }

  /** Devine ami/amie à partir du prénom */
  getFriendLabel(firstName: string): string {
    const name = firstName.trim().toLowerCase();
    const feminineEndings = ['a', 'ia', 'ya', 'ie', 'ée', 'ine', 'ette', 'elle', 'ène', 'eme', 'ima', 'ama', 'oua', 'iya'];
    return feminineEndings.some(e => name.endsWith(e)) ? 'amie' : 'ami';
  }

  follow() {
    const p = this.profile();
    if (!p) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.isFollowing()) {
      this.userService.unfollowUser(p.id).subscribe({
        next: () => {
          this.isFollowing.set(false);
          this.followersCount.update(c => Math.max(0, c - 1));
        },
        error: (err) => console.error('Error unfollowing user', err)
      });
    } else {
      this.userService.followUser(p.id).subscribe({
        next: () => {
          this.isFollowing.set(true);
          this.followersCount.update(c => c + 1);
        },
        error: (err) => console.error('Error following user', err)
      });
    }
  }

  sendMessage() {
    const p = this.profile();
    if (!p) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // On s'assure que p.id est traité comme un number
    const targetId = Number(p.id);
    if (isNaN(targetId)) {
      console.error('Invalid user ID for conversation');
      return;
    }

    this.chatService.startConversation({
      targetUserId: targetId
    }).subscribe({
      next: (conv) => {
        this.router.navigate(['/messages', conv.id]);
      },
      error: (err) => {
        console.error('Error starting conversation', err);
      }
    });
  }

  editProfile() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (!this.isOwnProfile()) return;
    this.openEditModal();
  }

  private openEditModal() {
    this.isEditOpen.set(true);
    this.editErrorMessage.set(null);
    this.editProfileSnapshot.set(null);

    const current = this.profile();
    if (!current) {
      this.editErrorMessage.set('Unable to load profile');
      this.isEditLoading.set(false);
      return;
    }

    // Pré-remplir l'aperçu avec la photo existante (déjà en URL absolue)
    this.avatarPreviewUrl.set(current.profilePhotoUrl ?? null);
    this.editProfileSnapshot.set(current);
    this.editForm.get('city')?.disable(); // Disabled by default until country is set
    
    // Parse location (format "City, Country" or just "City")
    const loc = current.location ?? '';
    let country = '';
    let city = '';

    if (loc.includes(',')) {
      const parts = loc.split(',').map(s => s.trim());
      city = parts[0];
      const countryName = parts[1];
      country = this.countries().find(c => c.name === countryName)?.code ?? '';
    } else {
      city = loc;
    }

    if (country) {
      const countryName = this.countries().find(c => c.code === country)?.name ?? '';
      this.countrySearch.set(countryName);
      this.onCountryChange(city); // Fetch cities for the country and set initial city
    } else {
      this.countrySearch.set('');
    }

    if (city) {
      this.citySearch.set(city);
    } else {
      this.citySearch.set('');
    }

    this.editForm.patchValue({
      firstName: current.firstName ?? '',
      lastName: current.lastName ?? '',
      bio: current.bio ?? '',
      country: country,
      city: city,
      profilePhotoUrl: current.profilePhotoUrl ?? ''
    });
  }

  onCountryChange(initialCity?: string) {
    const countryCode = this.editForm.get('country')?.value;
    const countryName = this.countries().find(c => c.code === countryCode)?.name;
    
    if (!countryName) {
      this.availableCities.set([]);
      this.editForm.get('city')?.setValue('');
      this.citySearch.set('');
      return;
    }

    this.isLoadingCities.set(true);
    this.editForm.get('city')?.disable();

    this.http.post<any>('https://countriesnow.space/api/v0.1/countries/cities', {
      country: countryName
    }).subscribe({
      next: (res) => {
        this.availableCities.set(res.data || []);
        this.isLoadingCities.set(false);
        this.editForm.get('city')?.enable();
        if (initialCity) {
          this.editForm.get('city')?.setValue(initialCity);
          this.citySearch.set(initialCity);
        }
      },
      error: (err) => {
        console.error('Error loading cities', err);
        this.availableCities.set([]);
        this.isLoadingCities.set(false);
      }
    });

    if (!initialCity) {
      this.editForm.get('city')?.setValue('');
      this.citySearch.set('');
    }
  }

  selectCountry(country: { name: string, code: string }) {
    this.editForm.get('country')?.setValue(country.code);
    this.countrySearch.set(country.name);
    this.isCountryMenuOpen.set(false);
    this.onCountryChange();
  }

  selectCity(city: string) {
    this.editForm.get('city')?.setValue(city);
    this.citySearch.set(city);
    this.isCityMenuOpen.set(false);
  }

  closeEditModal() {
    this.isEditOpen.set(false);
    this.editErrorMessage.set(null);
    this.avatarPreviewUrl.set(null);
  }

  private toBackendPhotoUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const v = raw.trim();
    if (!v) return null;

    if (v.startsWith('http://') || v.startsWith('https://')) {
      const idx = v.indexOf('/uploads/');
      if (idx >= 0) return v.slice(idx);
    }

    return v;
  }

  selectedFile = signal<File | null>(null);

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.editErrorMessage.set(null);
    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.avatarPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  saveProfile() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.editErrorMessage.set(null);

    const file = this.selectedFile();
    if (file) {
      this.userService.uploadMyProfilePhoto(file).subscribe({
        next: (updated) => {
          this.selectedFile.set(null);
          // Sync the newly uploaded photo path into the form so performProfileUpdate can pick it up
          if (updated.profilePhotoUrl) {
            this.editForm.patchValue({ profilePhotoUrl: updated.profilePhotoUrl });
          }
          this.performProfileUpdate(updated);
        },
        error: (err) => {
          console.error('Error uploading photo during save', err);
          this.isSavingProfile.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Impossible d'envoyer la photo de profil. Veuillez réessayer.",
            confirmButtonColor: '#16A34A'
          });
        }
      });
    } else {
      const snapshot = this.editProfileSnapshot();
      if (!snapshot) {
        this.isSavingProfile.set(false);
        return;
      }
      this.performProfileUpdate(snapshot);
    }
  }

  private performProfileUpdate(snapshot: UserProfileResponse) {
    const firstNameRaw = (this.editForm.get('firstName')?.value ?? '').toString().trim();
    const lastNameRaw = (this.editForm.get('lastName')?.value ?? '').toString().trim();

    const firstName = firstNameRaw || snapshot.firstName;
    const lastName = lastNameRaw || snapshot.lastName;

    const bioControlVal = this.editForm.get('bio')?.value;
    const cityVal = this.editForm.get('city')?.value;
    const countryCode = this.editForm.get('country')?.value;
    const countryName = this.countries().find(c => c.code === countryCode)?.name;

    const bio = (bioControlVal === null || bioControlVal === undefined || bioControlVal.toString().trim() === '') ? null : bioControlVal.toString();
    
    let location = null;
    if (cityVal && countryName) {
      location = `${cityVal}, ${countryName}`;
    } else if (cityVal) {
      location = cityVal;
    } else if (countryName) {
      location = countryName;
    }

    const payload: UpdateUserProfileRequest = {
      firstName,
      lastName,
      bio,
      location,
      profilePhotoUrl: this.toBackendPhotoUrl(this.editForm.get('profilePhotoUrl')?.value)
    };

    this.userService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        const normalized = this.userService.normalizeProfilePhotoUrl(updated);
        this.profile.set(normalized);
        this.authService.updateCurrentUserFromProfile(updated);
        this.isSavingProfile.set(false);
        this.closeEditModal();
        Swal.fire({
          icon: 'success',
          title: 'Profil mis à jour !',
          text: 'Vos informations ont été enregistrées avec succès.',
          timer: 2500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      },
      error: (err) => {
        console.error('Error saving profile', err);
        this.isSavingProfile.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de sauvegarder le profil. Veuillez réessayer.',
          confirmButtonColor: '#16A34A'
        });
      }
    });
  }

  onItemDeleted(itemId: number) {
    this.userItems.set(this.userItems().filter((i) => i.id !== itemId));
  }

  setCategoryFilter(id: any) {
    this.selectedCategoryId.set(id ? Number(id) : null);
  }

  setStatusFilter(status: 'ALL' | 'AVAILABLE' | 'SOLD') {
    this.selectedStatus.set(status);
  }

  publishItem() {
    this.router.navigate(['/items/publish']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
