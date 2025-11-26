import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product, ProductTag } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const tagStyles: Record<ProductTag, string> = {
  trending: 'bg-orange-500 text-white',
  bestseller: 'bg-green-500 text-white',
  beginner: 'bg-blue-500 text-white',
  advanced: 'bg-red-500 text-white',
  new: 'bg-purple-500 text-white',
  popular: 'bg-pink-500 text-white',
};

const tagLabels: Record<ProductTag, string> = {
  trending: 'Trending',
  bestseller: 'Bestseller',
  beginner: 'Beginner',
  advanced: 'Advanced',
  new: 'New',
  popular: 'Popular',
};

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);

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
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {product.featured && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Featured
            </span>
          )}
          {product.tags?.map((tag) => (
            <span 
              key={tag}
              className={cn('rounded-full px-2 py-1 text-xs font-medium', tagStyles[tag])}
            >
              {tagLabels[tag]}
            </span>
          ))}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-foreground">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
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
          <span className="rounded-full bg-secondary px-2 py-1">{product.format}</span>
          {product.pages && <span>{product.pages} pages</span>}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <p className="text-2xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>
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
