import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const AboutUs = () => {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            About SmartLife Hub
          </h2>
          <p className="mb-6 text-lg text-muted-foreground">
            We're your trusted partner in personal and professional growth. SmartLife Hub curates premium digital 
            products—e-books, guides, and courses—designed to transform your life. From health and technology to 
            entrepreneurship and wellness, we bring you actionable knowledge at affordable prices.
          </p>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of learners who trust SmartLife Hub to deliver quality content instantly. 
            Whether you're mastering new skills, building a business, or improving your lifestyle, we're here 
            to support your journey every step of the way.
          </p>
          <Link to="/about">
            <Button variant="hero" size="lg" className="group">
              Learn More About Us
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
