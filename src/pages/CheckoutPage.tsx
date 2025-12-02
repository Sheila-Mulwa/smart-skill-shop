import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, CheckCircle, Lock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type PaymentMethod = 'mpesa' | 'card' | 'paypal';

interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface MpesaDetails {
  phone: string;
}

interface PayPalDetails {
  email: string;
  password: string;
}

const CheckoutPage = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  
  // Card payment state
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  // M-Pesa state
  const [mpesaDetails, setMpesaDetails] = useState<MpesaDetails>({
    phone: '',
  });

  // PayPal state
  const [paypalDetails, setPaypalDetails] = useState<PayPalDetails>({
    email: '',
    password: '',
  });

  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Format phone number for M-Pesa
  const formatPhoneNumber = (value: string) => {
    const v = value.replace(/[^0-9+]/gi, '');
    return v;
  };

  const handleCardChange = (field: keyof CardDetails, value: string) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/gi, '').substring(0, 4);
    }
    setCardDetails((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const validateCardDetails = () => {
    const { cardNumber, cardHolder, expiryDate, cvv } = cardDetails;
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast({ title: 'Invalid card number', description: 'Please enter a valid 16-digit card number', variant: 'destructive' });
      return false;
    }
    if (!cardHolder.trim()) {
      toast({ title: 'Missing cardholder name', description: 'Please enter the cardholder name', variant: 'destructive' });
      return false;
    }
    if (expiryDate.length < 5) {
      toast({ title: 'Invalid expiry date', description: 'Please enter a valid expiry date (MM/YY)', variant: 'destructive' });
      return false;
    }
    if (cvv.length < 3) {
      toast({ title: 'Invalid CVV', description: 'Please enter a valid CVV (3-4 digits)', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateMpesaDetails = () => {
    const phone = mpesaDetails.phone.replace(/[^0-9]/g, '');
    if (phone.length < 9) {
      toast({ title: 'Invalid phone number', description: 'Please enter a valid M-Pesa phone number', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validatePayPalDetails = () => {
    if (!paypalDetails.email || !paypalDetails.email.includes('@')) {
      toast({ title: 'Invalid PayPal email', description: 'Please enter a valid PayPal email address', variant: 'destructive' });
      return false;
    }
    if (!paypalDetails.password || paypalDetails.password.length < 6) {
      toast({ title: 'Invalid password', description: 'Please enter your PayPal password', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const processCardPayment = async () => {
    if (!validateCardDetails()) return false;
    
    // Simulate card payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: 'Card Payment Successful!',
      description: `Payment of $${totalPrice.toFixed(2)} processed successfully.`,
    });
    return true;
  };

  const processMpesaPayment = async () => {
    if (!validateMpesaDetails()) return false;
    
    const phone = mpesaDetails.phone;
    
    // Show STK push initiated toast
    toast({
      title: 'M-Pesa STK Push Sent',
      description: `Check your phone ${phone} for the M-Pesa prompt. Enter your PIN to complete payment.`,
    });
    
    // Simulate waiting for M-Pesa confirmation
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    toast({
      title: 'M-Pesa Payment Successful!',
      description: `KES ${(totalPrice * 130).toFixed(0)} received from ${phone}.`,
    });
    return true;
  };

  const processPayPalPayment = async () => {
    if (!validatePayPalDetails()) return false;
    
    // Simulate PayPal payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: 'PayPal Payment Successful!',
      description: `Payment of $${totalPrice.toFixed(2)} completed via PayPal.`,
    });
    return true;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);

    let success = false;
    
    try {
      switch (paymentMethod) {
        case 'card':
          success = await processCardPayment();
          break;
        case 'mpesa':
          success = await processMpesaPayment();
          break;
        case 'paypal':
          success = await processPayPalPayment();
          break;
      }

      if (success) {
        toast({
          title: 'Order Complete!',
          description: 'Your digital products are ready for download. Check your email.',
        });
        clearCart();
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentOptions = [
    {
      id: 'mpesa' as const,
      name: 'M-Pesa',
      description: 'Pay with M-Pesa mobile money',
      icon: Smartphone,
    },
    {
      id: 'card' as const,
      name: 'Card Payment',
      description: 'Visa, Mastercard, Amex',
      icon: CreditCard,
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with PayPal account',
      icon: Building2,
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Payment Form */}
          <div>
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Download links will be sent to this email
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
                        paymentMethod === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          paymentMethod === option.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        )}
                      >
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{option.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {paymentMethod === option.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {/* M-Pesa Payment Form */}
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
                        An STK push will be sent to this number. Amount: KES {(totalPrice * 130).toFixed(0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>Your card details are secure and encrypted</span>
                    </div>
                    
                    <div>
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                        required
                        className="mt-1 font-mono"
                        maxLength={19}
                      />
                    </div>

                    <div>
                      <Label htmlFor="card-holder">Cardholder Name</Label>
                      <Input
                        id="card-holder"
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.cardHolder}
                        onChange={(e) => handleCardChange('cardHolder', e.target.value)}
                        required
                        className="mt-1"
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
                          onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                          required
                          className="mt-1"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardChange('cvv', e.target.value)}
                          required
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/100px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/100px-American_Express_logo_%282018%29.svg.png" alt="Amex" className="h-6 object-contain" />
                    </div>
                  </div>
                )}

                {/* PayPal Payment Form */}
                {paymentMethod === 'paypal' && (
                  <div className="mt-6 space-y-4 rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-center gap-2 py-2">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" 
                        alt="PayPal" 
                        className="h-8 object-contain"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="paypal-email">PayPal Email</Label>
                      <Input
                        id="paypal-email"
                        type="email"
                        placeholder="your@paypal-email.com"
                        value={paypalDetails.email}
                        onChange={(e) => setPaypalDetails((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paypal-password">PayPal Password</Label>
                      <Input
                        id="paypal-password"
                        type="password"
                        placeholder="Enter your PayPal password"
                        value={paypalDetails.password}
                        onChange={(e) => setPaypalDetails((prev) => ({ ...prev, password: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      You'll be securely logged into PayPal to complete your payment.
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isProcessing}
              >
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
                Your payment information is secure and encrypted
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Order Summary
              </h2>

              <div className="max-h-64 space-y-3 overflow-auto">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-clamp-1">
                        {item.product.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      KSh. {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KSh. {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee</span>
                  <span>KSh. 0.00</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-border pt-4 text-xl font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">KSh. {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
