import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { categories } from '@/data/products';
import { categoryDescriptions } from '@/data/categoryDescriptions';
import { Apple, Brain, Dumbbell, Laptop, Briefcase, Sparkles, LucideIcon, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import type { Product } from '@/types/product';

const iconMap: Record<string, LucideIcon> = {
  Apple,
  Brain,
  Dumbbell,
  Laptop,
  Briefcase,
  Sparkles,
};

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { rate: exchangeRate } = useExchangeRate();
  
  const category = categories.find((c) => c.id === categoryId);
  const Icon = category ? iconMap[category.icon] || Sparkles : Sparkles;
  const categoryInfo = categoryId ? categoryDescriptions[categoryId] : null;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', categoryId);

        if (error) throw error;
        
        // Transform database data to match Product type
        const productsWithRatings: Product[] = (data || []).map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category as any,
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
        
        setProducts(productsWithRatings);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  if (!category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-hero py-12">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Introduction */}
      {categoryInfo && (
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <p className="mb-6 text-lg text-muted-foreground">
                {categoryInfo.intro}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {categoryInfo.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <p className="text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-12">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              {loading ? 'Loading products...' : `${products.length} product${products.length !== 1 ? 's' : ''} available`}
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[250px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} exchangeRate={exchangeRate} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No products in this category yet.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryPage;
