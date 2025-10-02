import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  PostItem,
  CommentItem,
} from '../../../core/interfaces/media-post.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'gm-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
})
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthService);

  post = signal<PostItem | null>(null);
  comments = signal<CommentItem[]>([]);
  loaded = signal(false);
  addingComment = signal(false);
  newComment = '';

  tags = signal<string[]>([]);
  hashtags = signal<string[]>([]);

  safeTitle = computed(
    (): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(this.post()?.title || '')
  );
  safeContent = computed(
    (): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(this.post()?.content || '')
  );

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const numericId = +id;
        this.fetch(numericId);
        this.fetchComments(numericId);
      }
    });
  }

  fetch(id: number) {
    this.loaded.set(false);
    this.postsService.getPost(id).subscribe({
      next: (res) => {
        this.post.set(res.post || null);
        this.extractTags();
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  fetchComments(id: number) {
    this.postsService.listComments(id).subscribe({
      next: (res) => this.comments.set(res.comments || []),
      error: () => {},
    });
  }

  extractTags() {
    const p = this.post();
    if (!p) return;
    try {
      if (p.tags)
        this.tags.set(
          Array.isArray(p.tags) ? (p.tags as any) : JSON.parse(p.tags as any)
        );
      if (p.hashtags)
        this.hashtags.set(
          Array.isArray(p.hashtags)
            ? (p.hashtags as any).map((h: string) => h.replace('#', ''))
            : JSON.parse(p.hashtags as any)
        );
    } catch {}
  }

  addComment(ev: Event) {
    ev.preventDefault();
    if (!this.newComment.trim() || !this.post()) return;
    this.addingComment.set(true);
    this.postsService
      .addComment(this.post()!.id, this.newComment.trim())
      .subscribe({
        next: (res) => {
          if (res.comment)
            this.comments.update((list) => [res.comment!, ...list]);
          this.newComment = '';
          this.addingComment.set(false);
        },
        error: () => this.addingComment.set(false),
      });
  }

  deleteComment(c: CommentItem) {
    if (!confirm('Delete comment?')) return;
    this.postsService.deleteComment(c.id).subscribe({
      next: () =>
        this.comments.update((list) => list.filter((x) => x.id !== c.id)),
      error: () => {},
    });
  }

  canDelete(c: CommentItem): boolean {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) return false;
    if (this.auth.isAdmin()) return true;
    return c.author?.id === currentUserId;
  }
}
