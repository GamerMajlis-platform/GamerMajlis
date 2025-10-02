import {
  Component,
  Input,
  signal,
  computed,
  inject,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  Product,
  WishlistResponse,
} from '../../../core/interfaces/product.models';
import { MarketplaceService } from '../../../core/services/marketplace.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ProductCardComponent implements OnInit, OnChanges {
  @Input() productData!: Product;
  @Input() showQuickActions = true;

  private marketplaceService = inject(MarketplaceService);
  private router = inject(Router);

  // Signals
  product = signal<Product>(this.productData);
  isInWishlist = signal(false);
  isWishlistLoading = signal(false);

  // Computed values
  productImage = computed(() => {
    const imageUrl = 'http://localhost:8080/api' + this.product().mainImageUrl;
    console.log(imageUrl);
    return imageUrl;
  });

  conditionBadgeClass = computed(() => {
    return this.marketplaceService.getConditionBadgeColor(
      this.product().condition
    );
  });

  wishlistButtonClass = computed(() => {
    const base = 'transition-all duration-200';
    return this.isInWishlist()
      ? `${base} bg-red-500 text-white hover:bg-red-600`
      : `${base} bg-white text-gray-600 hover:bg-gray-100`;
  });

  ratingStars = computed(() => {
    return this.marketplaceService.getRatingStars(
      this.product().averageRating || 0
    );
  });

  ngOnInit() {
    this.product.set(this.productData);
    // Note: isInWishlist would need to be determined from user's wishlist data
    this.isInWishlist.set(false); // Default to false for now
  }

  ngOnChanges() {
    if (this.productData) {
      this.product.set(this.productData);
      this.isInWishlist.set(false); // Default to false for now
    }
  }

  // // Event handlers
  // onImageError(event: Event) {
  //   const img = event.target as HTMLImageElement;
  //   img.src = '/images/placeholder-product.jpg';
  // }

  toggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isWishlistLoading()) return;

    this.isWishlistLoading.set(true);

    this.marketplaceService.toggleWishlist(this.product().id).subscribe({
      next: (response: WishlistResponse) => {
        this.isInWishlist.set(response.inWishlist);
        this.isWishlistLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error toggling wishlist:', error);
        this.isWishlistLoading.set(false);
      },
    });
  }

  quickView(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Record view
    this.marketplaceService.recordView(this.product().id).subscribe();

    // Emit event or handle quick view modal
    // This could open a modal or navigate to product detail
    console.log('Quick view for product:', this.product().id);
  }

  viewProduct() {
    // Record view
    this.marketplaceService.recordView(this.product().id).subscribe();

    // Navigate to product details page
    this.router.navigate(['/marketplace/product', this.product().id]);
  }

  contactSeller(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Handle contact seller action
    console.log('Contact seller for product:', this.product().id);
    // This could open a modal, navigate to chat, or show contact info
  }

  // Utility methods
  formatPrice(price: number): string {
    return this.marketplaceService.formatPrice(price);
  }

  formatCondition(condition: string): string {
    return condition
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStarClass(starType: string): string {
    switch (starType) {
      case 'full':
        return 'text-yellow-400';
      case 'half':
        return 'text-yellow-400';
      case 'empty':
        return 'text-gray-300';
      default:
        return 'text-gray-300';
    }
  }

  getDiscountPercentage(): number {
    // Since originalPrice doesn't exist in the interface, we'll just return 0
    // This method can be implemented if discount pricing is added to the API
    return 0;
  }

  getEstimatedDelivery(): string {
    return this.marketplaceService.getEstimatedDelivery(
      this.product().estimatedDeliveryDays
    );
  }
}

// NOTE: Additional styling and animation utilities are defined in product-card.component.css (gm-card-animate, gm-image-wrap, gm-focusable, etc.)
