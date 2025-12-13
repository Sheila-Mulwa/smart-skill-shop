import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Package, Loader2, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts, Product } from '@/hooks/useProducts';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { products, loading, refetch } = useProducts();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!error && data) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !checkingAdmin) {
      if (!isAuthenticated) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access this page.',
          variant: 'destructive',
        });
        navigate('/auth');
      } else if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [authLoading, checkingAdmin, isAuthenticated, isAdmin, navigate]);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || checkingAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your store products ({products.length} total)
            </p>
          </div>
          <Link to="/admin/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">No products found</h2>
            <p className="mt-2 text-muted-foreground">
              {searchQuery ? 'Try a different search term.' : 'Get started by adding your first product.'}
            </p>
            {!searchQuery && (
              <Link to="/admin/upload" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onUpdate={refetch}
                onDelete={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

interface ProductListItemProps {
  product: Product;
  onUpdate: () => void;
  onDelete: () => void;
}

const ProductListItem = ({ product, onUpdate, onDelete }: ProductListItemProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${product.id}`}
          className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {product.title}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
            {product.category}
          </span>
          <span className="text-muted-foreground">by {product.author}</span>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-lg font-bold text-primary">
          KSh. {product.price.toLocaleString()}
        </p>
        {product.priceUsd && (
          <p className="text-sm text-muted-foreground">
            USD {product.priceUsd.toFixed(2)}
          </p>
        )}
      </div>

      {/* Actions */}
      <ProductManagement
        product={product}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
};

export default AdminProductsPage;
