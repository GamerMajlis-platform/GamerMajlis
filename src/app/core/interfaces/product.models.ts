export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: ProductCategory;
  subcategory?: string;
  condition: ProductCondition;
  conditionDescription?: string;
  brand?: string;
  model?: string;
  gameCompatibility?: string[];
  quantityAvailable: number;
  quantitySold: number;
  isAvailable: boolean;
  status: ProductStatus;
  seller: ProductSeller;
  sellerVerified: boolean;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  freeShipping: boolean;
  shippingRegions?: string[];
  estimatedDeliveryDays?: number;
  specifications?: Record<string, any>;
  dimensions?: string;
  weight?: number;
  color?: string;
  tags?: string[];
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  wishlistCount: number;
  inquiryCount: number;
  returnPolicy?: string;
  warrantyPeriodDays?: number;
  warrantyDescription?: string;
  moderationStatus: ModerationStatus;
  mainImageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  listedAt?: string;
}

export interface ProductSeller {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
  sellerVerified?: boolean;
}

export interface ProductImage {
  id: number;
  url: string;
  isMainImage: boolean;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  verified: boolean;
  reviewer: ProductReviewer;
  createdAt: string;
}

export interface ProductReviewer {
  id: number;
  displayName: string;
  profilePictureUrl?: string;
}

export interface ProductCategory {
  name: string;
  displayName: string;
  subcategories?: string[];
}

export interface ProductFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  freeShipping?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
  myProducts?: boolean;
  page?: number;
  size?: number;
}

export interface ProductSearchParams extends ProductFilters {
  query: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  subcategory?: string;
  condition: ProductCondition;
  conditionDescription?: string;
  brand?: string;
  model?: string;
  gameCompatibility?: string[];
  quantityAvailable?: number;
  shippingMethod?: ShippingMethod;
  shippingCost?: number;
  freeShipping?: boolean;
  shippingRegions?: string[];
  estimatedDeliveryDays?: number;
  specifications?: Record<string, any>;
  dimensions?: string;
  weight?: number;
  color?: string;
  tags?: string[];
  returnPolicy?: string;
  warrantyPeriodDays?: number;
  warrantyDescription?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: ProductStatus;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  products: Product[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  product: Product;
}

export interface ProductReviewsResponse {
  success: boolean;
  message: string;
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProductReviewResponse {
  success: boolean;
  message: string;
  review: ProductReview;
}

export interface WishlistResponse {
  success: boolean;
  message: string;
  inWishlist: boolean;
  newWishlistCount: number;
}

export interface ViewCountResponse {
  success: boolean;
  message: string;
  newViewCount: number;
}

export interface ProductCategoriesResponse {
  success: boolean;
  message: string;
  categories: ProductCategory[];
}

export interface ProductImagesResponse {
  success: boolean;
  message: string;
  images: ProductImage[];
}

// Enums
export type ProductCondition =
  | 'NEW'
  | 'USED_LIKE_NEW'
  | 'USED_GOOD'
  | 'USED_FAIR'
  | 'FOR_PARTS';

export type ProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SOLD_OUT'
  | 'EXPIRED';

export type ShippingMethod =
  | 'STANDARD'
  | 'EXPRESS'
  | 'OVERNIGHT'
  | 'PICKUP_ONLY';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export type ProductSortBy =
  | 'price'
  | 'createdAt'
  | 'averageRating'
  | 'viewCount'
  | 'name'
  | 'relevance';

export type SortOrder = 'asc' | 'desc';

// Gaming Product Categories Enum
export enum GamingCategory {
  GAMING_CONSOLES = 'GAMING_CONSOLES',
  GAMING_ACCESSORIES = 'GAMING_ACCESSORIES',
  PC_COMPONENTS = 'PC_COMPONENTS',
  GAMING_PERIPHERALS = 'GAMING_PERIPHERALS',
  GAMING_CHAIRS = 'GAMING_CHAIRS',
  HEADSETS = 'HEADSETS',
  KEYBOARDS = 'KEYBOARDS',
  MICE = 'MICE',
  MONITORS = 'MONITORS',
  GAMES = 'GAMES',
  COLLECTIBLES = 'COLLECTIBLES',
  MERCHANDISE = 'MERCHANDISE',
  OTHER = 'OTHER',
}

// Constants
export const PRODUCT_CONDITIONS: Array<{
  value: ProductCondition;
  label: string;
}> = [
  { value: 'NEW', label: 'New' },
  { value: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { value: 'USED_GOOD', label: 'Used - Good' },
  { value: 'USED_FAIR', label: 'Used - Fair' },
  { value: 'FOR_PARTS', label: 'For Parts' },
];

export const SHIPPING_METHODS: Array<{ value: ShippingMethod; label: string }> =
  [
    { value: 'STANDARD', label: 'Standard Shipping' },
    { value: 'EXPRESS', label: 'Express Shipping' },
    { value: 'OVERNIGHT', label: 'Overnight Shipping' },
    { value: 'PICKUP_ONLY', label: 'Pickup Only' },
  ];

export const PRODUCT_SORT_OPTIONS: Array<{
  value: ProductSortBy;
  label: string;
}> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price', label: 'Price' },
  { value: 'createdAt', label: 'Newest' },
  { value: 'averageRating', label: 'Rating' },
  { value: 'viewCount', label: 'Popularity' },
  { value: 'name', label: 'Name' },
];

// Gaming Product Categories
export const GAMING_CATEGORIES: Array<{
  value: GamingCategory;
  name: string;
  displayName: string;
  subcategories?: string[];
}> = [
  {
    value: GamingCategory.GAMING_CONSOLES,
    name: 'GAMING_CONSOLES',
    displayName: 'Gaming Consoles',
    subcategories: [
      'PlayStation',
      'Xbox',
      'Nintendo',
      'PC Gaming',
      'Retro Consoles',
    ],
  },
  {
    value: GamingCategory.GAMING_ACCESSORIES,
    name: 'GAMING_ACCESSORIES',
    displayName: 'Gaming Accessories',
    subcategories: ['Controllers', 'Cases', 'Stands', 'Cables', 'Memory Cards'],
  },
  {
    value: GamingCategory.PC_COMPONENTS,
    name: 'PC_COMPONENTS',
    displayName: 'PC Components',
    subcategories: [
      'Graphics Cards',
      'Processors',
      'RAM',
      'Storage',
      'Motherboards',
      'Power Supplies',
    ],
  },
  {
    value: GamingCategory.GAMING_PERIPHERALS,
    name: 'GAMING_PERIPHERALS',
    displayName: 'Gaming Peripherals',
    subcategories: [
      'Controllers',
      'Joysticks',
      'Racing Wheels',
      'VR Accessories',
    ],
  },
  {
    value: GamingCategory.GAMING_CHAIRS,
    name: 'GAMING_CHAIRS',
    displayName: 'Gaming Chairs',
    subcategories: ['Ergonomic', 'Racing Style', 'Bean Bags', 'Floor Chairs'],
  },
  {
    value: GamingCategory.HEADSETS,
    name: 'HEADSETS',
    displayName: 'Headsets',
    subcategories: ['Wired', 'Wireless', 'Noise Cancelling', 'Surround Sound'],
  },
  {
    value: GamingCategory.KEYBOARDS,
    name: 'KEYBOARDS',
    displayName: 'Keyboards',
    subcategories: ['Mechanical', 'Membrane', 'Wireless', 'RGB', 'Compact'],
  },
  {
    value: GamingCategory.MICE,
    name: 'MICE',
    displayName: 'Mice',
    subcategories: ['Wired', 'Wireless', 'High DPI', 'Ergonomic', 'RGB'],
  },
  {
    value: GamingCategory.MONITORS,
    name: 'MONITORS',
    displayName: 'Monitors',
    subcategories: ['4K', 'Ultrawide', 'High Refresh Rate', 'HDR', 'Curved'],
  },
  {
    value: GamingCategory.GAMES,
    name: 'GAMES',
    displayName: 'Games',
    subcategories: [
      'PC Games',
      'Console Games',
      'Digital Codes',
      "Collector's Edition",
    ],
  },
  {
    value: GamingCategory.COLLECTIBLES,
    name: 'COLLECTIBLES',
    displayName: 'Collectibles',
    subcategories: ['Figures', 'Cards', 'Art Books', 'Limited Edition Items'],
  },
  {
    value: GamingCategory.MERCHANDISE,
    name: 'MERCHANDISE',
    displayName: 'Merchandise',
    subcategories: ['Clothing', 'Posters', 'Mugs', 'Keychains', 'Stickers'],
  },
  {
    value: GamingCategory.OTHER,
    name: 'OTHER',
    displayName: 'Other',
    subcategories: ['Miscellaneous', 'Custom Items'],
  },
];
