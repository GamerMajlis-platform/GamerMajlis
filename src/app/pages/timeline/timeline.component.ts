import {
  Component,
  signal,
  computed,
  HostListener,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  afterNextRender,
} from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { PostsService } from '../../core/services/posts.service';
import { MediaService } from '../../core/services/media.service';
import { PostItem, MediaItem } from '../../core/interfaces/media-post.models';

type TimelineTabKey = 'posts' | 'media';
interface TabDef {
  key: TimelineTabKey;
  label: string;
  icon: string;
}

interface FeedItem {
  type: 'post' | 'media';
  data: PostItem | MediaItem;
  timestamp: Date;
}

@Component({
  selector: 'gm-timeline',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  animations: [
    trigger('tabFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate(
          '300ms cubic-bezier(.4,0,.2,1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease',
          style({ opacity: 0, transform: 'translateY(-8px)' })
        ),
      ]),
    ]),
  ],
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  private _PLATFORM_ID = inject(PLATFORM_ID);
  private postsService = inject(PostsService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  tabs: TabDef[] = [
    { key: 'posts', label: 'Posts', icon: 'fa-pen-nib' },
    { key: 'media', label: 'Media', icon: 'fa-photo-film' },
  ];

  // Filter state (for filtering the unified feed) - only one filter active at a time
  private activeFilters = signal<Set<TimelineTabKey>>(
    new Set(['posts']) // Default to posts only
  );
  getPostCreatorProfileImageUrl(item: PostItem) {
    console.log('localhost:8080/api' + item.author?.profilePictureUrl);
    return 'localhost:8080/api' + item.author?.profilePictureUrl;
  }

  // Data signals
  private posts = signal<PostItem[]>([]);
  private media = signal<MediaItem[]>([]);
  private postsPage = signal(0);
  private mediaPage = signal(0);
  private postsTotalPages = signal(1);
  private mediaTotalPages = signal(1);
  private postsLoading = signal(false);
  private mediaLoading = signal(false);
  private postsLoadedOnce = signal(false);
  private mediaLoadedOnce = signal(false);

  // Size for pagination
  private readonly postsSize = 8;
  private readonly mediaSize = 12;

  // Skeletons for loading states
  skeletons = Array.from({ length: 4 });

  // Computed feed that combines and sorts posts and media
  feedItems = computed(() => {
    const items: FeedItem[] = [];
    const filters = this.activeFilters();

    // Add posts if posts filter is active
    if (filters.has('posts')) {
      this.posts().forEach((post) => {
        items.push({
          type: 'post',
          data: post,
          timestamp: new Date(post.createdAt),
        });
      });
    }

    // Add media if media filter is active
    if (filters.has('media')) {
      this.media().forEach((mediaItem) => {
        items.push({
          type: 'media',
          data: mediaItem,
          timestamp: new Date(mediaItem.createdAt),
        });
      });
    }

    // Sort by timestamp (newest first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  // Loading state computed from both sources
  isLoading = computed(() => this.postsLoading() || this.mediaLoading());
  loadedOnce = computed(() => this.postsLoadedOnce() && this.mediaLoadedOnce());

  // FAB state
  showFab = signal(false);
  fabMode = signal<'top' | 'switch'>('top');
  fabIcon = signal('fa-arrow-up');
  private holdTimeout: any;

  private scrollListener = () => {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      const y = window.scrollY || document.documentElement.scrollTop;
      this.showFab.set(y > 450);
    }
  };

  constructor() {
    // Initial data fetch
    this.fetchPosts();
    this.fetchMedia();

    afterNextRender(() => {
      this.setupObserver();
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  // Filter methods - only allow one filter at a time
  toggleFilter(key: TimelineTabKey) {
    this.activeFilters.set(new Set([key])); // Only set the clicked filter
  }

  isFilterActive(key: TimelineTabKey): boolean {
    return this.activeFilters().has(key);
  }

  // Track functions for ngFor
  trackTab = (index: number, tab: TabDef) => tab.key;
  trackFeedItem = (index: number, item: FeedItem) =>
    `${item.type}-${item.data.id}`;

  // Data fetching methods
  private fetchPosts() {
    if (this.postsLoading()) return;
    this.postsLoading.set(true);

    this.postsService
      .listPosts({
        page: this.postsPage(),
        size: this.postsSize,
      })
      .subscribe({
        next: (res) => {
          this.posts.update((prev) => [...prev, ...(res.posts || [])]);
          this.postsTotalPages.set(res.totalPages || 1);
          this.postsLoading.set(false);
          this.postsLoadedOnce.set(true);
        },
        error: () => {
          this.postsLoading.set(false);
          this.postsLoadedOnce.set(true);
        },
      });
  }

  private fetchMedia() {
    if (this.mediaLoading()) return;
    this.mediaLoading.set(true);

    this.mediaService
      .listMedia({
        page: this.mediaPage(),
        size: this.mediaSize,
      })
      .subscribe({
        next: (res) => {
          this.media.update((prev) => [...prev, ...(res.media || [])]);
          this.mediaTotalPages.set(res.totalPages || 1);
          this.mediaLoading.set(false);
          this.mediaLoadedOnce.set(true);
        },
        error: () => {
          this.mediaLoading.set(false);
          this.mediaLoadedOnce.set(true);
        },
      });
  }

  private hasMorePosts(): boolean {
    return this.postsPage() < this.postsTotalPages() - 1;
  }

  private hasMoreMedia(): boolean {
    return this.mediaPage() < this.mediaTotalPages() - 1;
  }

  private loadMorePosts() {
    if (this.hasMorePosts() && !this.postsLoading()) {
      this.postsPage.update((p) => p + 1);
      this.fetchPosts();
    }
  }

  private loadMoreMedia() {
    if (this.hasMoreMedia() && !this.mediaLoading()) {
      this.mediaPage.update((p) => p + 1);
      this.fetchMedia();
    }
  }

  // Intersection observer for infinite scroll
  private setupObserver() {
    if (!isPlatformBrowser(this._PLATFORM_ID)) return;

    const sentinel = this.elementRef.nativeElement.querySelector('#sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Load more data based on active filters
          const filters = this.activeFilters();
          if (filters.has('posts')) {
            this.loadMorePosts();
          }
          if (filters.has('media')) {
            this.loadMoreMedia();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
  }

  // Navigation methods
  openPost(post: any) {
    this.router.navigate(['/posts', post.id]);
  }

  openMedia(media: any) {
    this.router.navigate(['/media', media.id]);
  }

  // Post interaction methods
  augmentPost(post: any) {
    return post as PostItem & { __liked?: boolean; __likeBusy?: boolean };
  }

  // Type helpers for template
  getPostData(item: FeedItem): PostItem {
    return item.data as PostItem;
  }

  getMediaData(item: FeedItem): MediaItem {
    return item.data as MediaItem;
  }

  toggleLike(post: PostItem & { __liked?: boolean; __likeBusy?: boolean }) {
    if (post.__likeBusy) return;

    post.__likeBusy = true;
    const wasLiked = post.__liked;

    this.postsService.toggleLike(post.id).subscribe({
      next: (res) => {
        post.__liked = res.liked;
        post.likeCount = res.newLikeCount || post.likeCount;
        post.__likeBusy = false;
      },
      error: () => {
        post.__likeBusy = false;
      },
    });
  }

  // Utility methods
  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  @HostListener('keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const filters = Array.from(this.activeFilters());
      if (filters.length === 1) {
        // Switch to the other filter
        const currentFilter = filters[0];
        const otherFilter = currentFilter === 'posts' ? 'media' : 'posts';
        this.activeFilters.set(new Set([otherFilter]));
      }
    }
  }

  // FAB helpers
  handleFabClick() {
    if (this.fabMode() === 'switch') {
      this.cycleFilters();
    } else {
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    if (isPlatformBrowser(this._PLATFORM_ID)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cycleFilters() {
    const current = this.activeFilters();
    if (current.has('posts')) {
      this.activeFilters.set(new Set(['media']));
    } else {
      this.activeFilters.set(new Set(['posts']));
    }
    this.updateFabIcon();
  }

  private updateFabIcon() {
    this.fabIcon.set(
      this.fabMode() === 'switch' ? 'fa-shuffle' : 'fa-arrow-up'
    );
  }

  startHold() {
    clearTimeout(this.holdTimeout);
    this.holdTimeout = setTimeout(() => {
      this.fabMode.update((m) => (m === 'top' ? 'switch' : 'top'));
      this.updateFabIcon();
    }, 600);
  }

  endHold() {
    clearTimeout(this.holdTimeout);
  }

  // Contextual create (post / media upload)
  openCreate() {
    const filters = this.activeFilters();
    if (filters.has('posts')) {
      this.router.navigate(['/posts/create']);
    } else if (filters.has('media')) {
      this.router.navigate(['/media/upload']);
    } else {
      // Default to posts
      this.router.navigate(['/posts/create']);
    }
  }

  createLabel() {
    const filters = this.activeFilters();
    if (filters.has('posts')) {
      return 'Create post';
    } else if (filters.has('media')) {
      return 'Upload media';
    }
    return 'Create content';
  }
}
