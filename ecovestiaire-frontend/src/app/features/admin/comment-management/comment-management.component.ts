import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModerationService } from '../../../services/admin/admin-moderation.service';
import { AdminComment } from '../../../models/admin.model';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-comment-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './comment-management.component.html',
  styleUrls: ['./comment-management.component.scss']
})
export class CommentManagementComponent implements OnInit {
  private moderationService = inject(AdminModerationService);
  public authService = inject(AuthService);

  comments = signal<AdminComment[]>([]);
  isLoading = signal(true);
  currentPage = signal(0);

  query = signal('');
  sort = signal<'createdAt,desc' | 'createdAt,asc'>('createdAt,desc');

  readonly pageSize = 6;
  page = signal(0);

  get pagedComments(): AdminComment[] {
    const start = this.page() * this.pageSize;
    return this.comments().slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.comments().length / this.pageSize); }
  get pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  goToPage(p: number) { if (p >= 0 && p < this.totalPages) this.page.set(p); }

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.isLoading.set(true);
    this.moderationService
      .getComments(this.currentPage(), 100, {
        q: this.query().trim() || undefined,
        sort: this.sort()
      })
      .subscribe({
      next: (response: any) => {
        const rawComments = response.content || response;
        console.log('DEBUG COMMENTS RAW DATA:', JSON.stringify(rawComments, null, 2));
        this.comments.set(rawComments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement commentaires', err);
        this.isLoading.set(false);
      }
    });
  }

  reportComment(commentId: number) {
    Swal.fire({
      title: 'Signaler le commentaire ?',
      text: "Le commentaire sera marqué comme signalé.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3FF12', // Neon
      cancelButtonColor: '#0B0B0B', // Black
      confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">Signaler</span>',
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
        this.executeReport(commentId);
      }
    });
  }

  private executeReport(commentId: number) {
    this.moderationService.reportComment(commentId).subscribe({
      next: () => {
        this.comments.update(list =>
          list.map(c => {
            if (c.id !== commentId) {
              return c;
            }
            const nextCount = (c.reportCount ?? 0) + 1;
            return {
              ...c,
              reported: true,
              reportCount: nextCount
            };
          })
        );
        Swal.fire({
          title: 'Signalé !',
          text: 'Le commentaire a été signalé.',
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
        console.error('Erreur signalement commentaire', err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de signaler le commentaire.',
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

  deleteComment(commentId: number) {
    Swal.fire({
      title: 'Supprimer le commentaire ?',
      text: "Ce commentaire sera définitivement supprimé.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3FF12', // Neon
      cancelButtonColor: '#0B0B0B', // Black
      confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">Supprimer</span>',
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
        this.executeDelete(commentId);
      }
    });
  }

  private executeDelete(commentId: number) {
    this.moderationService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update(list => list.filter(c => c.id !== commentId));
        Swal.fire({
          title: 'Supprimé !',
          text: 'Le commentaire a été supprimé.',
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
        console.error('Erreur suppression commentaire', err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer le commentaire.',
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

  applyFilters() {
    this.currentPage.set(0);
    this.page.set(0);
    this.loadComments();
  }

  resetFilters() {
    this.query.set('');
    this.sort.set('createdAt,desc');
    this.applyFilters();
  }

  onQueryInput(value: string) {
    this.query.set(value);
  }

  onSortChange(value: string) {
    if (value === 'createdAt,asc' || value === 'createdAt,desc') {
      this.sort.set(value);
      this.applyFilters();
    }
  }
}
