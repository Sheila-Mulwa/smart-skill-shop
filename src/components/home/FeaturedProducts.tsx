import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FeaturedProducts = () => {
  const featuredProducts = getFeaturedProducts();

  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Our most popular and highly-rated digital products
            </p>
          </div>
          <Link to="/category/technology" className="hidden md:block">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/category/technology">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
