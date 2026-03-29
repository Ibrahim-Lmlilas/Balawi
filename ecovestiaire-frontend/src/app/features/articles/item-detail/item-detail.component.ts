import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ItemService } from '../../../services/item.service';
import { Item, ItemStatus } from '../../../models/item.model';
import { AuthService } from '../../../services/auth.service';
import { Comment, CommentService } from '../../../services/comment.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { ChatService } from '../../../services/chat.service';
import { StartConversationRequest } from '../../../models/chat.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink, MatDialogModule, MatSnackBarModule, MatMenuModule],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private itemService = inject(ItemService);
  public authService = inject(AuthService);
  private commentService = inject(CommentService);
  public router = inject(Router);
  private dialog = inject(MatDialog);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private chatService = inject(ChatService);
  private snackBar = inject(MatSnackBar);

  item = signal<Item | null>(null);
  isLoading = signal(true);
  isReserving = signal(false);
  errorMessage = signal<string | null>(null);

  photoIndex = signal(0);
  newCommentText = signal('');
  isLoggedIn = signal(false);
  currentUserId = signal<number | null>(null);
  isPaying = signal(false);
  activeOrderId = signal<number | null>(null);
  isLoadingActiveOrder = signal(false);

  comments = signal<Comment[]>([]);
  private itemId: number | null = null;

  isSeller = computed(() => {
    const it = this.item();
    const userId = this.currentUserId();
    return !!it && !!userId && it.seller?.id === userId;
  });

  isOwnItem = computed(() => this.isSeller());

  currentPhoto = computed(() => {
    const photos = this.item()?.photos || [];
    return photos[this.photoIndex()] || 'assets/images/placeholder-item.jpg';
  });

  getPublishedDateLabel(createdAt: string | null | undefined): string {
    if (!createdAt) return 'Posted recently';
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return 'Posted recently';
    return `Posted ${d.toLocaleDateString()}`;
  }

  private tryLoadActiveOrder() {
    const it = this.item();
    if (!it) return;
    if (it.status !== ItemStatus.RESERVED) {
      this.activeOrderId.set(null);
      return;
    }
    if (!this.authService.isLoggedIn()) return;
    if (this.isLoadingActiveOrder()) return;
    if (!this.itemId) return;

    this.isLoadingActiveOrder.set(true);
    this.orderService.getActiveOrderByItemId(this.itemId).subscribe({
      next: (order) => {
        const status = order?.status;
        if (status === 'PENDING_PAYMENT') {
          this.activeOrderId.set(order?.id ?? null);
        } else {
          this.activeOrderId.set(null);
          if (status === 'PAID') {
            this.itemService.getItemById(this.itemId!).subscribe({
              next: (updated) => this.item.set(updated),
              error: () => {}
            });
          }
        }
        this.isLoadingActiveOrder.set(false);
      },
      error: () => {
        // 404 => pas de commande active pour ce user
        this.activeOrderId.set(null);
        this.isLoadingActiveOrder.set(false);
      }
    });
  }

  statusLabel = computed(() => {
    const status = this.item()?.status;
    if (status === ItemStatus.AVAILABLE) return 'Available';
    if (status === ItemStatus.SOLD) return 'Sold';
    if (status === ItemStatus.HIDDEN) return 'Hidden';
    return '';
  });

  statusClass = computed(() => {
    const status = this.item()?.status;
    if (status === ItemStatus.AVAILABLE) return 'bg-green-100 text-green-700';
    if (status === ItemStatus.SOLD) return 'bg-gray-100 text-gray-700';
    if (status === ItemStatus.HIDDEN) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!idParam || Number.isNaN(id)) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid item id');
      return;
    }

    this.itemId = id;

    this.itemService.getItemById(id).subscribe({
      next: (it) => {
        console.log('ItemDetail - Data from backend:', it);
        this.item.set(it);
        this.isLoading.set(false);
        this.isLoggedIn.set(this.authService.isLoggedIn());
        
        this.authService.currentUser$.subscribe(user => {
          this.currentUserId.set(user?.id ?? null);
          if (user) {
            this.checkIfFavorite(id);
            this.tryLoadActiveOrder();
          }
        });
      },
      error: (err) => {
        console.error('Error fetching item', err);
        if (err.status === 404) {
          this.errorMessage.set("Cet article n'existe plus.");
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        } else {
          this.errorMessage.set("Une erreur est survenue lors du chargement de l'article.");
        }
        this.isLoading.set(false);
      }
    });

    this.commentService.getItemComments(id).subscribe({
      next: (rows) => {
        this.comments.set(rows || []);
      },
      error: (err) => {
        console.error('Error fetching comments', err);
        this.comments.set([]);
      }
    });
  }

  contactSeller() {
    const currentItem = this.item();
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (!currentItem || !currentItem.seller?.id) return;

    const targetId = Number(currentItem.seller.id);
    const itemId = Number(currentItem.id);

    const payload: StartConversationRequest = {
      targetUserId: targetId
    };
    
    if (!isNaN(itemId) && itemId > 0) {
      payload.itemId = itemId;
    }

    this.chatService.startConversation(payload).subscribe({
      next: (conv) => {
        this.router.navigate(['/messages', conv.id]);
      },
      error: (err) => {
        console.error('Erreur lors de la création de la conversation', err);
        this.snackBar.open('Impossible de démarrer la discussion.', 'Fermer', { duration: 3000 });
      }
    });
  }

  private checkIfFavorite(itemId: number) {
    console.log('ItemDetail - Checking favorites for item:', itemId);
    this.itemService.getFavorites().subscribe({
      next: (favorites) => {
        console.log('ItemDetail - Favorites list received:', favorites);
        const favItem = favorites.find(f => Number(f.id) === Number(itemId));
        const isFav = !!favItem;
        
        const it = this.item();
        if (it) {
          // On privilégie le likesCount du backend s'il est présent, 
          // sinon on garde celui déjà présent dans 'it'
          const finalLikesCount = it.likesCount ?? 0;
          
          console.log(`ItemDetail - Setting isFavorite: ${isFav}, likesCount: ${finalLikesCount}`);
          this.item.set({ 
            ...it, 
            isFavorite: isFav,
            likesCount: finalLikesCount
          });
        }
      },
      error: (err) => console.error('Error checking favorites', err)
    });
  }

  prevPhoto() {
    const it = this.item();
    const photos = it?.photos || [];
    if (photos.length <= 1) return;
    this.photoIndex.set((this.photoIndex() - 1 + photos.length) % photos.length);
  }

  nextPhoto() {
    const it = this.item();
    const photos = it?.photos || [];
    if (photos.length <= 1) return;
    this.photoIndex.set((this.photoIndex() + 1) % photos.length);
  }

  selectPhoto(i: number) {
    this.photoIndex.set(i);
  }

  toggleFavorite() {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const it = this.item();
    if (!it) return;

    const currentlyFavorite = it.isFavorite;
    
    if (currentlyFavorite) {
      this.itemService.removeFavorite(it.id).subscribe({
        next: () => {
          this.item.set({ 
            ...it, 
            isFavorite: false, 
            likesCount: Math.max(0, (it.likesCount || 0) - 1) 
          });
        },
        error: (err) => console.error('Error removing favorite', err)
      });
    } else {
      this.itemService.toggleFavorite(it.id).subscribe({
        next: () => {
          this.item.set({ 
            ...it, 
            isFavorite: true, 
            likesCount: (it.likesCount || 0) + 1 
          });

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Ajouté aux favoris !',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            background: '#ffffff',
            color: '#1f2937',
            iconColor: '#10b981'
          });
        },
        error: (err: any) => {
          console.error('Error adding favorite', err);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Erreur lors de l\'ajout',
            showConfirmButton: false,
            timer: 2500
          });
        }
      });
    }
  }

  buyNow() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const it = this.item();
    if (!it) return;
    if (this.isOwnItem()) return;
    if (it.status !== ItemStatus.AVAILABLE) return;
    if (!this.itemId) return;

    this.router.navigate(['/checkout'], { queryParams: { itemId: this.itemId } });
  }

  continuePayment() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const orderId = this.activeOrderId();
    const it = this.item();
    if (!orderId || !it || !this.itemId) return;
    if (this.isPaying()) return;

    this.isPaying.set(true);

    const origin = window.location.origin;
    const successUrl = `${origin}/payment-success?orderId=${orderId}&itemId=${this.itemId}`;
    const cancelUrl = `${origin}/payment-cancel?orderId=${orderId}&itemId=${this.itemId}`;

    this.paymentService.createCheckoutSession(orderId, successUrl, cancelUrl).subscribe({
      next: (r) => {
        if (r?.checkoutUrl) {
          window.location.href = r.checkoutUrl;
          return;
        }
        this.isPaying.set(false);
      },
      error: (err) => {
        console.error('Error creating checkout session', err);
        this.isPaying.set(false);
      }
    });
  }

  addComment() {
    if (!this.authService.isLoggedIn()) {
      alert('Veuillez vous connecter pour ajouter un commentaire.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const text = this.newCommentText().trim();
    if (!text) return;

    const itemId = this.itemId;
    if (!itemId) return;

    this.commentService.addItemComment(itemId, text).subscribe({
      next: (created) => {
        this.comments.set([...(this.comments() || []), created]);
        this.newCommentText.set('');
        Swal.fire({
          icon: 'success',
          title: 'Commentaire ajouté !',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      },
      error: (err) => {
        console.error('Error adding comment', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible d\'ajouter le commentaire. Veuillez réessayer.',
          confirmButtonColor: '#16A34A'
        });
      }
    });
  }

  deleteComment(c: Comment) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const currentId = this.currentUserId();
    if (!currentId || currentId !== c.authorId) return;

    Swal.fire({
      title: 'Supprimer le commentaire ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentService.deleteComment(c.id).subscribe({
          next: () => {
            this.comments.update((rows) => (rows || []).filter((x) => x.id !== c.id));
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'Le commentaire a été supprimé.',
              timer: 2000,
              showConfirmButton: false,
              position: 'top-end',
              toast: true
            });
          },
          error: (err) => {
            console.error('Error deleting comment', err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de supprimer le commentaire.',
              confirmButtonColor: '#16A34A'
            });
          }
        });
      }
    });
  }
 
  editItem() {
    if (this.itemId) {
      this.router.navigate(['/items', this.itemId, 'edit']);
    }
  }

  deleteItem() {
    if (!this.itemId) return;

    Swal.fire({
      title: 'Supprimer cet article ?',
      text: 'Cette action est irréversible et supprimera définitivement l\'article.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.itemService.deleteItem(this.itemId!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'L\'article a été supprimé avec succès.',
              timer: 2000,
              showConfirmButton: false,
              position: 'top-end',
              toast: true
            });
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Error deleting item', err);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de supprimer l\'article.',
              confirmButtonColor: '#16A34A'
            });
          }
        });
      }
    });
  }
}
