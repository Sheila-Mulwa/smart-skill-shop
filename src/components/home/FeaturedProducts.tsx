import { useEffect, useState } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types/product';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(6);

        if (error) throw error;
        
        // Transform database data to match Product type
        const productsWithRatings: Product[] = (data || []).map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category as any, // Database stores as string
          image: product.cover_url || '/placeholder.svg',
          rating: 4.5 + Math.random() * 0.5,
          reviewCount: Math.floor(Math.random() * 500) + 50,
          author: product.author,
          format: product.format || 'PDF',
          pages: product.pages || 0,
          featured: product.featured || false,
          level: (product.level as any) || 'all-levels',
          tags: (product.tags as any) || [],
        }));
        
        setFeaturedProducts(productsWithRatings);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Our most popular and highly-rated digital products
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Our most popular and highly-rated digital products
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              No featured products available yet. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Our most popular and highly-rated digital products
            </p>
          </div>
          <Link to="/category/technology" className="hidden md:block">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/category/technology">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
