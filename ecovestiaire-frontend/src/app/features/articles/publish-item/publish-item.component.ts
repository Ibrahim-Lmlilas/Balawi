import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ItemService, ItemRequest } from '../../../services/item.service';
import { Category } from '../../../models/item.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-publish-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  templateUrl: './publish-item.component.html',
  styleUrls: ['./publish-item.component.scss']
})
export class PublishItemComponent implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private router = inject(Router);

  publishForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    price: ['', [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    size: ['', [Validators.maxLength(20)]],
    conditionLabel: ['', [Validators.maxLength(50)]]
  });

  categories = signal<Category[]>([]);
  selectedFiles = signal<File[]>([]);
  previews = signal<string[]>([]);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  conditions = [
    'Neuf avec étiquette',
    'Neuf sans étiquette',
    'Très bon état',
    'Bon état',
    'Satisfaisant'
  ];

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46'];

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.itemService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err)
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
    console.log('Submit button clicked');
    console.log('Form validity:', this.publishForm.valid);
    console.log('Form errors:', this.publishForm.errors);
    Object.keys(this.publishForm.controls).forEach(key => {
      const controlErrors = this.publishForm.get(key)?.errors;
      if (controlErrors != null) {
        console.log('Key:', key, 'Errors:', controlErrors);
      }
    });
    console.log('Files count:', this.selectedFiles().length);

    if (this.publishForm.invalid || this.selectedFiles().length === 0) {
      this.publishForm.markAllAsTouched();
      if (this.selectedFiles().length === 0) {
        this.errorMessage.set('Veuillez ajouter au moins une photo');
      } else {
        this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.publishForm.value;
    const request: ItemRequest = {
      title: formValue.title,
      description: formValue.description,
      price: formValue.price,
      categoryId: Number(formValue.categoryId),
      size: formValue.size || undefined,
      conditionLabel: formValue.conditionLabel || undefined
    };

    this.itemService.createItem(request, this.selectedFiles()).subscribe({
      next: (createdItem) => {
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Article publié !',
          text: 'Votre article a été mis en ligne avec succès.',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
        this.router.navigate(['/items', createdItem.id]);
      },
      error: (err) => {
        console.error('Error publishing item', err);
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la publication. Veuillez réessayer.',
          confirmButtonColor: '#16A34A'
        });
      }
    });
  }
}
