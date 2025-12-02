import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="gradient-hero py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 animate-fade-in flex items-center justify-center gap-3">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              SmartLife Hub
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              • Empowering Your Journey to Excellence
            </span>
          </div>
          <h1 className="animate-fade-in mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl" style={{ animationDelay: '0.1s' }}>
            Transform Your Life,
            <span className="block text-primary">One Download at a Time</span>
          </h1>
          <p className="animate-fade-in mb-8 text-lg text-muted-foreground md:text-xl" style={{ animationDelay: '0.15s' }}>
            Discover premium e-books, guides, crash courses, and resources across nutrition, fitness, mental health, technology, and career development.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="animate-fade-in mx-auto mb-8 flex max-w-xl gap-2"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search e-books, guides, courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 pr-4"
              />
            </div>
            <Button type="submit" variant="hero" size="lg">
              Search
            </Button>
          </form>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in flex flex-wrap justify-center gap-4"
            style={{ animationDelay: '0.3s' }}
          >
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate('/category/technology')}
            >
              Browse Products
            </Button>
            <Button
              variant="hero-outline"
              size="xl"
              onClick={() => navigate('/auth')}
            >
              Join Community
            </Button>
          </div>

          {/* Stats */}
          <div
            className="animate-fade-in mt-12 grid grid-cols-3 gap-8"
            style={{ animationDelay: '0.4s' }}
          >
            <div>
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Digital Products</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">12K+</p>
              <p className="text-sm text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">9</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
