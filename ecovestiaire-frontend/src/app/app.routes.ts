import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { ItemDetailComponent } from './features/articles/item-detail/item-detail.component';
import { EditItemComponent } from './features/articles/edit-item/edit-item.component';
import { PublishItemComponent } from './features/articles/publish-item/publish-item.component';
import { UserProfileComponent } from './features/users/user-profile/user-profile.component';
import { SearchResultsComponent } from './features/search/search-results/search-results.component';
import { SearchUsersResultsComponent } from './features/search/search-users-results/search-users-results.component';
import { UserFollowersComponent } from './features/users/user-followers/user-followers.component';
import { PaymentSuccessComponent } from './features/payments/payment-success/payment-success.component';
import { PaymentCancelComponent } from './features/payments/payment-cancel/payment-cancel.component';
import { CheckoutComponent } from './features/payments/checkout/checkout.component';
import { NotificationListComponent } from './features/notifications/notification-list/notification-list.component';
import { FavoritesComponent } from './features/favorites/favorites.component';
import { MyPurchasesComponent } from './features/orders/my-purchases/my-purchases.component';
import { MySalesComponent } from './features/orders/my-sales/my-sales.component';
import { ChatListComponent } from './features/chat/chat-list/chat-list.component';
import { ChatDetailComponent } from './features/chat/chat-detail/chat-detail.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { ItemManagementComponent } from './features/admin/item-management/item-management.component';
import { AdminItemDetailComponent } from './features/admin/item-management/item-detail/item-detail.component';
import { CommentManagementComponent } from './features/admin/comment-management/comment-management.component';
import { CategoryManagementComponent } from './features/admin/category-management/category-management.component';
import { OrderManagementComponent } from './features/admin/order-management/order-management.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'about', redirectTo: '', pathMatch: 'full' },
  { path: 'how-it-works', redirectTo: '', pathMatch: 'full' },
  { path: 'terms', redirectTo: '', pathMatch: 'full' },
  { path: 'privacy', redirectTo: '', pathMatch: 'full' },

  { path: 'search', component: SearchResultsComponent },
  { path: 'search/users', component: SearchUsersResultsComponent },
  { path: 'items/publish', component: PublishItemComponent },
  { path: 'items/:id/edit', component: EditItemComponent },
  { path: 'items/:id', component: ItemDetailComponent },
  { path: 'users/:id/followers', component: UserFollowersComponent },
  { path: 'users/:id/following', component: UserFollowersComponent },
  { path: 'users/:id', component: UserProfileComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'notifications', component: NotificationListComponent },
  { path: 'messages', component: ChatListComponent },
  { path: 'messages/:id', component: ChatDetailComponent },
  {
    path: 'conversations/:id',
    redirectTo: 'messages/:id',
    pathMatch: 'full'
  },
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'payment-cancel', component: PaymentCancelComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: 'my-purchases', component: MyPurchasesComponent, canActivate: [authGuard] },
  { path: 'my-sales', component: MySalesComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  
  // Routes Admin
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'items', component: ItemManagementComponent },
      { path: 'items/:id', component: AdminItemDetailComponent },
      { path: 'comments', component: CommentManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'orders', component: OrderManagementComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
