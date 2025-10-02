import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  Product,
  ProductFilters,
  ProductCategory,
  ProductCondition,
  GAMING_CATEGORIES,
  GamingCategory,
} from '../../core/interfaces/product.models';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ProductCardComponent,
    TranslateModule,
  ],
  templateUrl: './marketplace.component.html',
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
export class MarketplaceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private marketplaceService = inject(MarketplaceService);

  // Signals
  products = signal<Product[]>([]);
  // productList: Product[] = [
  //   {
  //     id: 101,
  //     name: 'Gaming Mouse Ultra',
  //     description:
  //       'High-performance RGB gaming mouse with customizable DPI settings.',
  //     price: 59.99,
  //     currency: 'USD',
  //     category: {
  //       name: 'MICE',
  //       displayName: 'Mice',
  //       subcategories: ['Wired', 'Wireless', 'High DPI', 'Ergonomic', 'RGB'],
  //     },
  //     subcategory: 'RGB',
  //     condition: 'NEW',
  //     conditionDescription: 'Brand new, sealed in box',
  //     brand: 'Logitech',
  //     model: 'G502 X',
  //     gameCompatibility: ['PC'],
  //     quantityAvailable: 10,
  //     quantitySold: 25,
  //     isAvailable: true,
  //     status: 'ACTIVE',
  //     seller: {
  //       id: 5,
  //       displayName: 'ProGearStore',
  //       profilePictureUrl: '/uploads/profile-pictures/seller_5.jpg',
  //       sellerVerified: true,
  //     },
  //     sellerVerified: true,
  //     shippingMethod: 'STANDARD',
  //     shippingCost: 4.99,
  //     freeShipping: false,
  //     shippingRegions: ['US', 'CA'],
  //     estimatedDeliveryDays: 5,
  //     specifications: {
  //       dpiRange: '100-25600',
  //       sensor: 'HERO 25K',
  //       buttons: 11,
  //     },
  //     dimensions: '13.2 x 7.5 x 4.0 cm',
  //     weight: 89,
  //     color: 'Black',
  //     tags: ['gaming', 'mouse', 'RGB', 'Logitech'],
  //     averageRating: 4.7,
  //     totalReviews: 134,
  //     viewCount: 1200,
  //     wishlistCount: 340,
  //     inquiryCount: 18,
  //     returnPolicy: '30-day return window',
  //     warrantyPeriodDays: 365,
  //     warrantyDescription: '1-year limited hardware warranty',
  //     moderationStatus: 'APPROVED',
  //     mainImageUrl: '/uploads/products/product_101_main.jpg',
  //     imageUrls: [
  //       '/uploads/products/product_101_main.jpg',
  //       '/uploads/products/product_101_side.jpg',
  //       '/uploads/products/product_101_box.jpg',
  //     ],
  //     createdAt: '2025-09-30T20:00:00Z',
  //     listedAt: '2025-09-30T21:00:00Z',
  //   },
  //   {
  //     id: 102,
  //     name: 'PlayStation 5 Console',
  //     description:
  //       'Next-gen gaming console with ray tracing and ultra-fast SSD.',
  //     price: 499.99,
  //     currency: 'USD',
  //     category: {
  //       name: 'GAMING_CONSOLES',
  //       displayName: 'Gaming Consoles',
  //       subcategories: [
  //         'PlayStation',
  //         'Xbox',
  //         'Nintendo',
  //         'PC Gaming',
  //         'Retro Consoles',
  //       ],
  //     },
  //     subcategory: 'PlayStation',
  //     condition: 'NEW',
  //     conditionDescription: 'Brand new in original packaging',
  //     brand: 'Sony',
  //     model: 'PlayStation 5',
  //     gameCompatibility: ['PS5', 'PS4'],
  //     quantityAvailable: 5,
  //     quantitySold: 50,
  //     isAvailable: true,
  //     status: 'ACTIVE',
  //     seller: {
  //       id: 2,
  //       displayName: 'ElectronicsHub',
  //       profilePictureUrl: '/uploads/profile-pictures/seller_2.jpg',
  //       sellerVerified: true,
  //     },
  //     sellerVerified: true,
  //     shippingMethod: 'EXPRESS',
  //     shippingCost: 0,
  //     freeShipping: true,
  //     shippingRegions: ['US', 'CA', 'EU'],
  //     estimatedDeliveryDays: 3,
  //     specifications: {
  //       storage: '825GB SSD',
  //       processor: 'AMD Ryzen Zen 2',
  //       memory: '16GB GDDR6',
  //     },
  //     dimensions: '39.0 x 10.4 x 26.0 cm',
  //     weight: 4200,
  //     color: 'White',
  //     tags: ['console', 'gaming', 'PlayStation', 'Sony'],
  //     averageRating: 4.9,
  //     totalReviews: 412,
  //     viewCount: 3200,
  //     wishlistCount: 1240,
  //     inquiryCount: 85,
  //     returnPolicy: '30-day return window',
  //     warrantyPeriodDays: 365,
  //     warrantyDescription: '1-year manufacturer warranty',
  //     moderationStatus: 'APPROVED',
  //     mainImageUrl: '/uploads/products/product_102_main.jpg',
  //     imageUrls: [
  //       '/uploads/products/product_102_main.jpg',
  //       '/uploads/products/product_102_side.jpg',
  //       '/uploads/products/product_102_box.jpg',
  //     ],
  //     createdAt: '2025-09-29T15:30:00Z',
  //     listedAt: '2025-09-29T16:00:00Z',
  //   },
  //   {
  //     id: 103,
  //     name: 'RTX 4080 Graphics Card',
  //     description:
  //       'High-performance graphics card for 4K gaming and content creation.',
  //     price: 1199.99,
  //     currency: 'USD',
  //     category: {
  //       name: 'PC_COMPONENTS',
  //       displayName: 'PC Components',
  //       subcategories: [
  //         'Graphics Cards',
  //         'Processors',
  //         'RAM',
  //         'Storage',
  //         'Motherboards',
  //         'Power Supplies',
  //       ],
  //     },
  //     subcategory: 'Graphics Cards',
  //     condition: 'NEW',
  //     conditionDescription: 'Factory sealed, never opened',
  //     brand: 'NVIDIA',
  //     model: 'GeForce RTX 4080',
  //     gameCompatibility: ['PC'],
  //     quantityAvailable: 3,
  //     quantitySold: 15,
  //     isAvailable: true,
  //     status: 'ACTIVE',
  //     seller: {
  //       id: 3,
  //       displayName: 'TechComponents',
  //       profilePictureUrl: '/uploads/profile-pictures/seller_3.jpg',
  //       sellerVerified: true,
  //     },
  //     sellerVerified: true,
  //     shippingMethod: 'STANDARD',
  //     shippingCost: 0,
  //     freeShipping: true,
  //     shippingRegions: ['US', 'CA'],
  //     estimatedDeliveryDays: 7,
  //     specifications: {
  //       memory: '16GB GDDR6X',
  //       baseClock: '2205 MHz',
  //       boostClock: '2505 MHz',
  //     },
  //     dimensions: '30.4 x 13.7 x 6.1 cm',
  //     weight: 2200,
  //     color: 'Black',
  //     tags: ['graphics card', 'GPU', 'RTX', 'NVIDIA'],
  //     averageRating: 4.8,
  //     totalReviews: 89,
  //     viewCount: 2100,
  //     wishlistCount: 890,
  //     inquiryCount: 45,
  //     returnPolicy: '14-day return window',
  //     warrantyPeriodDays: 1095,
  //     warrantyDescription: '3-year manufacturer warranty',
  //     moderationStatus: 'APPROVED',
  //     mainImageUrl: '/uploads/products/product_103_main.jpg',
  //     imageUrls: [
  //       '/uploads/products/product_103_main.jpg',
  //       '/uploads/products/product_103_side.jpg',
  //       '/uploads/products/product_103_box.jpg',
  //     ],
  //     createdAt: '2025-09-28T10:15:00Z',
  //     listedAt: '2025-09-28T11:00:00Z',
  //   },
  //   {
  //     id: 104,
  //     name: 'Gaming Chair Pro',
  //     description: 'Ergonomic racing-style gaming chair with lumbar support.',
  //     price: 299.99,
  //     currency: 'USD',
  //     category: {
  //       name: 'GAMING_CHAIRS',
  //       displayName: 'Gaming Chairs',
  //       subcategories: [
  //         'Ergonomic',
  //         'Racing Style',
  //         'Bean Bags',
  //         'Floor Chairs',
  //       ],
  //     },
  //     subcategory: 'Racing Style',
  //     condition: 'NEW',
  //     conditionDescription: 'New in box, assembly required',
  //     brand: 'DXRacer',
  //     model: 'Formula F08',
  //     gameCompatibility: ['PC', 'Console'],
  //     quantityAvailable: 8,
  //     quantitySold: 32,
  //     isAvailable: true,
  //     status: 'ACTIVE',
  //     seller: {
  //       id: 4,
  //       displayName: 'FurnitureGaming',
  //       profilePictureUrl: '/uploads/profile-pictures/seller_4.jpg',
  //       sellerVerified: true,
  //     },
  //     sellerVerified: true,
  //     shippingMethod: 'STANDARD',
  //     shippingCost: 29.99,
  //     freeShipping: false,
  //     shippingRegions: ['US'],
  //     estimatedDeliveryDays: 10,
  //     specifications: {
  //       material: 'PU Leather',
  //       weightCapacity: '330 lbs',
  //       adjustment: '360° swivel, height adjustable',
  //     },
  //     dimensions: '75 x 75 x 120-130 cm',
  //     weight: 25000,
  //     color: 'Black/Red',
  //     tags: ['gaming chair', 'ergonomic', 'racing', 'DXRacer'],
  //     averageRating: 4.5,
  //     totalReviews: 156,
  //     viewCount: 980,
  //     wishlistCount: 245,
  //     inquiryCount: 22,
  //     returnPolicy: '30-day return window',
  //     warrantyPeriodDays: 730,
  //     warrantyDescription: '2-year manufacturer warranty',
  //     moderationStatus: 'APPROVED',
  //     mainImageUrl: '/uploads/products/product_104_main.jpg',
  //     imageUrls: [
  //       '/uploads/products/product_104_main.jpg',
  //       '/uploads/products/product_104_side.jpg',
  //       '/uploads/products/product_104_box.jpg',
  //     ],
  //     createdAt: '2025-09-27T14:20:00Z',
  //     listedAt: '2025-09-27T15:00:00Z',
  //   },
  //   {
  //     id: 105,
  //     name: 'Mechanical Gaming Keyboard',
  //     description: 'RGB mechanical keyboard with Cherry MX switches.',
  //     price: 149.99,
  //     currency: 'USD',
  //     category: {
  //       name: 'KEYBOARDS',
  //       displayName: 'Keyboards',
  //       subcategories: ['Mechanical', 'Membrane', 'Wireless', 'RGB', 'Compact'],
  //     },
  //     subcategory: 'Mechanical',
  //     condition: 'NEW',
  //     conditionDescription: 'Brand new, sealed packaging',
  //     brand: 'Corsair',
  //     model: 'K95 RGB Platinum',
  //     gameCompatibility: ['PC', 'Mac'],
  //     quantityAvailable: 12,
  //     quantitySold: 45,
  //     isAvailable: true,
  //     status: 'ACTIVE',
  //     seller: {
  //       id: 1,
  //       displayName: 'PeripheralsWorld',
  //       profilePictureUrl: '/uploads/profile-pictures/seller_1.jpg',
  //       sellerVerified: true,
  //     },
  //     sellerVerified: true,
  //     shippingMethod: 'STANDARD',
  //     shippingCost: 7.99,
  //     freeShipping: false,
  //     shippingRegions: ['US', 'CA', 'EU'],
  //     estimatedDeliveryDays: 5,
  //     specifications: {
  //       switches: 'Cherry MX Blue',
  //       backlighting: 'RGB LED',
  //       connectivity: 'USB-A',
  //     },
  //     dimensions: '46.4 x 17.1 x 3.8 cm',
  //     weight: 1200,
  //     color: 'Black',
  //     tags: ['mechanical', 'keyboard', 'RGB', 'Corsair'],
  //     averageRating: 4.6,
  //     totalReviews: 203,
  //     viewCount: 1450,
  //     wishlistCount: 445,
  //     inquiryCount: 31,
  //     returnPolicy: '30-day return window',
  //     warrantyPeriodDays: 730,
  //     warrantyDescription: '2-year manufacturer warranty',
  //     moderationStatus: 'APPROVED',
  //     mainImageUrl: '/uploads/products/product_105_main.jpg',
  //     imageUrls: [
  //       '/uploads/products/product_105_main.jpg',
  //       '/uploads/products/product_105_side.jpg',
  //       '/uploads/products/product_105_box.jpg',
  //     ],
  //     createdAt: '2025-09-26T09:45:00Z',
  //     listedAt: '2025-09-26T10:30:00Z',
  //   },
  // ];
  categories = signal<ProductCategory[]>([]);
  loading = signal(false);
  showFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  currentPage = signal(1);
  totalProducts = signal(0);
  totalPages = signal(1);
  selectedConditions = signal<string[]>([]);
  productImage: string = 'http://localhost:8080/api';

  // Computed values
  filtersClass = computed(() => {
    return this.showFilters() ? 'block lg:block' : 'hidden lg:block';
  });

  // Form
  filterForm: FormGroup = this.fb.group({
    search: [''],
    categoryId: [''],
    minPrice: [''],
    maxPrice: [''],
    location: [''],
    freeShippingOnly: [false],
    verifiedSellersOnly: [false],
    availableOnly: [false],
  });

  // Configuration
  conditions = [
    { value: 'NEW', label: 'New', translationKey: 'MARKET.CONDITION.NEW' },
    {
      value: 'USED_LIKE_NEW',
      label: 'Used - Like New',
      translationKey: 'MARKET.CONDITION.USED_LIKE_NEW',
    },
    {
      value: 'USED_GOOD',
      label: 'Used - Good',
      translationKey: 'MARKET.CONDITION.USED_GOOD',
    },
    {
      value: 'USED_FAIR',
      label: 'Used - Fair',
      translationKey: 'MARKET.CONDITION.USED_FAIR',
    },
    {
      value: 'FOR_PARTS',
      label: 'For Parts',
      translationKey: 'MARKET.CONDITION.FOR_PARTS',
    },
  ];

  sortOptions = [
    {
      value: 'newest',
      label: 'Newest First',
      translationKey: 'MARKET.SORT.NEWEST',
    },
    {
      value: 'oldest',
      label: 'Oldest First',
      translationKey: 'MARKET.SORT.OLDEST',
    },
    {
      value: 'price_low',
      label: 'Price: Low to High',
      translationKey: 'MARKET.SORT.PRICE_LOW',
    },
    {
      value: 'price_high',
      label: 'Price: High to Low',
      translationKey: 'MARKET.SORT.PRICE_HIGH',
    },
    {
      value: 'name_asc',
      label: 'Name: A to Z',
      translationKey: 'MARKET.SORT.NAME_ASC',
    },
    {
      value: 'name_desc',
      label: 'Name: Z to A',
      translationKey: 'MARKET.SORT.NAME_DESC',
    },
    {
      value: 'rating',
      label: 'Highest Rated',
      translationKey: 'MARKET.SORT.RATING',
    },
    {
      value: 'popularity',
      label: 'Most Popular',
      translationKey: 'MARKET.SORT.POPULAR',
    },
  ];

  currentSort = signal('newest');

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();

    // Watch for form changes
    this.filterForm.valueChanges.subscribe(() => {
      // Debounce search
      setTimeout(() => this.applyFilters(), 300);
    });
  }

  private loadCategories() {
    // Try to load categories from API first, fallback to predefined gaming categories
    this.marketplaceService.getCategories().subscribe({
      next: (response) => {
        // Use API categories if available, otherwise use predefined categories
        if (response.categories && response.categories.length > 0) {
          this.categories.set(response.categories);
        } else {
          this.categories.set(GAMING_CATEGORIES);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Fallback to predefined gaming categories
        this.categories.set(GAMING_CATEGORIES);
      },
    });
  }

  private loadProducts() {
    this.loading.set(true);

    const filters = this.buildFilters();

    this.marketplaceService.getProducts(filters).subscribe({
      next: (response) => {
        if (response.products.length > 0) {
          this.products.set(response.products);
          this.totalProducts.set(
            response.totalElements || response.products.length
          );
          this.totalPages.set(
            response.totalPages ||
              Math.ceil(
                (response.totalElements || response.products.length) /
                  (filters.size || 20)
              )
          );
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);

        this.loading.set(false);
      },
    });
  }

  private buildFilters(): ProductFilters {
    const formValue = this.filterForm.value;
    const filters: ProductFilters = {
      page: this.currentPage() - 1,
      size: 20,
      sortBy: this.currentSort() as any,
    };

    if (formValue.search?.trim()) {
      filters.query = formValue.search.trim();
    }

    if (formValue.categoryId) {
      filters.category = formValue.categoryId;
    }

    if (formValue.minPrice) {
      filters.minPrice = +formValue.minPrice;
    }

    if (formValue.maxPrice) {
      filters.maxPrice = +formValue.maxPrice;
    }

    if (formValue.location?.trim()) {
      // Location filtering would need to be implemented in the API
      // For now, we'll skip this filter
    }

    if (formValue.freeShippingOnly) {
      filters.freeShipping = true;
    }

    if (formValue.verifiedSellersOnly) {
      // Verified sellers filtering would need to be implemented in the API
      // For now, we'll skip this filter
    }

    if (formValue.availableOnly) {
      // Available only filtering would need to be implemented in the API
      // For now, we'll skip this filter
    }

    if (this.selectedConditions().length > 0) {
      filters.condition = this.selectedConditions()[0] as ProductCondition; // API might only support single condition
    }

    return filters;
  }

  // Event handlers
  toggleFilters() {
    this.showFilters.update((show) => !show);
  }

  toggleViewMode() {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters() {
    this.filterForm.reset();
    this.selectedConditions.set([]);
    this.currentSort.set('newest');
    this.currentPage.set(1);
    this.loadProducts();
  }

  onConditionChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const condition = checkbox.value;

    if (checkbox.checked) {
      this.selectedConditions.update((conditions) => [
        ...conditions,
        condition,
      ]);
    } else {
      this.selectedConditions.update((conditions) =>
        conditions.filter((c) => c !== condition)
      );
    }
  }

  onSortChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.currentSort.set(select.value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  viewProduct(productId: number) {
    // Navigation is handled by routerLink or can be programmatic
    console.log('View product:', productId);
  }

  toggleWishlist(productId: number) {
    this.marketplaceService.toggleWishlist(productId).subscribe({
      next: (response) => {
        console.log('Wishlist toggled:', response);
      },
      error: (error) => {
        console.error('Error toggling wishlist:', error);
      },
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholder-product.jpg';
  }

  // Utility methods
  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.search?.trim() ||
      formValue.categoryId ||
      formValue.minPrice ||
      formValue.maxPrice ||
      formValue.location?.trim() ||
      formValue.freeShippingOnly ||
      formValue.verifiedSellersOnly ||
      formValue.availableOnly ||
      this.selectedConditions().length > 0 ||
      this.currentSort() !== 'newest'
    );
  }

  getActiveFilters(): Array<{ key: string; label: string }> {
    const filters = [];
    const formValue = this.filterForm.value;

    if (formValue.search?.trim()) {
      filters.push({ key: 'search', label: `Search: "${formValue.search}"` });
    }

    if (formValue.categoryId) {
      const category = this.categories().find(
        (c) => c.name === formValue.categoryId
      );
      if (category) {
        filters.push({
          key: 'categoryId',
          label: `Category: ${category.displayName || category.name}`,
        });
      }
    }

    if (formValue.minPrice || formValue.maxPrice) {
      const min = formValue.minPrice ? `$${formValue.minPrice}` : '$0';
      const max = formValue.maxPrice ? `$${formValue.maxPrice}` : '∞';
      filters.push({ key: 'price', label: `Price: ${min} - ${max}` });
    }

    this.selectedConditions().forEach((condition) => {
      const conditionObj = this.conditions.find((c) => c.value === condition);
      if (conditionObj) {
        filters.push({
          key: `condition_${condition}`,
          label: `Condition: ${conditionObj.label}`,
        });
      }
    });

    return filters;
  }

  removeFilter(key: string) {
    if (key === 'search') {
      this.filterForm.patchValue({ search: '' });
    } else if (key === 'categoryId') {
      this.filterForm.patchValue({ categoryId: '' });
    } else if (key === 'price') {
      this.filterForm.patchValue({ minPrice: '', maxPrice: '' });
    } else if (key.startsWith('condition_')) {
      const condition = key.replace('condition_', '');
      this.selectedConditions.update((conditions) =>
        conditions.filter((c) => c !== condition)
      );
    }

    this.applyFilters();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages = [];

    // Show first page
    if (current > 3) {
      pages.push(1);
      if (current > 4) pages.push(-1); // Ellipsis
    }

    // Show pages around current
    for (
      let i = Math.max(1, current - 2);
      i <= Math.min(total, current + 2);
      i++
    ) {
      pages.push(i);
    }

    // Show last page
    if (current < total - 2) {
      if (current < total - 3) pages.push(-1); // Ellipsis
      pages.push(total);
    }

    return pages;
  }

  getPageButtonClass(page: number): string {
    if (page === -1) return 'px-3 py-2 text-gray-500';

    return page === this.currentPage()
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100';
  }

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

  getConditionBadgeColor(condition: string): string {
    return this.marketplaceService.getConditionBadgeColor(condition);
  }

  getRatingStars(rating: number): string[] {
    return this.marketplaceService.getRatingStars(rating);
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
}
