export type Category = 
  | 'nutrition'
  | 'mental-health'
  | 'fitness'
  | 'technology'
  | 'employment'
  | 'lifestyle'
  | 'business'
  | 'education'
  | 'relationships';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  rating: number;
  reviewCount: number;
  author: string;
  format: string;
  pages?: number;
  featured?: boolean;
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
