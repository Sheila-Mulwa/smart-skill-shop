import { Link } from 'react-router-dom';
import { Star, ShoppingCart, TrendingUp, Award } from 'lucide-react';
import { Product, ProductTag } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
  exchangeRate?: number;
}

const tagStyles: Record<ProductTag, string> = {
  trending: 'bg-orange-500 text-white',
  bestseller: 'bg-green-500 text-white',
  beginner: 'bg-blue-500 text-white',
  advanced: 'bg-red-500 text-white',
  'all-levels': 'bg-purple-500 text-white',
  new: 'bg-amber-500 text-white',
  popular: 'bg-pink-500 text-white',
};

const tagLabels: Record<ProductTag, string> = {
  trending: '🔥 Trending',
  bestseller: '⭐ Bestseller',
  beginner: 'Beginner',
  advanced: 'Advanced',
  'all-levels': 'All Levels',
  new: '✨ New',
  popular: '💎 Popular',
};

const levelStyles = {
  beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'all-levels': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const ProductCard = ({ product, index = 0, exchangeRate = 0.0077 }: ProductCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);
  
  // Calculate USD price from real exchange rate
  const usdPrice = (product.price * exchangeRate).toFixed(2);

  // Determine which special tags to show (trending/bestseller/popular/new)
  const specialTags = product.tags?.filter(tag => ['trending', 'bestseller', 'popular', 'new'].includes(tag)) || [];

  return (
    <div
      className="animate-fade-in group flex flex-col rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden rounded-t-xl">
        <div className="aspect-[4/3] bg-secondary">
          <img 
            src={product.image} 
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Top badges - Featured & Special Tags */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.featured && (
            <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
              <Award className="h-3 w-3" />
              Featured
            </span>
          )}
          {specialTags.slice(0, 2).map((tag) => (
            <span 
              key={tag}
              className={cn('rounded-full px-2.5 py-1 text-xs font-medium shadow-md', tagStyles[tag])}
            >
              {tagLabels[tag]}
            </span>
          ))}
        </div>

        {/* Level badge - bottom right */}
        {product.level && (
          <div className="absolute bottom-3 right-3">
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold shadow-md', levelStyles[product.level])}>
              {product.level === 'all-levels' ? 'All Levels' : product.level.charAt(0).toUpperCase() + product.level.slice(1)}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {product.title}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>

        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-1 font-medium">{product.format}</span>
          {product.pages && <span>{product.pages} pages</span>}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              KSh. {product.price.toLocaleString()} | USD {usdPrice}
            </p>
          </div>
          <Button
            variant={inCart ? 'secondary' : 'default'}
            size="sm"
            onClick={() => addToCart(product)}
            disabled={inCart}
            className={cn(inCart && 'cursor-not-allowed')}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            {inCart ? 'In Cart' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
