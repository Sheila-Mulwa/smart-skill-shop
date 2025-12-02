import { useEffect, useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  product_id: string;
  amount: number;
  payment_method: string;
  purchased_at: string;
  product: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    pdf_url: string;
    format: string;
  };
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchPurchases = async () => {
      try {
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            id,
            product_id,
            amount,
            payment_method,
            purchased_at,
            product:products (
              id,
              title,
              author,
              cover_url,
              pdf_url,
              format
            )
          `)
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false });

        if (error) throw error;
        setPurchases(data || []);
      } catch (error) {
        console.error('Error fetching purchases:', error);
        toast({
          title: 'Error loading purchases',
          description: 'Failed to load your purchase history.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [user, navigate]);

  const handleDownload = async (pdfUrl: string, productTitle: string) => {
    try {
      // Get signed URL for the PDF
      const { data, error } = await supabase.storage
        .from('products-pdfs')
        .createSignedUrl(pdfUrl, 3600); // 1 hour expiry

      if (error) throw error;

      // Open in new tab for download
      window.open(data.signedUrl, '_blank');
      
      toast({
        title: 'Download started',
        description: `Downloading "${productTitle}"`,
      });
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Loading your purchases...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="mt-2 text-muted-foreground">
            Access all your purchased products and download them anytime
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">No purchases yet</h2>
            <p className="mb-6 text-muted-foreground">
              Start exploring our collection and make your first purchase!
            </p>
            <Button variant="hero" onClick={() => navigate('/')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-card-hover"
              >
                {/* Product Image */}
                <div className="aspect-video overflow-hidden bg-secondary">
                  {purchase.product.cover_url ? (
                    <img
                      src={purchase.product.cover_url}
                      alt={purchase.product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground">
                    {purchase.product.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    By {purchase.product.author}
                  </p>

                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {purchase.product.format}
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        handleDownload(purchase.product.pdf_url, purchase.product.title)
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PurchasesPage;
