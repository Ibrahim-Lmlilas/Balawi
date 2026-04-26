export enum NotificationType {
  NEW_FOLLOW = 'NEW_FOLLOW',
  ITEM_LIKED = 'ITEM_LIKED',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_ORDER = 'NEW_ORDER',
  NEW_MESSAGE = 'NEW_MESSAGE'
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
