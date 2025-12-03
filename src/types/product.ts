export type Category =
  | 'health-fitness'
  | 'technology'
  | 'food-nutrition'
  | 'entrepreneurship'
  | 'culture-travel'
  | 'social-media'
  | 'spirituality'
  | 'career'
  | 'diaspora';

export type ProductTag = 'trending' | 'bestseller' | 'beginner' | 'advanced' | 'all-levels' | 'new' | 'popular';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUsd?: number;
  category: Category;
  image: string;
  rating: number;
  reviewCount: number;
  author: string;
  format: string;
  pages?: number;
  tags?: ProductTag[];
  featured?: boolean;
  level?: 'beginner' | 'advanced' | 'all-levels';
  pdfUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  description: string;
  icon: string;
  productCount: number;
}
