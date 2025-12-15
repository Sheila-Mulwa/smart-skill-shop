import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Smartphone, CheckCircle, Lock, Download, Loader2, AlertTriangle, CreditCard } from 'lucide-react';
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

type PaymentMethod = 'mpesa' | 'card';

interface MpesaDetails {
  phone: string;
}

interface CardDetails {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvc: string;
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
  const [searchParams] = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [pendingIntegration, setPendingIntegration] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const { downloadProduct, isDownloading, downloadingId } = useSecureDownload();
  const { rate: exchangeRate } = useExchangeRate();

  const [mpesaDetails, setMpesaDetails] = useState<MpesaDetails>({
    phone: '',
  });
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvc: '',
  });

  // Handle PesaPal callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('order');
    
    if (paymentStatus === 'success' && orderId) {
      // Show verifying state
      setVerifyingPayment(true);
      
      // Payment completed - wait a moment for IPN to process, then fetch purchases
      const fetchPurchasesWithRetry = async (attempts = 0) => {
        if (!user) return;
        
        const { data: purchases } = await supabase
          .from('purchases')
          .select('product_id, products(id, title, pdf_url)')
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false })
          .limit(10);
        
        if (purchases && purchases.length > 0) {
          const products: PurchasedProduct[] = purchases.map((p: any) => ({
            id: p.products.id,
            title: p.products.title,
            pdf_url: p.products.pdf_url,
          }));
          setPurchasedProducts(products);
          setPurchaseComplete(true);
          setVerifyingPayment(false);
          clearCart();
          toast({
            title: 'Payment Successful!',
            description: 'Your products are ready for download.',
          });
        } else if (attempts < 8) {
          // Retry after 2 seconds if no purchases found yet (IPN might be processing)
          setTimeout(() => fetchPurchasesWithRetry(attempts + 1), 2000);
        } else {
          // After 8 attempts, show message and link to library
          setVerifyingPayment(false);
          toast({
            title: 'Payment Processing',
            description: 'Your payment is being verified. Check your library in a moment.',
          });
          navigate('/purchases');
        }
      };
      
      // Start fetching after a short delay to allow IPN to process
      setTimeout(() => fetchPurchasesWithRetry(), 1500);
    } else if (paymentStatus === 'error') {
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong with your payment. Please try again.',
        variant: 'destructive',
      });
    }
  }, [searchParams, user, clearCart, navigate]);

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

  const validateCardDetails = () => {
    const cardNum = cardDetails.cardNumber.replace(/\s/g, '');
    if (cardNum.length < 13 || cardNum.length > 19) {
      toast({ title: 'Invalid card number', description: 'Please enter a valid card number', variant: 'destructive' });
      return false;
    }
    if (!cardDetails.cardName.trim()) {
      toast({ title: 'Name required', description: 'Please enter the name on your card', variant: 'destructive' });
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      toast({ title: 'Invalid expiry', description: 'Please enter expiry as MM/YY', variant: 'destructive' });
      return false;
    }
    if (cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
      toast({ title: 'Invalid CVC', description: 'Please enter a valid CVC code', variant: 'destructive' });
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

    // Validate payment details based on method
    if (paymentMethod === 'mpesa' && !validateMpesaDetails()) {
      return;
    }
    if (paymentMethod === 'card' && !validateCardDetails()) {
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
      const paymentDetails = paymentMethod === 'mpesa'
        ? { phone: mpesaDetails.phone }
        : { 
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
            cardName: cardDetails.cardName,
            expiryDate: cardDetails.expiryDate,
            cvc: cardDetails.cvc
          };

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          payment_method: paymentMethod,
          items: items.map(item => ({
            product_id: item.product.id,
            amount: item.product.price * item.quantity,
            quantity: item.quantity,
          })),
          payment_details: paymentDetails,
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

      if (data.success && data.redirect_url) {
        // PesaPal redirect-based flow - redirect to payment page
        toast({
          title: 'Redirecting to Payment',
          description: 'You will be redirected to complete your payment...',
        });
        
        // Redirect to PesaPal payment page
        window.location.href = data.redirect_url;
        return;
      } else if (data.success) {
        // Direct success (fallback for other payment methods)
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

  // Show verifying payment state
  if (verifyingPayment) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">Verifying Payment...</h1>
            <p className="mb-8 text-muted-foreground">
              Please wait while we confirm your payment. This may take a few seconds.
            </p>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Payment received - preparing your downloads...</span>
              </div>
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
                
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  {/* M-Pesa Option */}
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

                  {/* Card Payment Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        paymentMethod === 'card'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Debit/Credit Card</p>
                      <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, etc.</p>
                    </div>
                    {paymentMethod === 'card' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </button>
                </div>

                {/* M-Pesa Details */}
                {paymentMethod === 'mpesa' && (
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
                )}

                {/* Card Payment Details */}
                {paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Enter your card details</span>
                    </div>
                    
                    <div>
                      <Label htmlFor="card-name">Name on Card</Label>
                      <Input
                        id="card-name"
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.cardName}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, cardName: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                          setCardDetails(prev => ({ ...prev, cardNumber: value.slice(0, 19) }));
                        }}
                        required
                        className="mt-1"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry-date">Expiry Date</Label>
                        <Input
                          id="expiry-date"
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setCardDetails(prev => ({ ...prev, expiryDate: value }));
                          }}
                          required
                          className="mt-1"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvc">CVC</Label>
                        <Input
                          id="cvc"
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            setCardDetails(prev => ({ ...prev, cvc: value.slice(0, 4) }));
                          }}
                          required
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notice about payment */}
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Secure Payment</p>
                      <p className="text-blue-700 mt-1">
                        {paymentMethod === 'mpesa' 
                          ? 'You will receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.'
                          : 'Your card details are encrypted and processed securely.'}
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
