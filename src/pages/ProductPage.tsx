import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Download, FileText, User, ChevronLeft, Award, TrendingUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getProductById, categories } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { ProductTag } from '@/types/product';

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
  beginner: 'Beginner Friendly',
  advanced: 'Advanced',
  'all-levels': 'All Levels',
  new: '✨ New Release',
  popular: '💎 Popular',
};

const levelStyles = {
  beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'all-levels': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? getProductById(productId) : undefined;
  const { addToCart, isInCart } = useCart();
  const inCart = product ? isInCart(product.id) : false;
  const category = product
    ? categories.find((c) => c.id === product.category)
    : undefined;

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
          <Link to="/" className="mt-4 text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const specialTags = product.tags?.filter(tag => ['trending', 'bestseller', 'popular', 'new'].includes(tag)) || [];

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            to={`/category/${product.category}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to {category?.name || 'Products'}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary">
            <div className="aspect-square">
              <img 
                src={product.image} 
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Badges overlay */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.featured && (
                <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-lg">
                  <Award className="h-4 w-4" />
                  Featured
                </span>
              )}
              {specialTags.map((tag) => (
                <span 
                  key={tag}
                  className={cn('rounded-full px-3 py-1.5 text-sm font-medium shadow-lg', tagStyles[tag])}
                >
                  {tagLabels[tag]}
                </span>
              ))}
            </div>

            {/* Level badge */}
            {product.level && (
              <div className="absolute bottom-4 right-4">
                <span className={cn('rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg', levelStyles[product.level])}>
                  {product.level === 'all-levels' ? 'All Levels' : product.level.charAt(0).toUpperCase() + product.level.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category Badge */}
            <Link
              to={`/category/${product.category}`}
              className="mb-3 inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {category?.name}
            </Link>

            <h1 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-foreground">{product.rating}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Author */}
            <div className="mb-6 flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>By {product.author}</span>
            </div>

            {/* Description */}
            <p className="mb-6 text-lg text-muted-foreground">{product.description}</p>

            {/* Product Details */}
            <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-medium text-foreground">{product.format}</p>
              </div>
              {product.pages && (
                <div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                  <p className="font-medium text-foreground">{product.pages}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Delivery</p>
                <p className="font-medium text-foreground">Instant Download</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access</p>
                <p className="font-medium text-foreground">Lifetime</p>
              </div>
            </div>

            {/* Price and CTA */}
            <div className="mt-auto space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">USD</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1"
                  onClick={() => addToCart(product)}
                  disabled={inCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {inCart ? 'Already in Cart' : 'Add to Cart'}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>Secure instant download after purchase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
