export interface MessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  senderFirstName: string;
  senderLastName: string;
  senderProfilePhotoUrl: string;
  content: string | null;
  createdAt: string;
  editedAt: string | null;
  read: boolean;
}

export interface ConversationSummaryResponse {
  id: number;
  otherUserId: number;
  otherUserFirstName: string;
  otherUserLastName: string;
  otherUserProfilePhotoUrl: string;
  itemId: number;
  itemTitle: string;
  lastMessageContent: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
}

export interface SendMessageRequest {
  content: string;
}

export interface StartConversationRequest {
  targetUserId: number;
  itemId?: number;
}
