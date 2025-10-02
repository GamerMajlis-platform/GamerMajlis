import {
  Component,
  inject,
  signal,
  computed,
  effect,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsService } from '../../../../core/services/posts.service';
import { PostItem } from '../../../../core/interfaces/media-post.models';
import { Router } from '@angular/router';

// Lightweight timeline posts pane (no filters/search) with IntersectionObserver infinite scroll
@Component({
  selector: 'gm-timeline-posts-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-posts-pane.component.html',
  styleUrls: ['./timeline-posts-pane.component.css'],
})
export class TimelinePostsPaneComponent {
  private postsService = inject(PostsService);
  private router = inject(Router);

  // Helper to coerce template item to augmented shape
  augment(p: any) {
    return p as PostItem & { __liked?: boolean; __likeBusy?: boolean };
  }

  posts = signal<PostItem[]>([]);
  page = signal(0);
  size = 8; // smaller chunk for timeline
  totalPages = signal(1);
  isLoading = signal(false);
  loadedOnce = signal(false);
  skeletons = Array.from({ length: 4 });

  constructor() {
    this.fetch();
    afterNextRender(() => this.setupObserver());
  }

  private patchAugment(
    post: PostItem & { __liked?: boolean; __likeBusy?: boolean }
  ) {
    if (post.__liked === undefined) {
      // Backend may not provide 'liked' flag; attempt heuristic: if likeCount>0 we still don't know user state.
      post.__liked = false; // default; could be replaced if API extends
    }
    if (post.__likeBusy === undefined) post.__likeBusy = false;
    return post;
  }

  private fetch() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.postsService
      .listPosts({ page: this.page(), size: this.size })
      .subscribe({
        next: (res) => {
          console.log(res);
          const augmented = (res.posts || []).map((p: any) =>
            this.patchAugment(p)
          );
          this.posts.update((prev) => [...prev, ...augmented]);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
          this.loadedOnce.set(true);
        },
        error: () => {
          this.isLoading.set(false);
          this.loadedOnce.set(true);
        },
      });
  }

  private hasMore() {
    return this.page() < this.totalPages() - 1;
  }

  private setupObserver() {
    const sentinel =
      (document.querySelector(
        'gm-timeline-posts-pane #sentinel'
      ) as HTMLElement) || null;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && this.hasMore() && !this.isLoading()) {
            this.page.update((p) => p + 1);
            this.fetch();
          }
        }
      },
      { rootMargin: '200px 0px 400px 0px', threshold: 0 }
    );
    io.observe(sentinel);
  }

  trackPost = (i: number, p: PostItem) => p?.id ?? i;

  timeAgo(iso: string) {
    const date = new Date(iso);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 172800) return '1d';
    return Math.floor(diff / 86400) + 'd';
  }

  toggleLike(p: any) {
    if (p.__likeBusy) return;
    p.__likeBusy = true;
    const optimisticLiked = !p.__liked;
    const delta = optimisticLiked ? 1 : -1;
    p.__liked = optimisticLiked;
    p.likeCount = Math.max(0, (p.likeCount || 0) + delta);
    this.postsService.toggleLike(p.id).subscribe({
      next: (res) => {
        // If backend returns authoritative counts
        if (res?.newLikeCount != null) p.likeCount = res.newLikeCount;
        if (res?.liked != null) p.__liked = res.liked;
        p.__likeBusy = false;
      },
      error: () => {
        // revert on error
        p.__liked = !optimisticLiked;
        p.likeCount = Math.max(0, (p.likeCount || 0) - delta);
        p.__likeBusy = false;
      },
    });
  }

  openPost(p: PostItem) {
    this.router.navigate(['/posts', p.id]);
  }
}
