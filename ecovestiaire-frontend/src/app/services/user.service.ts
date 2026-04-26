import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../core/tokens/api-base-url.token';



export interface UserProfileResponse {

  id: number;

  firstName: string;

  lastName: string;

  email: string | null;

  bio: string | null;

  profilePhotoUrl: string | null;

  location: string | null;

  role: string | null;

  followersCount?: number;

  followingCount?: number;

  isFollowing?: boolean;
  createdAt?: string | Date;
}



export interface UserSearchResult {

  id: number;

  firstName: string;

  lastName: string;

  profilePhotoUrl: string | null;

  location: string | null;

}



export interface UpdateUserProfileRequest {

  firstName: string;

  lastName: string;

  bio: string | null;

  location: string | null;

  profilePhotoUrl?: string | null;

}



export interface PageResponse<T> {

  content: T[];

  totalPages: number;

  totalElements: number;

  number: number;

  size: number;

  first: boolean;

  last: boolean;

  empty: boolean;

}



@Injectable({

  providedIn: 'root'

})

export class UserService {

  private http = inject(HttpClient);

  private baseUrl = inject(API_BASE_URL);



  private normalizeUploadsPath(path: string): string {

    if (path.startsWith('/api/uploads/')) return path.replace('/api/uploads/', '/uploads/');

    if (path.startsWith('api/uploads/')) return path.replace('api/uploads/', 'uploads/');

    return path;

  }



  private toAbsoluteUrl(path: string | null): string | null {

    if (!path) return path;



    // Fix legacy absolute URLs

    if (path.startsWith('http://') || path.startsWith('https://')) {

      return path.replace('/api/uploads/', '/uploads/');

    }



    // Static files are served from root (/uploads/**), API is under /api

    const apiBase = this.baseUrl.replace(/\/api$/, '');

    const cleaned = this.normalizeUploadsPath(path);

    const normalized = cleaned.startsWith('/') ? cleaned.slice(1) : cleaned;

    return `${apiBase}/${normalized}`;

  }



  getPublicProfileById(id: number): Observable<UserProfileResponse> {

    return this.http.get<UserProfileResponse>(`${this.baseUrl}/api/users/${id}`);

  }



  getMyProfile(): Observable<UserProfileResponse> {

    return this.http.get<UserProfileResponse>(`${this.baseUrl}/api/users/me`);

  }



  updateMyProfile(payload: UpdateUserProfileRequest): Observable<UserProfileResponse> {

    return this.http.put<UserProfileResponse>(`${this.baseUrl}/api/users/me`, payload);

  }



  uploadMyProfilePhoto(file: File): Observable<UserProfileResponse> {

    const formData = new FormData();

    formData.append('file', file);



    const url = `${this.baseUrl}/api/users/me/photo`;

    console.log('Uploading photo to:', url);



    return this.http.post<UserProfileResponse>(url, formData).pipe(

      catchError((err) => {

        console.error('Upload photo error:', err);

        return throwError(() => err);

      })

    );

  }



  searchUsers(query: string, page = 0, pageSize = 10): Observable<PageResponse<UserSearchResult>> {

    const q = query.trim();

    return this.http.get<PageResponse<UserSearchResult>>(

      `${this.baseUrl}/api/users/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`

    );

  }



  followUser(id: number): Observable<any> {

    return this.http.post(`${this.baseUrl}/api/users/${id}/follow`, {});

  }



  unfollowUser(id: number): Observable<any> {

    return this.http.delete(`${this.baseUrl}/api/users/${id}/follow`);

  }



  getFollowers(id: number): Observable<UserSearchResult[]> {

    return this.http.get<UserSearchResult[]>(`${this.baseUrl}/api/users/${id}/followers`);

  }



  getFollowing(id: number): Observable<UserSearchResult[]> {

    return this.http.get<UserSearchResult[]>(`${this.baseUrl}/api/users/${id}/following`);

  }



  normalizeProfilePhotoUrl(profile: UserProfileResponse): UserProfileResponse {

    return {

      ...profile,

      profilePhotoUrl: this.toAbsoluteUrl(profile.profilePhotoUrl)

    };

  }



  normalizeSearchResultPhotoUrl(user: UserSearchResult): UserSearchResult {

    return {

      ...user,

      profilePhotoUrl: this.toAbsoluteUrl(user.profilePhotoUrl)

    };

  }

}

