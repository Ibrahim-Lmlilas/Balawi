import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorFullName: string;
  authorProfilePhotoUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  private toAbsoluteUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalized}`;
  }

  private mapAnyToComment(r: any): Comment {
    const author = r?.author ?? r?.user ?? null;

    const authorId = r?.authorId ?? r?.userId ?? author?.id ?? 0;

    const firstName = r?.authorFirstName ?? author?.firstName ?? r?.firstName ?? '';
    const lastName = r?.authorLastName ?? author?.lastName ?? r?.lastName ?? '';

    const fullNameCandidate = r?.authorFullName ?? r?.name ?? `${firstName} ${lastName}`;
    const authorFullName = String(fullNameCandidate ?? '').trim() || 'User';

    const photo = r?.authorProfilePhotoUrl ?? r?.profilePhotoUrl ?? author?.profilePhotoUrl ?? null;

    const content = r?.content ?? r?.text ?? r?.message ?? '';
    const createdAt = r?.createdAt ?? r?.created_at ?? new Date().toISOString();
    const id = r?.id ?? r?.commentId ?? Date.now();

    return {
      id,
      content,
      createdAt,
      authorId,
      authorFullName,
      authorProfilePhotoUrl: this.toAbsoluteUrl(photo)
    };
  }

  getItemComments(itemId: number): Observable<Comment[]> {
    return this.http.get<any>(`${this.baseUrl}/items/${itemId}/comments`).pipe(
      map((res: any) => {
        const rows = Array.isArray(res)
          ? res
          : Array.isArray(res?.content)
            ? res.content
            : Array.isArray(res?.data)
              ? res.data
              : [];
        return rows.map((r: any) => this.mapAnyToComment(r));
      })
    );
  }

  addItemComment(itemId: number, content: string): Observable<Comment> {
    return this.http
      .post<any>(`${this.baseUrl}/items/${itemId}/comments`, { content })
      .pipe(map((r) => this.mapAnyToComment(r)));
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`);
  }
}
