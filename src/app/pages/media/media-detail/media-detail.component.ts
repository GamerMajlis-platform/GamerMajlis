import { UploaderRef } from './../../../core/interfaces/media-post.models';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MediaService } from '../../../core/services/media.service';
import { MediaItem } from '../../../core/interfaces/media-post.models';
import { API_BASE_URL } from '../../../core/services/api.config';

@Component({
  selector: 'gm-media-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './media-detail.component.html',
  styleUrls: ['./media-detail.component.css'],
})
export class MediaDetailComponent {
  private route = inject(ActivatedRoute);
  private mediaService = inject(MediaService);

  media: MediaItem | null = null;
  mediaFilePath: string = '';
  UploaderProfileUrl: string = '';
  private loadedView = false;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.mediaService.getMedia(id).subscribe({
        next: (res) => {
          this.media = res.media || null;
          if (this.media?.filePath)
            this.mediaFilePath = this.media?.filePath.replace(
              '/tmp',
              API_BASE_URL
            );
          if (this.media?.uploader) {
            this.UploaderProfileUrl =
              API_BASE_URL + this.media.uploader.profilePictureUrl;
          }
        },
      });
    }
  }

  incrementView() {
    if (this.loadedView || !this.media) return;
    this.loadedView = true;
    this.mediaService.incrementView(this.media.id).subscribe({
      next: (res) => {
        if (res.newViewCount != null) {
          if (this.media) {
            this.media.viewCount = res.newViewCount as number;
          }
        }
      },
    });
  }

  parsedTags() {
    const raw = this.media?.tags;
    if (!raw) return [] as string[];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
}
