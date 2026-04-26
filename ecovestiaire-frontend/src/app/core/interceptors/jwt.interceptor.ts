import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Endpoints qui ne DOIVENT JAMAIS avoir de token (même si présent)
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const isTokenExpired = (t: string): boolean => {
    try {
      const parts = t.split('.');
      if (parts.length !== 3) return true;
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      const exp = Number(payload?.exp);
      if (!Number.isFinite(exp)) return true;
      const nowSeconds = Math.floor(Date.now() / 1000);
      return exp <= nowSeconds;
    } catch {
      return true;
    }
  };

  let outgoingReq = req;
  if (token && !isTokenExpired(token)) {
    outgoingReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(outgoingReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Token rejected by server — clear session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
