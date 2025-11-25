import { Link } from 'react-router-dom';
import { categories } from '@/data/products';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-xl font-bold text-foreground">DigiStore</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted source for premium digital products. E-books, guides, courses, and more.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Categories</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/refunds"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DigiStore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
