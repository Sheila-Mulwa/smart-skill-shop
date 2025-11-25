import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Download, FileText, User, ChevronLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getProductById, categories } from '@/data/products';
import { useCart } from '@/context/CartContext';

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
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            <div className="flex aspect-square items-center justify-center">
              <FileText className="h-32 w-32 text-primary/30" />
            </div>
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
