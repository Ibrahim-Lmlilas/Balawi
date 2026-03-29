import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, Item, ItemStatus } from '../models/item.model';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

export interface ItemRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  size?: string;
  conditionLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private toAbsoluteUrl(path: string): string {
    if (!path) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalized}`;
  }

  private mapItemResponseToItem(r: any): Item {
    const category: Category = {
      id: r.categoryId,
      name: r.categoryName
    };

    // DEBUG: Log pour voir ce que le backend envoie réellement
    console.log('Item from backend (raw):', r);

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      price: r.price,
      size: r.size ?? undefined,
      conditionLabel: r.conditionLabel ?? undefined,
      status: (r.status as ItemStatus) ?? ItemStatus.AVAILABLE,
      photos: Array.isArray(r.photos) ? r.photos.map((p: string) => this.toAbsoluteUrl(p)) : [],
      category,
      seller: {
        id: r.sellerId ?? r.seller?.id ?? 0,
        firstName: r.sellerFirstName ?? r.seller?.firstName ?? '',
        lastName: r.sellerLastName ?? r.seller?.lastName ?? '',
        profilePhotoUrl: (r.sellerProfilePhotoUrl || r.seller?.profilePhotoUrl)
          ? this.toAbsoluteUrl(r.sellerProfilePhotoUrl || r.seller?.profilePhotoUrl)
          : undefined
      },
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
      isFavorite: r.isFavorite || r.favorite || false,
      likesCount: Number(r.likesCount ?? r.favoriteCount ?? 0)
    } as Item;
  }

  getItems(filters?: any): Observable<Item[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
      if (filters.sellerId) params = params.set('sellerId', filters.sellerId.toString());
      if (filters.q) params = params.set('q', filters.q);

      const pageIndex = filters.page !== undefined ? Math.max(0, Number(filters.page) - 1) : 0;
      params = params.set('page', pageIndex.toString());

      const pageSize = filters.pageSize !== undefined ? filters.pageSize : 50;
      params = params.set('pageSize', pageSize.toString());

      const includeSold = filters.includeSold !== undefined ? filters.includeSold : false;
      params = params.set('includeSold', includeSold.toString());

      if (filters.size) params = params.set('size', filters.size);
      if (filters.conditionLabel) params = params.set('conditionLabel', filters.conditionLabel);

      // Assurer que minPrice et maxPrice sont envoyés s'ils sont définis (même si c'est 0)
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        params = params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        params = params.set('maxPrice', filters.maxPrice.toString());
      }
    } else {
      params = params.set('includeSold', 'false');
      params = params.set('page', '0');
      params = params.set('pageSize', '50');
    }

    console.log('DEBUG: ItemService - GET /items Params:', params.toString());

    return this.http.get<any[]>(`${this.baseUrl}/items`, { params }).pipe(
      map((items) => (items || []).map((r) => this.mapItemResponseToItem(r)))
    );
  }

  getTrendingItems(): Observable<Item[]> {
    return this.http.get<any[]>(`${this.baseUrl}/items/trending`).pipe(
      map((items) => (items || []).map((r) => this.mapItemResponseToItem(r)))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      map(cats => (cats || []).map(c => ({
        ...c,
        icon: c.icon ? this.toAbsoluteUrl(c.icon) : undefined
      })))
    );
  }

  getItemById(id: number): Observable<Item> {
    return this.http.get<any>(`${this.baseUrl}/items/${id}`).pipe(
      map((r) => this.mapItemResponseToItem(r))
    );
  }

  createItem(itemData: ItemRequest, photos: File[]): Observable<Item> {
    const formData = new FormData();

    // Important : Ajouter le JSON sous forme de Blob avec le type application/json
    formData.append('data', new Blob([JSON.stringify(itemData)], {
      type: 'application/json'
    }));

    // Ajouter chaque photo
    photos.forEach(file => {
      formData.append('photos', file);
    });

    return this.http.post<any>(`${this.baseUrl}/items`, formData).pipe(
      map((r) => this.mapItemResponseToItem(r))
    );
  }

  updateItem(id: number, itemData: ItemRequest, photos?: File[]): Observable<Item> {
    const formData = new FormData();

    formData.append('data', new Blob([JSON.stringify(itemData)], {
      type: 'application/json'
    }));

    (photos || []).forEach(file => {
      formData.append('photos', file);
    });

    return this.http.put<any>(`${this.baseUrl}/items/${id}`, formData).pipe(
      map((r) => this.mapItemResponseToItem(r))
    );
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }

  getFavorites(): Observable<Item[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/users/me/favorites`).pipe(
      map((items) => (items || []).map((r) => {
        // Le backend renvoie FavoriteItemResponse : { itemId, title, price, imageUrl, likesCount, status }
        const item: Item = {
          id: r.itemId || r.id,
          title: r.title,
          description: '',
          price: r.price,
          photos: r.imageUrl ? [this.toAbsoluteUrl(r.imageUrl)] : [],
          category: { id: 0, name: '' },
          seller: { id: 0, firstName: '', lastName: '' },
          createdAt: '',
          updatedAt: '',
          isFavorite: true,
          status: r.status || ItemStatus.AVAILABLE,
          likesCount: r.likesCount || 0
        };
        return item;
      }))
    );
  }

  toggleFavorite(itemId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/items/${itemId}/favorite`, {});
  }

  removeFavorite(itemId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${itemId}/favorite`);
  }
}
