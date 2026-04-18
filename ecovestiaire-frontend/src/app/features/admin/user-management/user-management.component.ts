import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModerationService } from '../../../services/admin/admin-moderation.service';
import { AdminUser } from '../../../models/admin.model';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  private moderationService = inject(AdminModerationService);
  public authService = inject(AuthService);

  users = signal<AdminUser[]>([]);
  isLoading = signal(true);
  currentPage = signal(0);
  totalUsers = signal(0);

  readonly pageSize = 6;
  page = signal(0);
  searchQuery = signal('');

  get filteredUsers(): AdminUser[] {
    const q = this.searchQuery().toLowerCase().trim();
    
    // Exclure les administrateurs de la liste
    const nonAdminUsers = this.users().filter(u => !u.roles || !u.roles.includes('ADMIN'));
    
    if (!q) return nonAdminUsers;
    
    return nonAdminUsers.filter(u => 
      u.firstName.toLowerCase().includes(q) || 
      u.lastName.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  }

  get pagedUsers(): AdminUser[] {
    const start = this.page() * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filteredUsers.length / this.pageSize); }
  get pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  goToPage(p: number) { if (p >= 0 && p < this.totalPages) this.page.set(p); }

  ngOnInit() {
    this.loadUsers();
  }

  getAbsoluteUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    if (cleanPath.startsWith('/uploads')) {
      return cleanPath;
    }
    return '/api' + cleanPath;
  }

  loadUsers() {
    this.isLoading.set(true);
    this.moderationService.getUsers(this.currentPage(), 100).subscribe({
      next: (response) => {
        const rawUsers = response.content || response;
        console.log('DEBUG: AdminUsers from backend:', rawUsers);
        console.log('DEBUG FULL DATA (User 0):', rawUsers[0]);
        console.log('DEBUG PHOTO PATHS (All):', rawUsers.map((u: any) => ({
          name: u.firstName,
          id: u.id,
          profilePhotoUrl: u.profilePhotoUrl,
          photoUrl: u.photoUrl,
          imageUrl: u.imageUrl,
          profileImage: u.profileImage,
          avatar: u.avatar
        })));
        this.users.set(rawUsers);
        this.totalUsers.set(response.totalElements || (response.length || 0));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.isLoading.set(false);
      }
    });
  }

  updateStatus(user: AdminUser, status: 'ACTIVE' | 'SUSPENDED') {
    this.moderationService.updateUserStatus(user.id, status).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: status } : u));
      },
      error: (err) => console.error('Erreur update status', err)
    });
  }

  deleteUser(userId: number) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
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
        this.executeDelete(userId);
      }
    });
  }

  private executeDelete(userId: number) {
    this.moderationService.deleteUser(userId).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== userId));
        Swal.fire({
          title: 'Supprimé !',
          text: 'L\'utilisateur a été supprimé.',
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
        console.error('Erreur suppression utilisateur', err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer l\'utilisateur.',
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
      case 'ACTIVE': return 'bg-balawi-neon text-balawi-bg border border-balawi-bg';
      case 'SUSPENDED': return 'bg-red-500 text-white border border-red-600';
      default: return 'bg-balawi-border text-balawi-bg';
    }
  }
}
