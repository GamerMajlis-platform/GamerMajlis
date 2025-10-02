import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  Subject,
  map,
  tap,
  catchError,
  of,
} from 'rxjs';
import {
  ChatRoom,
  ChatMessage,
  ChatMember,
  ChatUser,
  ChatRoomResponse,
  ChatRoomsListResponse,
  ChatMessageResponse,
  ChatMessagesListResponse,
  ChatMemberResponse,
  ChatMembersListResponse,
  OnlineUsersResponse,
  TypingResponse,
  CreateChatRoomRequest,
  SendMessageRequest,
  AddMemberRequest,
  TypingRequest,
  DirectMessageRequest,
  MessageFilter,
  RoomFilter,
  WebSocketEvent,
  TypingIndicator,
  ChatState,
} from '../interfaces/chat.models';
import { UserService, OnlineUser } from './user.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:8080/api';
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private explicitlyDisconnected = false;
  private wsDebug = true; // toggle for verbose logging
  private wsRecentFrames: any[] = [];
  private wsRecentLimit = 25;
  private wsLastClose?: { code: number; reason: string; at: string };
  private lastMessagePost?: {
    roomId: number;
    status: number | 'ERROR';
    response?: any;
    error?: any;
    at: string;
  };

  // Expose snapshot for debugging (can be read via window.chatDebug?.())
  getDebugSnapshot() {
    return {
      connectionStatus: this.connectionStatus(),
      reconnectAttempts: this.reconnectAttempts,
      lastClose: this.wsLastClose,
      recentFrames: this.wsRecentFrames,
      lastMessagePost: this.lastMessagePost,
    };
  }

  // Connection status signal for UI
  private connectionStatusSignal = signal<
    'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED'
  >('DISCONNECTED');
  connectionStatus = computed(() => this.connectionStatusSignal());

  // State management with signals
  private chatState = signal<ChatState>({
    rooms: [],
    messages: {},
    typingUsers: {},
    onlineUsers: [],
    isLoading: false,
  });

  // Public state getters
  rooms = computed(() => this.chatState().rooms);
  currentRoom = computed(() => this.chatState().currentRoom);
  messages = computed(() => this.chatState().messages);
  typingUsers = computed(() => this.chatState().typingUsers);
  onlineUsers = computed(() => this.chatState().onlineUsers);
  isLoading = computed(() => this.chatState().isLoading);
  error = computed(() => this.chatState().error);

  // WebSocket event subjects
  private messageSubject = new Subject<ChatMessage>();
  private typingSubject = new Subject<TypingIndicator>();
  private userJoinedSubject = new Subject<{ roomId: number; user: ChatUser }>();
  private userLeftSubject = new Subject<{ roomId: number; userId: number }>();
  private roomUpdatedSubject = new Subject<ChatRoom>();
  private userStatusSubject = new Subject<{
    userId: number;
    status: string;
    currentGame?: string;
  }>();

  // Public observables for components
  message$ = this.messageSubject.asObservable();
  typing$ = this.typingSubject.asObservable();
  userJoined$ = this.userJoinedSubject.asObservable();
  userLeft$ = this.userLeftSubject.asObservable();
  roomUpdated$ = this.roomUpdatedSubject.asObservable();
  userStatus$ = this.userStatusSubject.asObservable();

  constructor() {
    // Only initialize WebSocket if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.initializeWebSocket();
    }
  }

  // WebSocket Management
  private initializeWebSocket(): void {
    this.connectionStatusSignal.set(
      this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING'
    );

    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip WebSocket initialization on server side
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn(
        'No authentication token found, WebSocket connection skipped'
      );
      return;
    }

    const currentUser = this.userService.getCurrentUserId();
    if (!currentUser) {
      console.warn('No current user found, WebSocket connection skipped');
      return;
    }

    try {
      // Include authentication in WebSocket URL
      this.socket = new WebSocket(
        `ws://localhost:8080/ws/chat?token=${encodeURIComponent(token)}`
      );

      this.socket.onopen = () => {
        this.connectionStatusSignal.set('CONNECTED');
        this.reconnectAttempts = 0; // reset attempts after successful connect
        console.log('Connected to chat server');
        // Send user identification
        this.socket!.send(
          JSON.stringify({
            type: 'auth',
            token,
            userId: currentUser,
          })
        );
      };

      this.socket.onclose = (ev) => {
        this.wsLastClose = {
          code: ev.code,
          reason: ev.reason,
          at: new Date().toISOString(),
        };
        if (this.wsDebug) {
          console.log('WS close', ev.code, ev.reason);
        } else {
          console.log('Disconnected from chat server');
        }
        this.connectionStatusSignal.set('DISCONNECTED');

        if (!this.explicitlyDisconnected) {
          this.scheduleReconnect();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const raw = event.data;
          const data = JSON.parse(raw);
          if (this.wsDebug) console.debug('WS IN <=', data);
          this.wsRecentFrames.push({ at: new Date().toISOString(), data });
          if (this.wsRecentFrames.length > this.wsRecentLimit) {
            this.wsRecentFrames.shift();
          }
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.chatState.update((state) => ({
          ...state,
          error: 'Connection error occurred',
        }));
        this.connectionStatusSignal.set('FAILED');
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.connectionStatusSignal.set('FAILED');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached');
      this.connectionStatusSignal.set('FAILED');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      30000,
      1000 * Math.pow(2, this.reconnectAttempts - 1)
    );
    console.log(
      `Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`
    );
    setTimeout(() => {
      if (!this.explicitlyDisconnected) {
        this.initializeWebSocket();
      }
    }, delay);
  }

  private handleWebSocketMessage(data: any): void {
    if (!data) return;

    console.log('📩 [WebSocket] Received message:', data);

    // If server sends a direct chat message object (id + content + sender) w/out wrapper
    if (!data.type && data.id && data.content && data.sender) {
      if (this.wsDebug) console.debug('WS raw message fallback path');
      this.handleNewMessage(data as ChatMessage);
      this.messageSubject.next(data as ChatMessage);
      return;
    }
    if (!data.type) return;
    const type = (data.type as string).toUpperCase();
    const payload =
      data.payload ?? data.data ?? data.chatMessage ?? data.message; // broaden key search

    switch (type) {
      case 'MESSAGE':
      case 'message': // backward compatibility
        if (payload) {
          console.log(
            '✅ [WebSocket] Processing MESSAGE event, payload:',
            payload
          );
          this.handleNewMessage(payload);
          this.messageSubject.next(payload);
        } else {
          console.warn('⚠️ [WebSocket] MESSAGE event has no payload:', data);
        }
        break;
      case 'TYPING':
      case 'typing':
        if (payload) {
          this.handleTypingIndicator(payload);
          this.typingSubject.next(payload);
        }
        break;
      case 'USER_JOINED':
      case 'userJoined':
        if (payload) this.userJoinedSubject.next(payload);
        break;
      case 'USER_LEFT':
      case 'userLeft':
        if (payload) this.userLeftSubject.next(payload);
        break;
      case 'ROOM_UPDATED':
      case 'roomUpdated':
        if (payload) {
          this.handleRoomUpdate(payload);
          this.roomUpdatedSubject.next(payload);
        }
        break;
      case 'USER_STATUS':
      case 'userStatus':
        if (payload) {
          this.handleUserStatusUpdate(payload);
          this.userStatusSubject.next(payload);
        }
        break;
      default:
        console.debug('Unhandled WebSocket event type', data.type, data);
    }
  }

  private handleNewMessage(message: ChatMessage): void {
    if (!message) return;
    // Some WS payloads might not include nested chatRoom object, fall back to currentRoom
    const roomId = message.chatRoom?.id || this.chatState().currentRoom?.id;
    if (!roomId) {
      console.warn('⚠️ Dropping message without room context', message);
      return;
    }

    console.log('📨 New message received via WebSocket:', {
      messageId: message.id,
      roomId,
      senderId: message.sender?.id,
      content: message.content,
      timestamp: message.createdAt,
    });

    const currentState = this.chatState();
    const roomMessages = currentState.messages[roomId] || [];

    // Check if message already exists (avoid duplicates)
    const existingMessage = roomMessages.find((m) => m.id === message.id);
    if (existingMessage && message.id > 0) {
      console.log('⚠️ Message already exists, skipping duplicate:', message.id);
      return;
    }

    this.chatState.update((state) => ({
      ...state,
      messages: {
        ...state.messages,
        [roomId]: [...roomMessages, message],
      },
    }));

    console.log(
      '✅ Message added to chatState, total messages in room:',
      roomMessages.length + 1
    );
  }

  private handleTypingIndicator(data: TypingIndicator): void {
    const currentState = this.chatState();
    const roomTypingUsers = currentState.typingUsers[data.roomId] || [];

    let updatedTypingUsers: ChatUser[];

    if (data.isTyping) {
      // Add user to typing list if not already there
      if (!roomTypingUsers.find((user) => user.id === data.user.id)) {
        updatedTypingUsers = [...roomTypingUsers, data.user];
      } else {
        updatedTypingUsers = roomTypingUsers;
      }
    } else {
      // Remove user from typing list
      updatedTypingUsers = roomTypingUsers.filter(
        (user) => user.id !== data.user.id
      );
    }

    this.chatState.update((state) => ({
      ...state,
      typingUsers: {
        ...state.typingUsers,
        [data.roomId]: updatedTypingUsers,
      },
    }));
  }

  private handleRoomUpdate(room: ChatRoom): void {
    this.chatState.update((state) => ({
      ...state,
      rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
    }));
  }

  private handleUserStatusUpdate(data: {
    userId: number;
    status: string;
    currentGame?: string;
  }): void {
    this.chatState.update((state) => ({
      ...state,
      onlineUsers: state.onlineUsers.map((user) =>
        user.id === data.userId
          ? {
              ...user,
              status: data.status as any,
              currentGame: data.currentGame,
            }
          : user
      ),
    }));
  }

  // Enhanced Chat Room Creation
  createChatRoom(request: CreateChatRoomRequest): Observable<ChatRoomResponse> {
    const formData = new FormData();
    formData.append('name', request.name);
    if (request.description)
      formData.append('description', request.description);
    if (request.type) formData.append('type', request.type);
    if (request.isPrivate !== undefined)
      formData.append('isPrivate', request.isPrivate.toString());
    if (request.maxMembers)
      formData.append('maxMembers', request.maxMembers.toString());
    if (request.gameTitle) formData.append('gameTitle', request.gameTitle);
    if (request.tournamentId)
      formData.append('tournamentId', request.tournamentId.toString());
    if (request.eventId) formData.append('eventId', request.eventId.toString());
    if (request.allowFileSharing !== undefined)
      formData.append('allowFileSharing', request.allowFileSharing.toString());
    if (request.allowEmojis !== undefined)
      formData.append('allowEmojis', request.allowEmojis.toString());
    if (request.messageHistoryDays)
      formData.append(
        'messageHistoryDays',
        request.messageHistoryDays.toString()
      );

    // Notify via WebSocket about room creation attempt
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'room_create',
        roomData: request,
        timestamp: new Date().toISOString(),
      };
      this.socket.send(JSON.stringify(wsMessage));
    }

    return this.http
      .post<ChatRoomResponse>(`${this.baseUrl}/chat/rooms`, formData)
      .pipe(
        tap((response) => {
          if (response.success && response.chatRoom) {
            // Add new room to local state
            this.chatState.update((state) => ({
              ...state,
              rooms: [...state.rooms, response.chatRoom],
            }));

            // Auto-join the created room
            this.joinChatRoom(response.chatRoom.id).subscribe({
              next: () => console.log('Auto-joined created room'),
              error: (error) =>
                console.warn('Failed to auto-join created room:', error),
            });
          }
        }),
        catchError((error) => {
          console.error('Failed to create chat room:', error);
          this.chatState.update((state) => ({
            ...state,
            error: 'Failed to create chat room',
          }));
          throw error;
        })
      );
  }

  getUserChatRooms(
    page: number = 0,
    size: number = 20,
    filter?: RoomFilter
  ): Observable<ChatRoomsListResponse> {
    // Set loading state
    this.chatState.update((state) => ({
      ...state,
      isLoading: true,
      error: undefined,
    }));

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.gameTitle) params = params.set('gameTitle', filter.gameTitle);
    if (filter?.isPrivate !== undefined)
      params = params.set('isPrivate', filter.isPrivate.toString());
    if (filter?.search) params = params.set('search', filter.search);

    return this.http
      .get<ChatRoomsListResponse>(`${this.baseUrl}/chat/rooms`, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.chatState.update((state) => ({
              ...state,
              rooms:
                page === 0
                  ? response.chatRooms
                  : [...state.rooms, ...response.chatRooms],
              isLoading: false,
            }));
          } else {
            this.chatState.update((state) => ({
              ...state,
              isLoading: false,
              error: response.message || 'Failed to load chat rooms',
            }));
          }
        }),
        catchError((error) => {
          console.warn('Chat rooms API failed:', error);

          // Check if it's an authentication error
          if (error.status === 401) {
            this.chatState.update((state) => ({
              ...state,
              isLoading: false,
              error:
                'Authentication required. Please log in to access chat rooms.',
            }));
            return of({
              success: false,
              message: 'Authentication required',
              chatRooms: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: page,
              pageSize: size,
            } as ChatRoomsListResponse);
          }

          // Return mock data for other errors (network issues, server down, etc.)
          const mockRooms: ChatRoom[] = [
            {
              id: 1,
              name: 'General Gaming',
              description: 'General discussion about all games',
              type: 'GROUP',
              isPrivate: false,
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              currentMembers: 25,
              maxMembers: 100,
              isActive: true,
              totalMessages: 142,
              creator: { id: 1, displayName: 'Admin', status: 'ONLINE' },
              allowFileSharing: true,
              allowEmojis: true,
              messageHistoryDays: 30,
            },
            {
              id: 2,
              name: 'Call of Duty Squad',
              description: 'Looking for squad members for COD',
              type: 'GROUP',
              isPrivate: false,
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              currentMembers: 8,
              maxMembers: 50,
              isActive: true,
              totalMessages: 89,
              creator: { id: 2, displayName: 'GamerPro', status: 'ONLINE' },
              allowFileSharing: true,
              allowEmojis: true,
              messageHistoryDays: 30,
            },
            {
              id: 3,
              name: 'FIFA Tournaments',
              description: 'Organize and discuss FIFA tournaments',
              type: 'GROUP',
              isPrivate: false,
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              currentMembers: 15,
              maxMembers: 30,
              isActive: true,
              totalMessages: 67,
              creator: { id: 3, displayName: 'FifaKing', status: 'ONLINE' },
              allowFileSharing: true,
              allowEmojis: true,
              messageHistoryDays: 30,
            },
          ];

          const mockResponse: ChatRoomsListResponse = {
            success: true,
            message: 'Demo rooms loaded (API unavailable)',
            chatRooms: mockRooms,
            totalElements: mockRooms.length,
            totalPages: 1,
            currentPage: page,
            pageSize: size,
          };

          // Update state with mock data
          this.chatState.update((state) => ({
            ...state,
            rooms: mockRooms,
            isLoading: false,
            error: 'Using demo data - API unavailable',
          }));

          return of(mockResponse);
        })
      );
  }

  getChatRoomDetails(roomId: number): Observable<ChatRoomResponse> {
    return this.http
      .get<ChatRoomResponse>(`${this.baseUrl}/chat/rooms/${roomId}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.chatState.update((state) => ({
              ...state,
              currentRoom: response.chatRoom,
            }));
          }
        })
      );
  }

  // Enhanced Join Chat Room
  joinChatRoom(roomId: number): Observable<ChatMemberResponse> {
    // Notify via WebSocket about joining attempt
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'join_room',
        roomId: roomId,
        timestamp: new Date().toISOString(),
      };
      this.socket.send(JSON.stringify(wsMessage));
    }

    return this.http
      .post<ChatMemberResponse>(`${this.baseUrl}/chat/rooms/${roomId}/join`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            // Set current room immediately
            this.chatState.update((state) => ({
              ...state,
              currentRoom:
                state.rooms.find((r) => r.id === roomId) || state.currentRoom,
            }));

            // Fetch full details to ensure members + metadata
            this.getChatRoomDetails(roomId).subscribe({
              next: () => {},
              error: (err) => console.warn('Failed to fetch room details', err),
            });

            // Refresh user's chat rooms list (non-blocking)
            this.getUserChatRooms().subscribe({
              next: () => console.log('Room list updated after joining'),
              error: (err: any) =>
                console.warn('Failed to refresh room list:', err),
            });

            // Load initial messages for that room
            this.getChatMessages(roomId, 0, 50).subscribe({
              next: () => console.log('Messages loaded for joined room'),
              error: (err: any) =>
                console.warn('Failed to load messages:', err),
            });
          }
        }),
        catchError((error) => {
          console.error('Failed to join chat room:', error);
          this.chatState.update((state) => ({
            ...state,
            error: 'Failed to join chat room',
          }));

          // Fallback membership object (minimal) to satisfy interface
          const fallbackMembership: ChatMember = {
            id: Date.now(),
            user: {
              id: this.authService.getCurrentUserId() || 0,
              displayName: 'Offline User',
              profilePictureUrl: '/images/user4.jpg',
              status: 'ONLINE',
              lastSeen: new Date().toISOString(),
            },
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            isOnline: true,
          };

          const fallbackResponse: ChatMemberResponse = {
            success: false,
            message: 'Failed to join room (offline fallback)',
            membership: fallbackMembership,
          };
          return of(fallbackResponse);
        })
      );
  }

  leaveChatRoom(
    roomId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.baseUrl}/chat/rooms/${roomId}/leave`,
        {}
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.chatState.update((state) => ({
              ...state,
              rooms: state.rooms.filter((room) => room.id !== roomId),
              currentRoom:
                state.currentRoom?.id === roomId
                  ? undefined
                  : state.currentRoom,
            }));
          }
        })
      );
  }

  // Enhanced message sending with file support and real-time delivery
  sendMessage(
    roomId: number,
    request: SendMessageRequest
  ): Observable<ChatMessageResponse> {
    console.log('🔵 [sendMessage] Starting message send:', {
      roomId,
      content: request.content,
      messageType: request.messageType,
      hasFile: !!request.file,
      replyToMessageId: request.replyToMessageId,
    });

    const formData = new FormData();
    formData.append('content', request.content);
    if (request.messageType)
      formData.append('messageType', request.messageType);
    if (request.replyToMessageId)
      formData.append('replyToMessageId', request.replyToMessageId.toString());
    if (request.file) formData.append('file', request.file);

    console.log('🔵 [sendMessage] FormData created, entries:', {
      content: formData.get('content'),
      messageType: formData.get('messageType'),
      replyToMessageId: formData.get('replyToMessageId'),
      hasFile: !!formData.get('file'),
    });

    // Send via WebSocket for real-time delivery if connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'MESSAGE', // Use uppercase to match backend event type
        payload: {
          roomId,
          content: request.content,
          messageType: request.messageType || 'TEXT',
          replyToMessageId: request.replyToMessageId,
          senderId: this.authService.getCurrentUserId(),
          timestamp: new Date().toISOString(),
        },
      };
      console.log('🔵 [sendMessage] Sending via WebSocket:', wsMessage);
      this.socket.send(JSON.stringify(wsMessage));
    } else {
      console.log(
        '⚠️ [sendMessage] WebSocket not connected, readyState:',
        this.socket?.readyState
      );
    }

    // Optimistic UI insert (temporary message with negative ID until server returns real one)
    const optimisticMessage: ChatMessage = {
      id: -Date.now(),
      content: request.content,
      messageType: (request.messageType || 'TEXT') as any,
      sender: {
        id: this.authService.getCurrentUserId() || 0,
        displayName: 'You',
        status: 'ONLINE',
      },
      chatRoom: { id: roomId, name: this.chatState().currentRoom?.name || '' },
      replyToMessageId: request.replyToMessageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
    } as any;
    this.handleNewMessage(optimisticMessage);

    const apiUrl = `${this.baseUrl}/chat/rooms/${roomId}/messages`;
    console.log('🔵 [sendMessage] Making POST request to:', apiUrl);

    return this.http.post<ChatMessageResponse>(apiUrl, formData).pipe(
      tap((response) => {
        console.log('✅ [sendMessage] POST response received:', {
          success: response.success,
          messageId: response.chatMessage?.id,
          message: response.message,
        });

        this.lastMessagePost = {
          roomId,
          status: 200,
          response,
          at: new Date().toISOString(),
        };
        if (response.success && response.chatMessage) {
          // Replace optimistic message (match by temp negative id) or append if not found
          const real = response.chatMessage;
          const roomIdResolved = real.chatRoom?.id || roomId;
          const state = this.chatState();
          const existing = state.messages[roomIdResolved] || [];
          const replaced = existing.map((m) =>
            m.id < 0 && m.content === optimisticMessage.content ? real : m
          );
          const found = replaced.some((m) => m.id === real.id);
          this.chatState.update((s) => ({
            ...s,
            messages: {
              ...s.messages,
              [roomIdResolved]: found ? replaced : [...replaced, real],
            },
          }));
        }
      }),
      catchError((error) => {
        console.error('❌ [sendMessage] POST request failed:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url,
        });

        this.chatState.update((state) => ({
          ...state,
          error: 'Failed to send message',
        }));
        this.lastMessagePost = {
          roomId,
          status: 'ERROR',
          error,
          at: new Date().toISOString(),
        };
        // Rollback optimistic entry
        const state = this.chatState();
        const list = state.messages[roomId] || [];
        this.chatState.update((s) => ({
          ...s,
          messages: {
            ...s.messages,
            [roomId]: list.filter((m) => m.id !== optimisticMessage.id),
          },
        }));
        throw error;
      })
    );
  }

  getChatMessages(
    roomId: number,
    page: number = 0,
    size: number = 50,
    filter?: MessageFilter
  ): Observable<ChatMessagesListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filter?.beforeMessageId)
      params = params.set('beforeMessageId', filter.beforeMessageId.toString());
    if (filter?.afterMessageId)
      params = params.set('afterMessageId', filter.afterMessageId.toString());
    if (filter?.messageType)
      params = params.set('messageType', filter.messageType);
    if (filter?.senderId)
      params = params.set('senderId', filter.senderId.toString());

    return this.http
      .get<ChatMessagesListResponse>(
        `${this.baseUrl}/chat/rooms/${roomId}/messages`,
        { params }
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.chatState.update((state) => ({
              ...state,
              messages: {
                ...state.messages,
                [roomId]:
                  page === 0
                    ? response.messages
                    : [...(state.messages[roomId] || []), ...response.messages],
              },
            }));
          }
        })
      );
  }

  deleteMessage(
    messageId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/chat/messages/${messageId}`
    );
  }

  // Member Management APIs
  addChatRoomMember(
    roomId: number,
    memberId: number,
    request: AddMemberRequest = {}
  ): Observable<ChatMemberResponse> {
    const formData = new FormData();
    if (request.role) formData.append('role', request.role);

    return this.http.post<ChatMemberResponse>(
      `${this.baseUrl}/chat/rooms/${roomId}/members/${memberId}`,
      formData
    );
  }

  removeChatRoomMember(
    roomId: number,
    memberId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/chat/rooms/${roomId}/members/${memberId}`
    );
  }

  getChatRoomMembers(
    roomId: number,
    page: number = 0,
    size: number = 20
  ): Observable<ChatMembersListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ChatMembersListResponse>(
      `${this.baseUrl}/chat/rooms/${roomId}/members`,
      { params }
    );
  }

  // Direct Message APIs
  startDirectMessage(
    request: DirectMessageRequest
  ): Observable<ChatRoomResponse> {
    const formData = new FormData();
    formData.append('recipientId', request.recipientId.toString());

    return this.http
      .post<ChatRoomResponse>(`${this.baseUrl}/chat/direct`, formData)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.chatState.update((state) => ({
              ...state,
              rooms: [...state.rooms, response.chatRoom],
            }));
          }
        })
      );
  }

  // Online Users API - now using UserService
  getOnlineUsers(): Observable<OnlineUsersResponse> {
    // Spec endpoint: GET /api/chat/online-users
    this.chatState.update((state) => ({
      ...state,
      isLoading: true,
      error: undefined,
    }));

    return this.http
      .get<OnlineUsersResponse>(`${this.baseUrl}/chat/online-users`)
      .pipe(
        tap((response) => {
          if (response.success) {
            const chatUsers: ChatUser[] = response.onlineUsers.map(
              (user: any) => ({
                id: user.id,
                displayName: user.displayName,
                profilePictureUrl: user.profilePictureUrl,
                status: user.status,
                currentGame: user.currentGame,
                lastSeen: user.lastSeen,
              })
            );

            this.chatState.update((state) => ({
              ...state,
              onlineUsers: chatUsers,
              isLoading: false,
            }));
          } else {
            this.chatState.update((state) => ({
              ...state,
              isLoading: false,
              error: response.message || 'Failed to load online users',
            }));
          }
        }),
        catchError((error) => {
          console.error('Failed to get online users:', error);
          this.chatState.update((state) => ({
            ...state,
            isLoading: false,
            error: 'Failed to load online users',
          }));
          throw error;
        })
      );
  }

  // Typing Indicator API
  sendTypingIndicator(request: TypingRequest): Observable<TypingResponse> {
    const isTyping = request.isTyping !== false; // default true

    // Prefer WebSocket for real-time typing indicator
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'TYPING',
        roomId: request.roomId,
        isTyping,
        timestamp: new Date().toISOString(),
      };
      try {
        this.socket.send(JSON.stringify(wsMessage));
        // Optimistically update local typing state (user self)
        const currentUserId = this.authService.getCurrentUserId();
        if (currentUserId) {
          const currentUser: ChatUser = {
            id: currentUserId,
            displayName: 'You',
          } as any;
          this.handleTypingIndicator({
            roomId: request.roomId,
            user: currentUser,
            isTyping,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn(
          'Failed to send typing via WebSocket, falling back to HTTP',
          e
        );
      }
    }

    // Always also send HTTP to keep server authoritative (can be throttled by backend)
    const formData = new FormData();
    formData.append('roomId', request.roomId.toString());
    formData.append('isTyping', isTyping.toString());

    return this.http.post<TypingResponse>(
      `${this.baseUrl}/chat/typing`,
      formData
    );
  }

  // Utility Methods
  setCurrentRoom(room: ChatRoom | undefined): void {
    this.chatState.update((state) => ({
      ...state,
      currentRoom: room,
    }));
  }

  setLoading(isLoading: boolean): void {
    this.chatState.update((state) => ({
      ...state,
      isLoading,
    }));
  }

  setError(error: string | undefined): void {
    this.chatState.update((state) => ({
      ...state,
      error,
    }));
  }

  clearMessages(roomId: number): void {
    this.chatState.update((state) => ({
      ...state,
      messages: {
        ...state.messages,
        [roomId]: [],
      },
    }));
  }

  getMessagesForRoom(roomId: number): ChatMessage[] {
    return this.chatState().messages[roomId] || [];
  }

  getTypingUsersForRoom(roomId: number): ChatUser[] {
    return this.chatState().typingUsers[roomId] || [];
  }

  disconnect(): void {
    this.explicitlyDisconnected = true;
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.connectionStatusSignal.set('DISCONNECTED');
  }

  reconnect(): void {
    this.explicitlyDisconnected = false;
    this.disconnect();
    this.reconnectAttempts = 0;
    this.initializeWebSocket();
  }
}
