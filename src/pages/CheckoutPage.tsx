import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle, Lock, Download, Loader2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSecureDownload } from '@/hooks/useSecureDownload';
import { useExchangeRate } from '@/hooks/useExchangeRate';

interface PurchasedProduct {
  id: string;
  title: string;
  pdf_url: string;
}

const CheckoutPage = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [pendingIntegration, setPendingIntegration] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [checkoutProductIds, setCheckoutProductIds] = useState<string[]>([]);
  const { downloadProduct, isDownloading, downloadingId } = useSecureDownload();
  const { rate: exchangeRate } = useExchangeRate();

  // Listen for purchase confirmation in real-time
  useEffect(() => {
    if (!user || !awaitingPayment) return;

    const channel = supabase
      .channel('purchase-confirmation')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Purchase detected:', payload);
          
          const { data: purchase } = await supabase
            .from('purchases')
            .select('product_id, products(id, title, pdf_url)')
            .eq('id', payload.new.id)
            .single();
          
          if (purchase) {
            const product: PurchasedProduct = {
              id: (purchase.products as any).id,
              title: (purchase.products as any).title,
              pdf_url: (purchase.products as any).pdf_url,
            };
            setPurchasedProducts(prev => {
              const exists = prev.some(p => p.id === product.id);
              return exists ? prev : [...prev, product];
            });
            setPurchaseComplete(true);
            setAwaitingPayment(false);
            clearCart();
            toast({
              title: 'Payment Successful!',
              description: 'Your product is ready for download.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, awaitingPayment, clearCart]);

  // If we didn't get an order id from the payment initiation response (older sessions),
  // try to infer the latest pending order for this user.
  useEffect(() => {
    if (!user || !awaitingPayment || currentOrderId) return;

    const sinceIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    supabase
      .from('pending_orders')
      .select('merchant_reference')
      .eq('user_id', user.id)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Failed to infer latest pending order:', error.message);
          return;
        }

        if (data?.merchant_reference) {
          if (!checkoutProductIds.length) {
            setCheckoutProductIds(items.map((item) => item.product.id));
          }
          setCurrentOrderId(data.merchant_reference);
        }
      });
  }, [user, awaitingPayment, currentOrderId, checkoutProductIds.length, items]);

  // Fallback: poll pending order status (covers cases where realtime is delayed/missed)
  useEffect(() => {
    if (!user || !awaitingPayment || !currentOrderId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 90; // ~3 minutes at 2s interval

    const interval = setInterval(async () => {
      attempts += 1;

      try {
        const { data: pendingOrder, error: pendingError } = await supabase
          .from('pending_orders')
          .select('status, product_ids')
          .eq('merchant_reference', currentOrderId)
          .maybeSingle();

        if (pendingError) {
          console.warn('Pending order poll error:', pendingError.message);
          return;
        }

        if (!pendingOrder) return;

        if (pendingOrder.status === 'completed') {
          const productIds = (pendingOrder.product_ids?.length ? pendingOrder.product_ids : checkoutProductIds) || [];

          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, title, pdf_url')
            .in('id', productIds);

          if (productsError) {
            console.warn('Product fetch error after payment:', productsError.message);
          }

          if (cancelled) return;

          if (products && products.length > 0) {
            setPurchasedProducts(products as PurchasedProduct[]);
          }

          setPurchaseComplete(true);
          setAwaitingPayment(false);
          setCurrentOrderId(null);
          clearCart();
          toast({
            title: 'Payment Successful!',
            description: 'Your product is ready for download.',
          });
          clearInterval(interval);
          return;
        }

        if (pendingOrder.status === 'failed') {
          if (cancelled) return;
          setAwaitingPayment(false);
          setCurrentOrderId(null);
          toast({
            title: 'Payment Failed',
            description: 'Your payment was not completed. Please try again.',
            variant: 'destructive',
          });
          clearInterval(interval);
          return;
        }

        if (attempts >= maxAttempts) {
          if (cancelled) return;
          toast({
            title: 'Still waiting for payment',
            description: 'If you already paid, please wait a moment then refresh this page.',
          });
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Pending order poll unexpected error:', e);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, awaitingPayment, currentOrderId, checkoutProductIds, clearCart]);

  const totalPrice = getTotalPrice();
  const totalUsd = totalPrice * exchangeRate;

  if (!purchaseComplete && !pendingIntegration && !awaitingPayment && items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleDownload = async (productId: string, title: string) => {
    await downloadProduct(productId, title);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast({ title: 'Login required', description: 'Please login to complete your purchase', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    if (!phoneNumber.trim()) {
      toast({ title: 'Phone number required', description: 'Please enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Session expired', description: 'Please login again', variant: 'destructive' });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          payment_method: 'mpesa',
          items: items.map(item => ({
            product_id: item.product.id,
            amount: item.product.price * item.quantity,
            quantity: item.quantity,
          })),
          payment_details: {
            phone: phoneNumber,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: 'Payment Failed',
          description: 'Could not start the payment. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Payment response:', data);

      if (data.success && data.status === 'stk_sent') {
        const orderIdFromResponse = data?.order_id || data?.orderId || data?.merchant_reference || null;
        setCurrentOrderId(orderIdFromResponse);
        setCheckoutProductIds(items.map((item) => item.product.id));
        setAwaitingPayment(true);
        toast({
          title: 'Check Your Phone',
          description: 'Enter your M-Pesa PIN to complete the payment.',
        });
      } else if (data.status === 'pending_integration') {
        setPendingIntegration(true);
        toast({
          title: 'Payment Processing Required',
          description: data.message || 'Payment integration is being set up.',
        });
      } else {
        toast({
          title: 'Payment Failed',
          description: data.error || data.message || 'Could not initiate payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingIntegration) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-10 w-10 text-yellow-600" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">Payment Setup In Progress</h1>
            <p className="mb-4 text-muted-foreground">
              Our M-Pesa payment system is currently being configured.
            </p>
            <div className="rounded-xl border border-border bg-card p-6 text-left">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Contact Us</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Email: pointresearchlimited@gmail.com</li>
              </ul>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/contact')}>
                Contact Support
              </Button>
              <Button onClick={() => navigate('/')}>
                Continue Browsing
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (awaitingPayment) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">Waiting for Payment...</h1>
            <p className="mb-8 text-muted-foreground">
              A payment request has been sent to your phone. Enter your M-Pesa PIN to complete the payment.
            </p>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Smartphone className="h-5 w-5 text-green-500" />
                <span>Check your phone for the M-Pesa prompt</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setAwaitingPayment(false);
                setCurrentOrderId(null);
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (purchaseComplete) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">Payment Successful!</h1>
            <p className="mb-8 text-muted-foreground">
              Your purchase is complete. Download your products below.
            </p>

            <div className="space-y-4 rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Your Downloads</h2>
              {purchasedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <span className="font-medium text-foreground">{product.title}</span>
                  <Button
                    onClick={() => handleDownload(product.id, product.title)}
                    disabled={isDownloading && downloadingId === product.id}
                    className="gap-2"
                  >
                    {isDownloading && downloadingId === product.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/purchases')}>
                View My Library
              </Button>
              <Button onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Payment Method</h2>
                
                <div className="flex items-center gap-4 rounded-lg border border-primary bg-primary/5 p-4 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">M-Pesa</p>
                    <p className="text-sm text-muted-foreground">Pay directly from your phone</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number registered with M-Pesa
                  </p>
                </div>
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  `Pay KSh. ${totalPrice.toFixed(2)}`
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Lock className="mr-1 inline h-3 w-3" />
                Secure M-Pesa payment
              </p>
            </form>
          </div>

          <div>
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Order Summary</h2>
              <div className="max-h-64 space-y-3 overflow-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-clamp-1">{item.product.title}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      KSh. {(item.product.price * item.quantity).toLocaleString()} | USD {(item.product.price * item.quantity * exchangeRate).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KSh. {totalPrice.toLocaleString()} | USD {totalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee</span>
                  <span>KSh. 0.00</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-xl font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">KSh. {totalPrice.toLocaleString()} | USD {totalUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
