import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/tokens/api-base-url.token';
import { AdminUser, AdminItem, AdminComment, AdminCategory } from '../../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminModerationService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  // --- Gestion Utilisateurs ---
  getUsers(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${this.baseUrl}/admin/users`, { params });
  }

  updateUserStatus(userId: number, status: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/admin/users/${userId}/status`, { status });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/users/${userId}`);
  }

  // --- Gestion Articles ---
  getItems(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${this.baseUrl}/admin/items`, { params });
  }

  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/items/${itemId}`);
  }

  // --- Gestion Commentaires ---
  getComments(
    page: number = 0,
    size: number = 10,
    options?: {
      q?: string;
      reportedOnly?: boolean;
      sort?: string;
    }
  ): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (options?.q) {
      params = params.set('q', options.q);
    }
    if (options?.reportedOnly) {
      params = params.set('reportedOnly', true);
    }
    if (options?.sort) {
      params = params.set('sort', options.sort);
    }

    return this.http.get<any>(`${this.baseUrl}/admin/comments`, { params });
  }

  reportComment(commentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/admin/comments/${commentId}/report`, {});
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/comments/${commentId}`);
  }

  // --- Gestion Catégories ---
  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.baseUrl}/admin/categories`);
  }

  createCategory(category: Partial<AdminCategory>, iconFile?: File | null): Observable<AdminCategory> {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(category)], {
        type: 'application/json'
      })
    );
    if (iconFile) {
      formData.append('icon', iconFile);
    }

    return this.http.post<AdminCategory>(`${this.baseUrl}/admin/categories`, formData);
  }

  updateCategory(id: number, category: Partial<AdminCategory>, iconFile?: File | null): Observable<AdminCategory> {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(category)], {
        type: 'application/json'
      })
    );
    if (iconFile) {
      formData.append('icon', iconFile);
    }

    return this.http.put<AdminCategory>(`${this.baseUrl}/admin/categories/${id}`, formData);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/categories/${id}`);
  }

  // --- Gestion Commandes ---
  getAllOrders(
    page: number = 0,
    size: number = 10,
    options?: {
      q?: string;
      sort?: string;
    }
  ): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (options?.q) {
      params = params.set('q', options.q);
    }
    if (options?.sort) {
      params = params.set('sort', options.sort);
    }

    return this.http.get<any>(`${this.baseUrl}/admin/orders`, { params });
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/orders/${orderId}/status`, { status });
  }
}
