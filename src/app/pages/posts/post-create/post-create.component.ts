import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';

@Component({
  selector: 'gm-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css'],
})
export class PostCreateComponent {
  private postsService = inject(PostsService);
  private router = inject(Router);

  title = '';
  content = '';
  gameTitle = '';
  gameCategory = '';
  platform = '';
  visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';
  tags = '';
  hashtags = '';

  submitting = signal(false);

  reset() {
    this.title =
      this.content =
      this.gameTitle =
      this.gameCategory =
      this.platform =
      this.tags =
      this.hashtags =
        '';
    this.visibility = 'PUBLIC';
    this.submitting.set(false);
  }

  submit() {
    if (!this.content.trim()) return;
    this.submitting.set(true);
    const form = new FormData();
    if (this.title.trim()) form.append('title', this.title.trim());
    form.append('content', this.content.trim());
    if (this.gameTitle.trim()) form.append('gameTitle', this.gameTitle.trim());
    if (this.gameCategory.trim())
      form.append('gameCategory', this.gameCategory.trim());
    if (this.platform.trim()) form.append('platform', this.platform.trim());
    if (this.tags.trim())
      form.append(
        'tags',
        JSON.stringify(
          this.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
    if (this.hashtags.trim())
      form.append(
        'hashtags',
        JSON.stringify(
          this.hashtags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
    form.append('visibility', this.visibility);

    this.postsService.createPost(form).subscribe({
      next: (res) => {
        setTimeout(() => this.router.navigate(['/posts', res.post?.id]), 300);
      },
      error: () => this.submitting.set(false),
    });
  }
}
