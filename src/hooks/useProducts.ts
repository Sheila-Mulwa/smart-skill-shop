import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types/product';

// Columns to select from products table (excludes pdf_url for security)
const PRODUCT_COLUMNS = 'id, title, description, price, price_usd, category, author, format, pages, level, tags, featured, cover_url, downloads, created_at, updated_at';

export interface SupabaseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  price_usd: number | null;
  category: string;
  author: string;
  format: string | null;
  pages: number | null;
  level: string | null;
  tags: string[] | null;
  featured: boolean | null;
  cover_url: string | null;
  downloads: number | null;
  created_at: string;
  updated_at: string;
}

// Re-export Product type for convenience
export type { Product };

// Transform Supabase product to frontend Product
const transformProduct = (p: SupabaseProduct): Product => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  priceUsd: p.price_usd ?? undefined,
  category: p.category,
  image: p.cover_url || '/placeholder.svg',
  rating: 4.5 + Math.random() * 0.5, // Placeholder rating
  reviewCount: Math.floor(100 + Math.random() * 400), // Placeholder review count
  author: p.author,
  format: p.format || 'PDF',
  pages: p.pages ?? undefined,
  featured: p.featured ?? false,
  level: p.level as Product['level'],
  tags: p.tags ?? undefined,
  downloads: p.downloads ?? 0,
});

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts((data || []).map(transformProduct));
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(PRODUCT_COLUMNS)
          .eq('id', productId)
          .single();

        if (error) throw error;

        setProduct(data ? transformProduct(data) : null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};

export const useProductsByCategory = (categoryId: string | undefined) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(PRODUCT_COLUMNS)
          .eq('category', categoryId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProducts((data || []).map(transformProduct));
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return { products, loading, error };
};

export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(PRODUCT_COLUMNS)
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;

        setProducts((data || []).map(transformProduct));
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,author.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return (data || []).map(transformProduct);
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    toast({
      title: 'Product deleted',
      description: 'The product has been removed successfully.',
    });

    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    toast({
      title: 'Delete failed',
      description: 'Unable to delete the product. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};

export const updateProduct = async (
  productId: string,
  updates: Partial<SupabaseProduct>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) throw error;

    toast({
      title: 'Product updated',
      description: 'The product has been updated successfully.',
    });

    return true;
  } catch (err) {
    console.error('Error updating product:', err);
    toast({
      title: 'Update failed',
      description: 'Unable to update the product. Please try again.',
      variant: 'destructive',
    });
    return false;
  }
};
