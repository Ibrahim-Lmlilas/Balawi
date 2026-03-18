import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { Category } from '../../../models/item.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  private itemService = inject(ItemService);
  categories: Category[] = [];

  ngOnInit() {
    this.itemService.getCategories().subscribe({
      next: (cats) => {
        // Prendre les 4 premières catégories
        this.categories = (cats || []).slice(0, 4);
      },
      error: (err) => {
        console.error('Error fetching categories for footer', err);
      }
    });
  }
}