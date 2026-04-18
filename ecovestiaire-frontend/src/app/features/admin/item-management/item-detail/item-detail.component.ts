import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ItemService } from '../../../../services/item.service';
import { CommentService, Comment } from '../../../../services/comment.service';
import { AdminModerationService } from '../../../../services/admin/admin-moderation.service';
import { Item, ItemStatus } from '../../../../models/item.model';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-item-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class AdminItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(ItemService);
  private commentService = inject(CommentService);
  private moderationService = inject(AdminModerationService);
  public authService = inject(AuthService);

  item = signal<Item | null>(null);
  comments = signal<Comment[]>([]);
  isLoading = signal(true);
  photoIndex = signal(0);

  currentPhoto = computed(() => {
    const photos = this.item()?.photos || [];
    return photos[this.photoIndex()] || 'assets/images/placeholder-item.svg';
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.router.navigate(['/admin/items']);
      return;
    }
    this.loadItemData(id);
  }

  loadItemData(id: number) {
    this.isLoading.set(true);
    this.itemService.getItemById(id).subscribe({
      next: (it) => {
        this.item.set(it);
        this.loadComments(id);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading item', err);
        this.isLoading.set(false);
        this.router.navigate(['/admin/items']);
      }
    });
  }

  loadComments(itemId: number) {
    this.commentService.getItemComments(itemId).subscribe({
      next: (list) => this.comments.set(list || []),
      error: (err) => console.error('Error loading comments', err)
    });
  }

  deleteItem() {
    const it = this.item();
    if (!it) return;

    Swal.fire({
      title: 'Supprimer l\'article ?',
      text: "Cette action est irréversible et supprimera également tous les commentaires associés.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A3FF12', // Neon
      cancelButtonColor: '#0B0B0B', // Black
      confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">Oui, supprimer</span>',
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
        this.moderationService.deleteItem(it.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Supprimé !',
              text: 'L\'article a été supprimé avec succès.',
              icon: 'success',
              confirmButtonColor: '#A3FF12',
              confirmButtonText: '<span style="color: #0B0B0B; font-weight: bold; font-family: \'Inter\', sans-serif;">OK</span>',
              customClass: {
                title: 'font-heading text-balawi-bg text-2xl',
                confirmButton: 'rounded-xl border border-balawi-bg'
              },
              heightAuto: false
            }).then(() => {
              this.router.navigate(['/admin/items']);
            });
          },
          error: (err) => {
            console.error('Error deleting item', err);
            Swal.fire({
              title: 'Erreur',
              text: 'Impossible de supprimer l\'article.',
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
        this.commentService.deleteComment(commentId).subscribe({
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
            console.error('Error deleting comment', err);
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
    });
  }

  selectPhoto(index: number) {
    this.photoIndex.set(index);
  }
}
