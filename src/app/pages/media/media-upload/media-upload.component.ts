import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MediaService } from '../../../core/services/media.service';

@Component({
  selector: 'gm-media-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media-upload.component.html',
  styleUrls: ['./media-upload.component.css'],
})
export class MediaUploadComponent {
  private mediaService = inject(MediaService);
  private router = inject(Router);

  title = '';
  description = '';
  gameCategory = '';
  visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';
  tags = '';
  file: File | null = null;

  dragActive = false;
  progress = signal(0);
  uploading = signal(false);
  error = signal('');

  validateFile(file: File): string | null {
    const isVideo = /\.(mp4|mov|avi)$/i.test(file.name);
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
    if (!isVideo && !isImage) return 'Unsupported file type';
    if (isVideo && file.size > 100 * 1024 * 1024)
      return 'Video exceeds 100MB limit';
    if (isImage && file.size > 10 * 1024 * 1024)
      return 'Image exceeds 10MB limit';
    return null;
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      const f = input.files[0];
      const err = this.validateFile(f);
      if (err) {
        this.error.set(err);
        return;
      }
      this.file = f;
      this.error.set('');
    }
  }
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragActive = true;
  }
  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.dragActive = false;
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragActive = false;
    if (e.dataTransfer?.files?.length) {
      const f = e.dataTransfer.files[0];
      const err = this.validateFile(f);
      if (err) {
        this.error.set(err);
        return;
      }
      this.file = f;
      this.error.set('');
    }
  }

  reset() {
    this.title = this.description = this.gameCategory = this.tags = '';
    this.visibility = 'PUBLIC';
    this.file = null;
    this.progress.set(0);
    this.error.set('');
    this.uploading.set(false);
  }

  submit() {
    if (!this.file || !this.title.trim()) return;
    this.uploading.set(true);
    this.progress.set(10);
    const form = new FormData();
    form.append('file', this.file);
    form.append('title', this.title.trim());
    if (this.description.trim())
      form.append('description', this.description.trim());
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
    if (this.gameCategory.trim())
      form.append('gameCategory', this.gameCategory.trim());
    form.append('visibility', this.visibility);

    this.mediaService.uploadMedia(form).subscribe({
      next: (res) => {
        this.progress.set(100);
        setTimeout(() => this.router.navigate(['/media', res.media?.id]), 400);
      },
      error: () => {
        this.error.set('Upload failed');
        this.uploading.set(false);
      },
    });
  }
}
