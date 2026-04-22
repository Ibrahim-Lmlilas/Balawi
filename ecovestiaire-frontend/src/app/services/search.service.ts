import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

export interface SearchResult {
  items: any[];
  users: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  search(query: string): Observable<SearchResult> {
    if (!query || query.trim().length < 2) {
      return of({ items: [], users: [] });
    }

    const params = new HttpParams().set('q', query);

    // On suppose que le backend a un endpoint /users?q=... ou /users/search?q=...
    // Si l'endpoint diffère, on ajustera.
    const items$ = this.http.get<any[]>(`${this.baseUrl}/items`, { params }).pipe(
      catchError(() => of([]))
    );

    const users$ = this.http.get<any[]>(`${this.baseUrl}/users`, { params }).pipe(
      catchError(() => of([]))
    );

    return forkJoin({
      items: items$,
      users: users$
    });
  }
}
