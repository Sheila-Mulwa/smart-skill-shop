import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const totalPrice = getTotalPrice();
  
  // Calculate total USD price
  const totalUsd = items.reduce((sum, item) => {
    return sum + (item.product.priceUsd || 0) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-foreground">Your cart is empty</h1>
            <p className="mb-8 text-muted-foreground">
              Looks like you haven't added any products yet. Browse our collection and find something you'll love!
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Shopping Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  {/* Product Image */}
                  <Link
                    to={`/product/${item.product.id}`}
                    className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-secondary"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.product.author}</p>
                    <p className="text-sm text-muted-foreground">{item.product.format}</p>

                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            KSh. {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                          {item.product.priceUsd && (
                            <span className="block text-xs text-muted-foreground">
                              USD {(item.product.priceUsd * item.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="ghost" onClick={clearCart}>
                Clear Cart
              </Button>
              <Link to="/">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Order Summary</h2>

              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({items.length} items)</span>
                  <div className="text-right">
                    <span className="block">KSh. {totalPrice.toLocaleString()}</span>
                    {totalUsd > 0 && (
                      <span className="text-xs">USD {totalUsd.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee</span>
                  <span>KSh. 0.00</span>
                </div>
              </div>

              <div className="flex justify-between py-4 text-lg font-semibold text-foreground">
                <span>Total</span>
                <div className="text-right">
                  <span className="block text-primary">KSh. {totalPrice.toLocaleString()}</span>
                  {totalUsd > 0 && (
                    <span className="block text-sm text-muted-foreground">USD {totalUsd.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Secure checkout with M-Pesa, PayPal, or Card
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
