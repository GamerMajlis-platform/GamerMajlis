export interface ChatUser {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  currentGame?: string;
  lastSeen?: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: 'GROUP' | 'DIRECT_MESSAGE';
  isPrivate: boolean;
  maxMembers?: number;
  currentMembers: number;
  gameTitle?: string;
  tournamentId?: number;
  eventId?: number;
  creator: ChatUser;
  moderatorIds?: number[];
  members?: ChatMember[];
  isActive: boolean;
  allowFileSharing: boolean;
  allowEmojis: boolean;
  messageHistoryDays: number;
  slowModeSeconds?: number;
  totalMessages: number;
  createdAt: string;
  lastActivity: string;
  lastMessage?: ChatMessage;
}

export interface ChatMessage {
  id: number;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM';
  sender: ChatUser;
  chatRoom?: {
    id: number;
    name: string;
  };
  replyToMessageId?: number;
  replyToMessage?: {
    id: number;
    content: string;
    sender: ChatUser;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: number;
  emoji: string;
  user: ChatUser;
  createdAt: string;
}

export interface ChatMember {
  id: number;
  user: ChatUser;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  lastSeen?: string;
  isOnline?: boolean;
  permissions?: string[];
}

export interface TypingIndicator {
  roomId: number;
  user: ChatUser;
  isTyping: boolean;
  timestamp: string;
}

// API Request Types
export interface CreateChatRoomRequest {
  name: string;
  description?: string;
  type?: 'GROUP' | 'DIRECT_MESSAGE';
  isPrivate?: boolean;
  maxMembers?: number;
  gameTitle?: string;
  tournamentId?: number;
  eventId?: number;
  allowFileSharing?: boolean;
  allowEmojis?: boolean;
  messageHistoryDays?: number;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  replyToMessageId?: number;
  file?: File;
}

export interface AddMemberRequest {
  role?: 'MEMBER' | 'MODERATOR';
}

export interface TypingRequest {
  roomId: number;
  isTyping?: boolean;
}

export interface DirectMessageRequest {
  recipientId: number;
}

// API Response Types
export interface ChatApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ChatRoomResponse extends ChatApiResponse<ChatRoom> {
  chatRoom: ChatRoom;
}

export interface ChatRoomsListResponse extends ChatApiResponse<ChatRoom[]> {
  chatRooms: ChatRoom[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ChatMessageResponse extends ChatApiResponse<ChatMessage> {
  chatMessage: ChatMessage;
}

export interface ChatMessagesListResponse
  extends ChatApiResponse<ChatMessage[]> {
  messages: ChatMessage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ChatMemberResponse extends ChatApiResponse<ChatMember> {
  membership: ChatMember;
}

export interface ChatMembersListResponse extends ChatApiResponse<ChatMember[]> {
  members: ChatMember[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OnlineUsersResponse extends ChatApiResponse<ChatUser[]> {
  onlineUsers: ChatUser[];
}

export interface TypingResponse extends ChatApiResponse<void> {
  roomId: number;
  isTyping: boolean;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type:
    | 'MESSAGE'
    | 'TYPING'
    | 'USER_JOINED'
    | 'USER_LEFT'
    | 'ROOM_UPDATED'
    | 'USER_STATUS';
  data: any;
  timestamp: string;
}

export interface MessageWebSocketEvent extends WebSocketEvent {
  type: 'MESSAGE';
  data: ChatMessage;
}

export interface TypingWebSocketEvent extends WebSocketEvent {
  type: 'TYPING';
  data: TypingIndicator;
}

export interface UserJoinedWebSocketEvent extends WebSocketEvent {
  type: 'USER_JOINED';
  data: {
    roomId: number;
    user: ChatUser;
  };
}

export interface UserLeftWebSocketEvent extends WebSocketEvent {
  type: 'USER_LEFT';
  data: {
    roomId: number;
    userId: number;
  };
}

export interface RoomUpdatedWebSocketEvent extends WebSocketEvent {
  type: 'ROOM_UPDATED';
  data: ChatRoom;
}

export interface UserStatusWebSocketEvent extends WebSocketEvent {
  type: 'USER_STATUS';
  data: {
    userId: number;
    status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
    currentGame?: string;
  };
}

// UI State Types
export interface ChatState {
  currentRoom?: ChatRoom;
  rooms: ChatRoom[];
  messages: { [roomId: number]: ChatMessage[] };
  typingUsers: { [roomId: number]: ChatUser[] };
  onlineUsers: ChatUser[];
  isLoading: boolean;
  error?: string;
}

export interface MessageFilter {
  beforeMessageId?: number;
  afterMessageId?: number;
  messageType?: string;
  senderId?: number;
}

export interface RoomFilter {
  type?: 'GROUP' | 'DIRECT_MESSAGE';
  gameTitle?: string;
  isPrivate?: boolean;
  search?: string;
}
