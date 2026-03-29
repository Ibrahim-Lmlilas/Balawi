import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ItemService, ItemRequest } from '../../../services/item.service';
import { Category, Item } from '../../../models/item.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  templateUrl: './edit-item.component.html',
  styleUrls: ['./edit-item.component.scss']
})
export class EditItemComponent implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  itemId = signal<number | null>(null);
  item = signal<Item | null>(null);

  categories = signal<Category[]>([]);
  selectedFiles = signal<File[]>([]);
  previews = signal<string[]>([]);

  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  editForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    price: ['', [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    size: ['', [Validators.maxLength(20)]],
    conditionLabel: ['', [Validators.maxLength(50)]]
  });

  conditions = [
    'Neuf avec étiquette',
    'Neuf sans étiquette',
    'Très bon état',
    'Bon état',
    'Satisfaisant'
  ];

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46'];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!idParam || Number.isNaN(id)) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid item id');
      return;
    }

    this.itemId.set(id);

    this.itemService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err)
    });

    this.itemService.getItemById(id).subscribe({
      next: (it) => {
        this.item.set(it);
        this.editForm.patchValue({
          title: it.title,
          description: it.description,
          price: it.price,
          categoryId: it.category?.id,
          size: it.size ?? '',
          conditionLabel: it.conditionLabel ?? ''
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading item', err);
        this.errorMessage.set("Impossible de charger l'article.");
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedFiles.update(prev => [...prev, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previews.update(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeFile(index: number) {
    this.selectedFiles.update(prev => prev.filter((_, i) => i !== index));
    this.previews.update(prev => prev.filter((_, i) => i !== index));
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.itemId();
    if (!id) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.editForm.value;
    const request: ItemRequest = {
      title: formValue.title,
      description: formValue.description,
      price: formValue.price,
      categoryId: Number(formValue.categoryId),
      size: formValue.size || undefined,
      conditionLabel: formValue.conditionLabel || undefined
    };

    const photos = this.selectedFiles();

    this.itemService.updateItem(id, request, photos.length ? photos : undefined).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Article modifié !',
          text: 'Les modifications ont été enregistrées avec succès.',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
        this.router.navigate(['/items', updated.id]);
      },
      error: (err) => {
        console.error('Error updating item', err);
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la modification. Veuillez réessayer.',
          confirmButtonColor: '#16A34A'
        });
        this.errorMessage.set("Une erreur est survenue lors de la modification.");
      }
    });
  }
}
