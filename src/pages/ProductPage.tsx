import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Download, Lock, User, ChevronLeft, Award, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProduct, Product } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSecureDownload } from '@/hooks/useSecureDownload';
import { cn } from '@/lib/utils';
import { categories } from '@/data/products';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product as CartProduct } from '@/types/product';

const tagStyles: Record<string, string> = {
  trending: 'bg-orange-500 text-white',
  bestseller: 'bg-green-500 text-white',
  beginner: 'bg-blue-500 text-white',
  advanced: 'bg-red-500 text-white',
  'all-levels': 'bg-purple-500 text-white',
  new: 'bg-amber-500 text-white',
  popular: 'bg-pink-500 text-white',
};

const tagLabels: Record<string, string> = {
  trending: '🔥 Trending',
  bestseller: '⭐ Bestseller',
  beginner: 'Beginner Friendly',
  advanced: 'Advanced',
  'all-levels': 'All Levels',
  new: '✨ New Release',
  popular: '💎 Popular',
};

const levelStyles: Record<string, string> = {
  beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'all-levels': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { product, loading, error } = useProduct(productId);
  const { addToCart, isInCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { downloadProduct, isDownloading, downloadingId } = useSecureDownload();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const inCart = product ? isInCart(product.id) : false;
  const category = product
    ? categories.find((c) => c.id === product.category)
    : undefined;

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !productId) {
        setHasPurchased(false);
        return;
      }

      setCheckingPurchase(true);
      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasPurchased(true);
        } else {
          setHasPurchased(false);
        }
      } catch (err) {
        console.error('Error checking purchase:', err);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [user, productId]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const specialTags = product.tags?.filter(tag => 
    ['trending', 'bestseller', 'popular', 'new'].includes(tag)
  ) || [];

  const handleDownload = async () => {
    if (!isAuthenticated) {
      return;
    }
    await downloadProduct(product.id, product.title);
  };

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
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
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
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  KSh. {product.price.toLocaleString()}
                </span>
                {product.priceUsd && (
                  <span className="text-xl text-muted-foreground">
                    | USD {product.priceUsd.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {hasPurchased ? (
                  <Button
                    variant="hero"
                    size="xl"
                    className="flex-1"
                    onClick={handleDownload}
                    disabled={isDownloading && downloadingId === product.id}
                  >
                    {isDownloading && downloadingId === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download Now
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    size="xl"
                    className="flex-1"
                    onClick={() => addToCart(product as CartProduct)}
                    disabled={inCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {inCart ? 'Already in Cart' : 'Add to Cart'}
                  </Button>
                )}
              </div>

              {/* Download status indicator */}
              {hasPurchased ? (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Download className="h-4 w-4" />
                  <span>You own this product - Download anytime</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Secure instant download after purchase</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
