import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Product,
  ProductReview,
  ProductCategory,
} from '../../core/interfaces/product.models';
import { MarketplaceService } from '../../core/services/marketplace.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private marketplaceService = inject(MarketplaceService);

  // Signals
  product = signal<Product | null>(null);
  loading = signal(true);
  selectedImage = signal<string>('/images/placeholder-product.jpg');
  activeTab = signal<string>('description');
  reviews = signal<ProductReview[]>([]);
  isInWishlist = signal(false);
  isWishlistLoading = signal(false);
  isSubmittingReview = signal(false);
  currentRating = signal(0);
  showFullDescription = signal(false);
  isImageZoomed = signal(false);
  showPurchaseModal = signal(false);
  showReportModal = signal(false);

  // Computed values
  ratingStars = computed(() => {
    const product = this.product();
    return product
      ? this.marketplaceService.getRatingStars(product.averageRating || 0)
      : [];
  });

  conditionBadgeClass = computed(() => {
    const product = this.product();
    if (!product) return '';

    switch (product.condition) {
      case 'NEW':
        return 'badge-new';
      case 'USED_LIKE_NEW':
      case 'USED_GOOD':
        return 'badge-used';
      case 'USED_FAIR':
      case 'FOR_PARTS':
        return 'badge-refurbished';
      default:
        return '';
    }
  });

  wishlistButtonClass = computed(() => {
    const base = 'transition-colors';
    return this.isInWishlist()
      ? `${base} bg-red-100 text-red-700 border border-red-300 hover:bg-red-200`
      : `${base} border border-gray-300 text-gray-700 hover:bg-gray-50`;
  });

  stockStatus = computed(() => {
    const product = this.product();
    if (!product || !product.isAvailable) return 'unavailable';
    if (product.quantityAvailable === 0) return 'unavailable';
    if (product.quantityAvailable <= 5) return 'low';
    return 'available';
  });

  hasWarranty = computed(() => {
    const product = this.product();
    return product && (product.warrantyPeriodDays || 0) > 0;
  });

  hasReturnPolicy = computed(() => {
    const product = this.product();
    return product && !!product.returnPolicy;
  });

  sellerRating = computed(() => {
    // This would come from seller profile API
    return 4.8; // Placeholder
  });

  totalPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;
    return product.price + (product.freeShipping ? 0 : product.shippingCost);
  });

  // Form
  reviewForm: FormGroup = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1)]],
    comment: ['', [Validators.required, Validators.minLength(10)]],
  });

  // Tabs configuration
  tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'shipping', label: 'Shipping & Returns' },
    { id: 'reviews', label: 'Reviews' },
  ];

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(+productId);
      this.loadReviews(+productId);
      // Record view
      this.marketplaceService.recordView(+productId).subscribe();
    }
  }

  private loadProduct(productId: number) {
    this.loading.set(true);
    this.marketplaceService.getProduct(productId).subscribe({
      next: (response) => {
        this.product.set(response.product);
        this.selectedImage.set(
          response.product.mainImageUrl || '/images/placeholder-product.jpg'
        );
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading.set(false);
      },
    });
  }

  private loadReviews(productId: number) {
    this.marketplaceService.getProductReviews(productId).subscribe({
      next: (response) => {
        this.reviews.set(response.reviews);
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
      },
    });
  }

  // Image gallery methods
  selectImage(imageUrl: string) {
    this.selectedImage.set(imageUrl);
  }

  getThumbnailClass(imageUrl: string): string {
    return this.selectedImage() === imageUrl
      ? 'thumbnail-glass thumbnail-active'
      : 'thumbnail-glass thumbnail-inactive';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholder-product.jpg';
  }

  // Tab methods
  getTabClass(tabId: string): string {
    return this.activeTab() === tabId
      ? 'tab-glass tab-active'
      : 'tab-glass tab-inactive';
  }

  // Action methods
  toggleWishlist() {
    const product = this.product();
    if (!product) return;

    this.isWishlistLoading.set(true);
    this.marketplaceService.toggleWishlist(product.id).subscribe({
      next: (response) => {
        this.isInWishlist.set(response.inWishlist);
        this.isWishlistLoading.set(false);
      },
      error: (error) => {
        console.error('Error toggling wishlist:', error);
        this.isWishlistLoading.set(false);
      },
    });
  }

  contactSeller() {
    // Handle contact seller action
    console.log('Contact seller');
  }

  shareProduct() {
    const product = this.product();
    if (product && navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }

  scrollToReviews() {
    this.activeTab.set('reviews');
  }

  goBack() {
    this.router.navigate(['/marketplace']);
  }

  // New methods for enhanced functionality
  toggleDescription() {
    this.showFullDescription.update((v) => !v);
  }

  toggleImageZoom() {
    this.isImageZoomed.update((v) => !v);
  }

  viewSellerProfile() {
    const product = this.product();
    if (product?.seller) {
      this.router.navigate(['/profile', product.seller.id]);
    }
  }

  openPurchaseModal() {
    const product = this.product();
    if (product && product.isAvailable) {
      this.showPurchaseModal.set(true);
    }
  }

  closePurchaseModal() {
    this.showPurchaseModal.set(false);
  }

  makePurchase() {
    // Handle purchase logic
    console.log('Making purchase');
    this.closePurchaseModal();
  }

  addToCart() {
    // Handle add to cart logic
    console.log('Adding to cart');
  }

  reportProduct() {
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
  }

  submitReport() {
    // Handle report submission
    console.log('Submitting report');
    this.closeReportModal();
  }

  getStockStatusClass(): string {
    switch (this.stockStatus()) {
      case 'available':
        return 'stock-available';
      case 'low':
        return 'stock-low';
      case 'unavailable':
        return 'stock-unavailable';
      default:
        return '';
    }
  }

  getStockStatusText(): string {
    const product = this.product();
    if (!product) return '';

    switch (this.stockStatus()) {
      case 'available':
        return `In Stock (${product.quantityAvailable} available)`;
      case 'low':
        return `Only ${product.quantityAvailable} left!`;
      case 'unavailable':
        return 'Out of Stock';
      default:
        return '';
    }
  }

  getWarrantyText(): string {
    const product = this.product();
    if (!product || !product.warrantyPeriodDays) return '';

    const days = product.warrantyPeriodDays;
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} Year${years > 1 ? 's' : ''} Warranty`;
    }
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} Month${months > 1 ? 's' : ''} Warranty`;
    }
    return `${days} Day${days > 1 ? 's' : ''} Warranty`;
  }

  // Review methods
  setRating(rating: number) {
    this.currentRating.set(rating);
    this.reviewForm.patchValue({ rating });
  }

  getRatingStarClass(star: number): string {
    return this.currentRating() >= star ? 'text-yellow-400' : 'text-gray-300';
  }

  hasUserReviewed(): boolean {
    // This would check if the current user has already reviewed this product
    return false; // Placeholder
  }

  submitReview() {
    const product = this.product();
    if (!product || this.reviewForm.invalid) return;

    this.isSubmittingReview.set(true);
    const formValue = this.reviewForm.value;

    this.marketplaceService
      .addProductReview(product.id, formValue.rating, formValue.comment)
      .subscribe({
        next: (response) => {
          // Add new review to the list
          this.reviews.update((reviews) => [response.review, ...reviews]);
          // Reset form
          this.reviewForm.reset();
          this.currentRating.set(0);
          this.isSubmittingReview.set(false);
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.isSubmittingReview.set(false);
        },
      });
  }

  getReviewStars(rating: number): string[] {
    return this.marketplaceService.getRatingStars(rating);
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

  formatShippingMethod(method: string): string {
    return method
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  getEstimatedDelivery(): string {
    const product = this.product();
    return product
      ? this.marketplaceService.getEstimatedDelivery(
          product.estimatedDeliveryDays
        )
      : '';
  }

  getSpecificationEntries(): Array<{ key: string; value: any }> {
    const product = this.product();
    if (!product || !product.specifications) return [];

    return Object.entries(product.specifications).map(([key, value]) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
    }));
  }
}
