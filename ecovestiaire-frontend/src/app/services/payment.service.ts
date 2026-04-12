import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

export interface CreateCheckoutSessionRequest {
  orderId: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  createCheckoutSession(orderId: number, successUrl: string, cancelUrl: string): Observable<CreateCheckoutSessionResponse> {
    const body: CreateCheckoutSessionRequest = {
      orderId,
      successUrl,
      cancelUrl
    };

    return this.http.post<CreateCheckoutSessionResponse>(
      `${this.baseUrl}/payments/create-checkout-session`,
      body
    );
  }
}
