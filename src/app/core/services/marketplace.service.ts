import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  ProductsResponse,
  ProductResponse,
  ProductFilters,
  ProductSearchParams,
  CreateProductRequest,
  UpdateProductRequest,
  ProductReviewsResponse,
  ProductReviewResponse,
  WishlistResponse,
  ViewCountResponse,
  ProductCategoriesResponse,
  ProductImagesResponse,
} from '../interfaces/product.models';

@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api';

  // Product CRUD Operations
  createProduct(
    productData: CreateProductRequest
  ): Observable<ProductResponse> {
    const formData = this.createFormData(productData);
    return this.http.post<ProductResponse>(
      `${this.baseUrl}/products`,
      formData
    );
  }

  getProducts(filters?: ProductFilters): Observable<ProductsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => (params = params.append(key, v.toString())));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ProductsResponse>(`${this.baseUrl}/products`, {
      params,
    });
  }

  getProduct(productId: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(
      `${this.baseUrl}/products/${productId}`
    );
  }

  updateProduct(
    productId: number,
    productData: UpdateProductRequest
  ): Observable<ProductResponse> {
    const formData = this.createFormData(productData);
    return this.http.put<ProductResponse>(
      `${this.baseUrl}/products/${productId}`,
      formData
    );
  }

  deleteProduct(
    productId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/products/${productId}`
    );
  }

  // Product Images
  uploadProductImages(
    productId: number,
    images: File[],
    setMainImage = false
  ): Observable<ProductImagesResponse> {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    if (setMainImage) {
      formData.append('setMainImage', 'true');
    }

    return this.http.post<ProductImagesResponse>(
      `${this.baseUrl}/products/${productId}/images`,
      formData
    );
  }

  // Product Reviews
  getProductReviews(
    productId: number,
    page = 0,
    size = 10
  ): Observable<ProductReviewsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ProductReviewsResponse>(
      `${this.baseUrl}/products/${productId}/reviews`,
      { params }
    );
  }

  addProductReview(
    productId: number,
    rating: number,
    comment: string,
    verified = false
  ): Observable<ProductReviewResponse> {
    const formData = new FormData();
    formData.append('rating', rating.toString());
    formData.append('comment', comment);
    formData.append('verified', verified.toString());

    return this.http.post<ProductReviewResponse>(
      `${this.baseUrl}/products/${productId}/reviews`,
      formData
    );
  }

  // Wishlist
  toggleWishlist(productId: number): Observable<WishlistResponse> {
    return this.http.post<WishlistResponse>(
      `${this.baseUrl}/products/${productId}/wishlist`,
      {}
    );
  }

  // Product Views
  recordView(productId: number): Observable<ViewCountResponse> {
    return this.http.post<ViewCountResponse>(
      `${this.baseUrl}/products/${productId}/view`,
      {}
    );
  }

  // Search
  searchProducts(
    searchParams: ProductSearchParams
  ): Observable<ProductsResponse> {
    let params = new HttpParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => (params = params.append(key, v.toString())));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<ProductsResponse>(`${this.baseUrl}/products/search`, {
      params,
    });
  }

  // Categories
  getCategories(): Observable<ProductCategoriesResponse> {
    return this.http.get<ProductCategoriesResponse>(
      `${this.baseUrl}/products/categories`
    );
  }

  // Featured Products
  getFeaturedProducts(limit = 10): Observable<ProductsResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/featured`,
      { params }
    );
  }

  // Helper Methods
  private createFormData(data: any): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return formData;
  }

  // Utility methods for components
  formatPrice(price: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  getConditionColor(condition: string): string {
    const colors: Record<string, string> = {
      NEW: 'text-green-500',
      USED_LIKE_NEW: 'text-blue-500',
      USED_GOOD: 'text-yellow-500',
      USED_FAIR: 'text-orange-500',
      FOR_PARTS: 'text-red-500',
    };
    return colors[condition] || 'text-gray-500';
  }

  getConditionBadgeColor(condition: string): string {
    const colors: Record<string, string> = {
      NEW: 'bg-green-100 text-green-800',
      USED_LIKE_NEW: 'bg-blue-100 text-blue-800',
      USED_GOOD: 'bg-yellow-100 text-yellow-800',
      USED_FAIR: 'bg-orange-100 text-orange-800',
      FOR_PARTS: 'bg-red-100 text-red-800',
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }

  calculateShippingTotal(
    price: number,
    shippingCost: number,
    freeShipping: boolean
  ): number {
    return freeShipping ? price : price + shippingCost;
  }

  getEstimatedDelivery(estimatedDays?: number): string {
    if (!estimatedDays) return 'Delivery time not specified';

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

    return `Expected by ${deliveryDate.toLocaleDateString()}`;
  }
}
