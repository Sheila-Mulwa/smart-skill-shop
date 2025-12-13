export type Category =
  | 'health-fitness'
  | 'technology'
  | 'food-nutrition'
  | 'entrepreneurship'
  | 'culture-travel'
  | 'social-media'
  | 'spirituality'
  | 'career'
  | 'diaspora'
  | string; // Allow dynamic categories from database

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
  tags?: ProductTag[] | string[];
  featured?: boolean;
  level?: 'beginner' | 'advanced' | 'all-levels';
  pdfUrl?: string;
  downloads?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  productCount: number;
}
