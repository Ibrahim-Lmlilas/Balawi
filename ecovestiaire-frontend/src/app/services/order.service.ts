import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
}

export interface CreateOrderRequest {
  itemId: number;
  shipping?: ShippingInfo;
}

export interface OrderResponse {
  id: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  stripeCheckoutSessionId?: string | null;
  shipping?: ShippingInfo;
  itemId?: number;
  itemTitle?: string;
  itemImageUrl?: string;
  buyerId?: number;
  buyerName?: string;
  sellerId?: number;
  sellerName?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  createOrder(itemId: number, shipping?: ShippingInfo): Observable<OrderResponse> {
    const body: CreateOrderRequest = { itemId, shipping };
    return this.http.post<OrderResponse>(`${this.baseUrl}/orders`, body);
  }

  getActiveOrderByItemId(itemId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/orders/active?itemId=${itemId}`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/orders/${orderId}/cancel`, {});
  }

  getMyPurchases(page: number = 0, size: number = 10): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get<any>(`${this.baseUrl}/orders/my-purchases`, { params });
  }

  getMySales(page: number = 0, size: number = 10): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.http.get<any>(`${this.baseUrl}/orders/my-sales`, { params });
  }
}
