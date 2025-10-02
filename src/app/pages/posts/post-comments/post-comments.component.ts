import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentItem } from '../../../core/interfaces/media-post.models';

@Component({
  selector: 'gm-post-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.css'],
})
export class PostCommentsComponent {
  @Input() comments: CommentItem[] = [];
  @Input() adding = signal(false);
  @Input() currentUserId: number | null = null;
  @Input() isAdmin = false;
  @Output() add = new EventEmitter<string>();
  @Output() delete = new EventEmitter<CommentItem>();

  draft = '';

  onSubmit(ev: Event) {
    ev.preventDefault();
    if (!this.draft.trim()) return;
    this.add.emit(this.draft.trim());
    this.draft = '';
  }

  canDelete(c: CommentItem): boolean {
    if (!this.currentUserId) return false;
    if (this.isAdmin) return true;
    return c.author.id === this.currentUserId;
  }
}
