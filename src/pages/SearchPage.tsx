import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { searchProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await searchProducts(query);
      setResults(data);
      setLoading(false);
    };

    performSearch();
  }, [query]);

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
          </div>
          <p className="text-muted-foreground">
            {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Searching products...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">No results found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse our categories.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
