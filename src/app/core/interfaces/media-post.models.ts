// Shared interfaces for Media & Posts domains

export type Visibility = 'PUBLIC' | 'PRIVATE';
export type MediaType = 'VIDEO' | 'IMAGE';

export interface UploaderRef {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface MediaItem {
  id: number;
  title: string;
  description?: string;
  originalFilename?: string;
  storedFilename?: string;
  filePath: string;
  mediaType: MediaType;
  fileSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  thumbnailPath?: string;
  duration?: number; // seconds
  resolution?: string; // e.g. 1920x1080
  tags?: string; // JSON encoded array from backend
  gameCategory?: string;
  visibility: Visibility;
  viewCount: number;
  downloadCount?: number;
  createdAt: string;
  uploader?: UploaderRef;
}

export interface PostItem {
  id: number;
  title: string;
  content: string;
  type: string; // TEXT, MEDIA, etc.
  gameTitle?: string;
  gameCategory?: string;
  platform?: string;
  tags?: string; // JSON encoded
  hashtags?: string; // JSON encoded
  visibility: Visibility;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  attachedMedia?: Pick<MediaItem, 'id' | 'title' | 'thumbnailPath'>[];
  author?: UploaderRef; // made optional to avoid runtime errors when backend omits
  createdAt: string;
  updatedAt?: string;
}

export interface CommentItem {
  id: number;
  content: string;
  author: UploaderRef;
  createdAt: string;
}

export interface PagedResponse<T> {
  success: boolean;
  message: string;
  media?: T[]; // for media endpoints
  posts?: T[]; // for post endpoints
  comments?: T[]; // for comments endpoints
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  media?: T;
  post?: T;
  comment?: T;
  newViewCount?: number;
  liked?: boolean;
  newLikeCount?: number;
  newShareCount?: number;
}

export interface ListQuery {
  page: number;
  size: number;
  category?: string;
  type?: string;
  visibility?: Visibility;
  myMedia?: boolean;
  myPosts?: boolean;
  gameCategory?: string;
}

export interface SearchQuery {
  query: string;
  page: number;
  size: number;
  type?: string;
  gameCategory?: string;
}
