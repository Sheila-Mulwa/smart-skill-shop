import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, User, Upload, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { categories } from '@/data/products';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const totalItems = getTotalItems();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Logged out successfully',
      description: 'You have been signed out of your account.',
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo with Slogan */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground leading-tight">
              SmartLife Hub
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Empowering Your Journey to Excellence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Home
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/search">
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>
          
          {isAdmin && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/admin/upload">
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <Upload className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Upload Product</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/admin/products">
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Manage Products</TooltipContent>
              </Tooltip>
            </>
          )}
          
          {isAuthenticated ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/purchases">
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>My Library</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/auth">
                  <Button variant="default" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Login / Sign In</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View Cart</TooltipContent>
          </Tooltip>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-2 py-4">
            <Link
              to="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link
                  to="/admin/upload"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📤 Upload Product
                </Link>
                <Link
                  to="/admin/products"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ⚙️ Manage Products
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                to="/purchases"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => setIsMenuOpen(false)}
              >
                📚 My Library
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
