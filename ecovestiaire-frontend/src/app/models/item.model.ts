export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  itemCount?: number;
}

export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  HIDDEN = 'HIDDEN',
  BANNED = 'BANNED'
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  size?: string;
  conditionLabel?: string;
  status: ItemStatus;
  photos: string[];
  category: Category;
  seller: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  likesCount?: number;
}
