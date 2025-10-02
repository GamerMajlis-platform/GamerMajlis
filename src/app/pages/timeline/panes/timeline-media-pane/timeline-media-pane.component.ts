import { fileURLToPath } from 'node:url';
import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MediaService } from '../../../../core/services/media.service';
import { MediaItem } from '../../../../core/interfaces/media-post.models';

@Component({
  selector: 'gm-timeline-media-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-media-pane.component.html',
  styleUrl: './timeline-media-pane.component.css',
})
export class TimelineMediaPaneComponent {
  private mediaService = inject(MediaService);
  private router = inject(Router);

  media = signal<MediaItem[]>([]);
  profileImageUrl = signal<string | null>(null);
  page = signal(0);
  size = 12; // smaller chunks for timeline grid
  totalPages = signal(1);
  isLoading = signal(false);
  loadedOnce = signal(false);
  skeletons = Array.from({ length: 8 });

  constructor() {
    this.fetch();
    afterNextRender(() => this.setupObserver());
  }

  private fetch() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.mediaService
      .listMedia({ page: this.page(), size: this.size })
      .subscribe({
        next: (res) => {
          this.media.update((prev) => [...prev, ...(res.media || [])]);
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
        'gm-timeline-media-pane #sentinel'
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
      { rootMargin: '300px 0px 600px 0px', threshold: 0 }
    );
    io.observe(sentinel);

    // View increment observer (only once per item)
    const itemObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const idAttr = el.getAttribute('data-id');
            if (!idAttr) continue;
            const id = Number(idAttr);
            const arr = this.media();
            const item = arr.find((m) => m.id === id) as any;
            if (item && !item.__viewed) {
              item.__viewed = true; // optimistic flag
              item.viewCount = (item.viewCount || 0) + 1; // optimistic increment
              this.mediaService.incrementView(id).subscribe({
                error: () => {
                  // revert optimistic increment if server fails
                  item.viewCount = Math.max(0, (item.viewCount || 1) - 1);
                  item.__viewed = false;
                },
              });
            }
            itemObserver.unobserve(el);
          }
        }
      },
      { threshold: 0.5 }
    );

    // Defer scanning for cards slightly to ensure they exist
    setTimeout(() => {
      document
        .querySelectorAll('gm-timeline-media-pane [role="listitem"][data-id]')
        .forEach((el) => itemObserver.observe(el));
    }, 300);
  }

  trackMedia = (i: number, m: MediaItem) => m?.id ?? i;
  openMedia(m: MediaItem) {
    this.router.navigate(['/media', m.id]);
  }
}
