import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../../core/services/posts.service';
import { PostItem } from '../../../core/interfaces/media-post.models';
import { PostCardComponent } from '../post-card/post-card.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'gm-posts-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent, RouterLink],
  templateUrl: './posts-feed.component.html',
  styleUrls: ['./posts-feed.component.css'],
})
export class PostsFeedComponent {
  private postsService = inject(PostsService);

  posts = signal<PostItem[]>([]);
  page = signal(0);
  size = 10;
  totalPages = signal(0);
  isLoading = signal(false);

  searchTerm = '';
  typeFilter = '';
  gameCategoryFilter = '';
  myPosts = false;

  skeletons = Array.from({ length: 3 });

  constructor() {
    this.refresh();
  }

  hasMore = () => this.page() < this.totalPages() - 1;

  buildQuery() {
    return {
      page: this.page(),
      size: this.size,
      type: this.typeFilter || undefined,
      gameCategory: this.gameCategoryFilter || undefined,
      myPosts: this.myPosts || undefined,
    };
  }

  refresh() {
    this.page.set(0);
    this.posts.set([]);
    this.fetch();
  }

  onSearch() {
    if (!this.searchTerm.trim()) return this.refresh();
    this.page.set(0);
    this.posts.set([]);
    this.isLoading.set(true);
    this.postsService
      .searchPosts({ query: this.searchTerm.trim(), page: 0, size: this.size })
      .subscribe({
        next: (res) => {
          this.posts.set(res.posts || []);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  fetch() {
    this.isLoading.set(true);
    this.postsService.listPosts(this.buildQuery()).subscribe({
      next: (res) => {
        this.posts.update((prev) => [...prev, ...(res.posts || [])]);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMore() {
    if (!this.hasMore() || this.isLoading()) return;
    this.page.update((p) => p + 1);
    this.fetch();
  }

  onWindowScroll() {
    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;
    if (height - position < threshold) {
      this.loadMore();
    }
  }

  trackPost(index: number, item: PostItem) {
    return item?.id ?? index;
  }
}
