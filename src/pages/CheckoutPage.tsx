import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle, Lock, Download, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSecureDownload } from '@/hooks/useSecureDownload';
import { useExchangeRate } from '@/hooks/useExchangeRate';

type PaymentMethod = 'mpesa';

interface MpesaDetails {
  phone: string;
}

interface PurchasedProduct {
  id: string;
  title: string;
  pdf_url: string;
}

const CheckoutPage = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [pendingIntegration, setPendingIntegration] = useState(false);
  const { downloadProduct, isDownloading, downloadingId } = useSecureDownload();
  const { rate: exchangeRate } = useExchangeRate();

  const [mpesaDetails, setMpesaDetails] = useState<MpesaDetails>({
    phone: '',
  });

  const totalPrice = getTotalPrice();
  
  // Calculate total USD price using real exchange rate
  const totalUsd = totalPrice * exchangeRate;

  if (!purchaseComplete && !pendingIntegration && items.length === 0) {
    navigate('/cart');
    return null;
  }

  const formatPhoneNumber = (value: string) => {
    return value.replace(/[^0-9+]/gi, '');
  };

  const validateMpesaDetails = () => {
    const phone = mpesaDetails.phone.replace(/[^0-9]/g, '');
    if (phone.length < 9) {
      toast({ title: 'Invalid phone number', description: 'Please enter a valid M-Pesa phone number', variant: 'destructive' });
      return false;
    }
    return true;
  };

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

    // Validate M-Pesa details
    if (!validateMpesaDetails()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Session expired', description: 'Please login again', variant: 'destructive' });
        navigate('/auth');
        return;
      }

      // Call the secure payment processing edge function
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          payment_method: paymentMethod,
          items: items.map(item => ({
            product_id: item.product.id,
            amount: item.product.price * item.quantity,
            quantity: item.quantity,
          })),
          payment_details: {
            phone: mpesaDetails.phone,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: 'Payment Failed',
          description: error.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Payment response:', data);

      if (data.success) {
        // Payment was successful - products are unlocked
        const products: PurchasedProduct[] = items.map(item => ({
          id: item.product.id,
          title: item.product.title,
          pdf_url: (item.product as any).pdfUrl || (item.product as any).pdf_url || '',
        }));

        setPurchasedProducts(products);
        setPurchaseComplete(true);
        clearCart();

        toast({
          title: 'Purchase Complete!',
          description: 'Your products are ready for download below.',
        });
      } else if (data.status === 'pending_integration') {
        // Payment integration is pending
        setPendingIntegration(true);
        toast({
          title: 'Payment Processing Required',
          description: data.message || 'Payment integration is being set up. Please contact support.',
        });
      } else {
        toast({
          title: 'Payment Not Completed',
          description: data.message || 'Payment could not be processed. Please try again.',
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

  // Show pending integration message
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
              Our payment system is currently being configured. Your order has been noted.
            </p>
            <div className="rounded-xl border border-border bg-card p-6 text-left">
              <h2 className="mb-4 text-lg font-semibold text-foreground">What happens next?</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Our team is setting up secure M-Pesa integration</li>
                <li>• You can contact us directly to complete your purchase</li>
                <li>• Email: pointresearchlimited@gmail.com</li>
                <li>• Once payment is confirmed, you'll get instant access</li>
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
                
                {/* M-Pesa - Currently the only active method */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
                      paymentMethod === 'mpesa'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        paymentMethod === 'mpesa'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">M-Pesa</p>
                      <p className="text-sm text-muted-foreground">Pay with M-Pesa mobile money</p>
                    </div>
                    {paymentMethod === 'mpesa' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </button>
                </div>

                {/* M-Pesa Details */}
                <div className="mt-6 space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                    <span>Enter your M-Pesa registered phone number</span>
                  </div>
                  <div>
                    <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesa-phone"
                      type="tel"
                      placeholder="0712345678 or +254712345678"
                      value={mpesaDetails.phone}
                      onChange={(e) => setMpesaDetails({ phone: formatPhoneNumber(e.target.value) })}
                      required
                      className="mt-1"
                      maxLength={13}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      An STK push will be sent to this number. Amount: KSh. {totalPrice.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Notice about other payment methods */}
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Payment Integration Notice</p>
                      <p className="text-yellow-700 mt-1">
                        Card and PayPal payments are coming soon. For now, please use M-Pesa or contact us at{' '}
                        <a href="mailto:pointresearchlimited@gmail.com" className="underline">
                          pointresearchlimited@gmail.com
                        </a>{' '}
                        for alternative payment options.
                      </p>
                    </div>
                  </div>
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
                Your payment is processed securely on our servers
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
