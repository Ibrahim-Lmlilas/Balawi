import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OrderService, ShippingInfo } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        
        <!-- HEADER -->
        <div class="mb-8 border-b-[4px] border-balawi-bg pb-4 flex items-end justify-between gap-4">
          <div class="space-y-1.5">
            <h1 class="text-2xl md:text-4xl font-heading text-balawi-bg uppercase tracking-tight leading-none italic">
              FINALISER LA <span class="text-balawi-neon bg-balawi-bg px-2">COMMANDE</span>
            </h1>
            <div class="w-24 h-1.5 bg-balawi-neon"></div>
          </div>
          <button routerLink="/" class="w-10 h-10 border-[3px] border-balawi-bg flex items-center justify-center hover:bg-balawi-neon transition-all shadow-[3px_3px_0px_0px_#0B0B0B] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] shrink-0">
            <mat-icon class="!text-xl !w-5 !h-5 flex items-center justify-center">close</mat-icon>
          </button>
        </div>

        <div class="bg-white border-[4px] border-balawi-bg shadow-[10px_10px_0px_0px_#A3FF12] p-6 sm:p-10">
          <div class="flex items-center gap-4 mb-8 pb-5 border-b-[3px] border-balawi-bg">
            <div class="w-12 h-12 bg-balawi-bg text-balawi-neon flex items-center justify-center border-[2px] border-balawi-bg shadow-[3px_3px_0px_0px_#A3FF12] shrink-0">
              <mat-icon class="!text-2xl !w-6 !h-6 flex items-center justify-center">local_shipping</mat-icon>
            </div>
            <div class="min-w-0">
              <div class="text-lg md:text-xl font-heading text-balawi-bg uppercase tracking-tight truncate italic font-black">Informations de livraison</div>
              <div class="font-slogan text-[9px] text-balawi-bg/50 uppercase tracking-[0.2em] mt-1 truncate italic font-bold">OÙ DEVONS-NOUS ENVOYER VOTRE COLIS ?</div>
            </div>
          </div>

          <div *ngIf="errorMessage()" class="mb-6 bg-red-500 text-white p-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-widest italic">
            {{ errorMessage() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Prénom <span class="text-red-500">*</span></label>
                <input formControlName="firstName" type="text" placeholder="EX: ANAS" 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>
              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Nom <span class="text-red-500">*</span></label>
                <input formControlName="lastName" type="text" placeholder="EX: BALAWI" 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>

              <div class="sm:col-span-2 space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Adresse Complète <span class="text-red-500">*</span></label>
                <input formControlName="address1" type="text" placeholder="RUE 123, QUARTIER..." 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>

              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Ville <span class="text-red-500">*</span></label>
                <input formControlName="city" type="text" placeholder="CASABLANCA" 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>
              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Code Postal <span class="text-red-500">*</span></label>
                <input formControlName="zip" type="text" placeholder="20000" 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>

              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Pays <span class="text-red-500">*</span></label>
                <input formControlName="country" type="text" placeholder="MOROCCO" 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>
              <div class="space-y-2">
                <label class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest italic font-bold">Téléphone <span class="text-red-500">*</span></label>
                <input formControlName="phone" type="text" placeholder="+212 6..." 
                       class="w-full px-4 py-3 border-[3px] border-balawi-bg font-heading text-xs uppercase tracking-tight focus:bg-balawi-neon/10 outline-none transition-all placeholder:text-balawi-bg/20 italic" />
              </div>
            </div>

            <div class="pt-8 border-t-[3px] border-balawi-bg flex flex-col sm:flex-row items-center justify-end gap-4">
              <a routerLink="/" class="font-heading text-xs uppercase tracking-widest text-balawi-bg hover:text-balawi-neon transition-colors italic font-bold">
                ANNULER
              </a>
              <button type="submit" [disabled]="isSubmitting() || form.invalid" 
                      class="w-full sm:w-auto px-8 py-4 bg-balawi-neon text-balawi-bg font-heading text-lg uppercase tracking-widest border-[3px] border-balawi-bg shadow-[6px_6px_0px_0px_#0B0B0B] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 italic">
                <span *ngIf="!isSubmitting()">CONTINUER PAIEMENT</span>
                <div *ngIf="isSubmitting()" class="w-5 h-5 border-3 border-balawi-bg border-t-transparent rounded-full animate-spin"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  private itemId: number | null;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    address1: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    zip: ['', [Validators.required, Validators.maxLength(30)]],
    country: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    const itemIdParam = this.route.snapshot.queryParamMap.get('itemId');
    const parsed = itemIdParam ? Number(itemIdParam) : NaN;
    this.itemId = Number.isFinite(parsed) ? parsed : null;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }

  submit() {
    if (this.isSubmitting()) return;
    if (!this.itemId) {
      this.errorMessage.set('Article invalide.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const shipping: ShippingInfo = this.form.getRawValue() as ShippingInfo;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.orderService.createOrder(this.itemId, shipping).subscribe({
      next: (order) => {
        const origin = window.location.origin;
        const successUrl = `${origin}/payment-success?orderId=${order.id}&itemId=${this.itemId}`;
        const cancelUrl = `${origin}/payment-cancel?orderId=${order.id}&itemId=${this.itemId}`;

        this.paymentService.createCheckoutSession(order.id, successUrl, cancelUrl).subscribe({
          next: (r) => {
            if (r?.checkoutUrl) {
              window.location.href = r.checkoutUrl;
              return;
            }
            this.isSubmitting.set(false);
            this.errorMessage.set('Impossible de démarrer le paiement.');
          },
          error: (err) => {
            console.error('Error creating checkout session', err);
            this.isSubmitting.set(false);
            this.errorMessage.set('Impossible de démarrer le paiement.');
          }
        });
      },
      error: (err) => {
        console.error('Error creating order', err);
        this.isSubmitting.set(false);
        this.errorMessage.set("Impossible de créer la commande.");
      }
    });
  }
}
