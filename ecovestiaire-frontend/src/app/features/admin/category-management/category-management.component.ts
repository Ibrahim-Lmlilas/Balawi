import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModerationService } from '../../../services/admin/admin-moderation.service';
import { AdminCategory } from '../../../models/admin.model';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../../core/tokens/api-base-url.token';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  private moderationService = inject(AdminModerationService);
  private baseUrl = inject(API_BASE_URL);

  categories = signal<AdminCategory[]>([]);
  query = signal('');
  isLoading = signal(true);
  isEditing = signal(false);
  showForm = signal(false);
  iconPreview = signal<string | null>(null);
  iconFile = signal<File | null>(null);
  
  currentCategory = signal<Partial<AdminCategory>>({
    name: '',
    description: '',
    icon: ''
  });

  readonly pageSize = 8;
  page = signal(0);

  filteredCategories = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.categories();
    return this.categories().filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  get pagedCategories(): AdminCategory[] {
    const start = this.page() * this.pageSize;
    return this.filteredCategories().slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filteredCategories().length / this.pageSize); }
  get pagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  goToPage(p: number) { if (p >= 0 && p < this.totalPages) this.page.set(p); }

  onQueryInput(value: string) {
    this.query.set(value);
    this.page.set(0);
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.moderationService.getCategories().subscribe({
      next: (data) => {
        console.log('Admin categories (raw):', data);
        const normalized = (data || []).map((c: any) => ({
          ...c,
          icon: c?.icon ?? c?.iconPath ?? c?.iconUrl ?? ''
        })) as AdminCategory[];

        this.categories.set(normalized);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement catégories', err);
        this.isLoading.set(false);
      }
    });
  }

  openCreateForm() {
    this.isEditing.set(false);
    this.currentCategory.set({ name: '', description: '', icon: '' });
    this.iconPreview.set(null);
    this.iconFile.set(null);
    this.showForm.set(true);
  }

  openEditForm(cat: AdminCategory) {
    this.isEditing.set(true);
    this.currentCategory.set({ ...cat });
    this.iconPreview.set(cat.icon || null);
    this.iconFile.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  onIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.iconFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.iconPreview.set(result);
      if (result) {
        this.currentCategory.update((c) => ({ ...c, icon: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  toAbsoluteIconUrl(icon: string | null | undefined): string {
    if (!icon) return '';
    if (icon.startsWith('data:')) return icon;
    if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
    const normalized = icon.startsWith('/') ? icon.slice(1) : icon;
    return `${this.baseUrl}/${normalized}`;
  }

  saveCategory() {
    const cat = this.currentCategory();
    if (!cat.name) return;

    const payload = {
      name: cat.name,
      description: cat.description || ''
    };

    const iconFile = this.iconFile();

    if (this.isEditing() && cat.id) {
      this.moderationService.updateCategory(cat.id, payload, iconFile).subscribe({
        next: () => {
          this.loadCategories();
          this.closeForm();
        },
        error: (err) => console.error('Erreur update catégorie', err)
      });
    } else {
      this.moderationService.createCategory(payload, iconFile).subscribe({
        next: () => {
          this.loadCategories();
          this.closeForm();
        },
        error: (err) => console.error('Erreur création catégorie', err)
      });
    }
  }

  deleteCategory(id: number) {
    import('sweetalert2').then(m => {
      const Swal = m.default;
      Swal.fire({
        title: 'Supprimer la catégorie ?',
        text: "Cette action est irréversible et peut affecter les articles associés.",
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
          this.moderationService.deleteCategory(id).subscribe({
            next: () => {
              this.categories.update(list => list.filter(c => c.id !== id));
              Swal.fire({
                title: 'Supprimée !',
                text: 'La catégorie a été supprimée.',
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
              console.error('Erreur suppression catégorie', err);
              Swal.fire({
                title: 'Erreur',
                text: 'Impossible de supprimer la catégorie.',
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
    });
  }
}
