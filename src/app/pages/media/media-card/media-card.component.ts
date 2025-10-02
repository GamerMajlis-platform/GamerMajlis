import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MediaItem } from '../../../core/interfaces/media-post.models';

@Component({
  selector: 'gm-media-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './media-card.component.html',
  styleUrls: ['./media-card.component.css'],
})
export class MediaCardComponent {
  @Input({ required: true }) media!: MediaItem;
}
