import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '../../../core/services/media.service';
import { MediaItem } from '../../../core/interfaces/media-post.models';
import { MediaCardComponent } from '../media-card/media-card.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'gm-media-list',
  standalone: true,
  imports: [CommonModule, MediaCardComponent, FormsModule, RouterLink],
  templateUrl: './media-list.component.html',
  styleUrls: ['./media-list.component.css'],
})
export class MediaListComponent {
  private mediaService = inject(MediaService);

  media = signal<MediaItem[]>([]);
  page = signal(0);
  size = 20;
  totalPages = signal(0);
  isLoading = signal(false);

  searchTerm = '';
  typeFilter = '';
  categoryFilter = '';
  visibilityFilter = '';
  myMedia = false;

  skeletons = Array.from({ length: 8 });

  constructor() {
    this.refresh();
  }

  hasMore = () => this.page() < this.totalPages() - 1;

  buildQuery() {
    return {
      page: this.page(),
      size: this.size,
      category: this.categoryFilter || undefined,
      type: (this.typeFilter as any) || undefined,
      visibility: (this.visibilityFilter as any) || undefined,
      myMedia: this.myMedia || undefined,
    };
  }

  refresh() {
    this.page.set(0);
    this.media.set([]);
    this.fetch();
  }

  onSearch() {
    if (!this.searchTerm.trim()) return this.refresh();
    this.page.set(0);
    this.media.set([]);
    this.isLoading.set(true);
    this.mediaService
      .searchMedia({ query: this.searchTerm.trim(), page: 0, size: this.size })
      .subscribe({
        next: (res) => {
          this.media.set(res.media || []);
          this.totalPages.set(res.totalPages || 1);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  fetch() {
    this.isLoading.set(true);
    this.mediaService.listMedia(this.buildQuery()).subscribe({
      next: (res) => {
        this.media.update((prev) => [...prev, ...(res.media || [])]);
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
    const threshold = 300; // px from bottom
    const position = window.innerHeight + window.scrollY;
    const height = document.body.offsetHeight;
    if (height - position < threshold) {
      this.loadMore();
    }
  }

  trackMedia(index: number, item: MediaItem) {
    return item?.id ?? index;
  }
}
