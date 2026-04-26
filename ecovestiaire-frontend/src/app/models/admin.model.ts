export interface AdminStats {
  totalUsers: number;
  totalActiveUsers: number;
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
  itemsPerCategory: Record<string, number>;
  newUsersPerDay: Record<string, number>;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUSPENDED';
  profilePhotoUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  profileImage?: string;
  roles?: string[];
  deleted?: boolean;
}

export interface AdminItem {
  id: number;
  title: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'BANNED';
  createdAt: string;
  sellerFirstName: string;
}

export interface AdminComment {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorFirstName: string;
  authorLastName: string;
  authorProfilePhotoUrl?: string;
  itemId?: number;
  itemTitle?: string;
  itemImageUrl?: string;
  reported?: boolean;
  reportCount?: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}
