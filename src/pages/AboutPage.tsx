import Layout from '@/components/layout/Layout';
import { Book, Users, Award, Target } from 'lucide-react';

const AboutPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-foreground">About SmartLife Hub</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              SmartLife Hub is your premier destination for high-quality digital products designed to transform your life. 
              We curate and deliver exceptional e-books, guides, courses, and resources across diverse categories to help you 
              achieve your personal and professional goals.
            </p>

            <div className="grid gap-8 md:grid-cols-2 my-12">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">Our Mission</h3>
                <p className="text-muted-foreground">
                  To empower individuals worldwide with accessible, affordable, and actionable digital knowledge 
                  that drives real transformation in their lives.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Book className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">Quality Content</h3>
                <p className="text-muted-foreground">
                  Every product on our platform is carefully vetted to ensure it delivers genuine value, 
                  practical insights, and proven strategies you can implement immediately.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">Community First</h3>
                <p className="text-muted-foreground">
                  We're building a community of lifelong learners committed to continuous improvement 
                  and supporting each other's growth journey.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">Trusted Platform</h3>
                <p className="text-muted-foreground">
                  With secure payments, instant delivery, and exceptional customer support, 
                  we ensure a seamless and trustworthy experience for every customer.
                </p>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Why Choose SmartLife Hub?</h2>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-start">
                <span className="mr-2 text-primary">✓</span>
                <span>Carefully curated selection of premium digital products</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">✓</span>
                <span>Affordable pricing that makes knowledge accessible to everyone</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">✓</span>
                <span>Instant digital delivery - start learning immediately</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">✓</span>
                <span>Secure payment processing with multiple payment options</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">✓</span>
                <span>Dedicated customer support to assist you every step of the way</span>
              </li>
            </ul>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Our Categories</h2>
            <p className="text-muted-foreground mb-4">
              We offer digital products across 9 specialized categories:
            </p>
            <div className="grid gap-3 text-muted-foreground mb-8">
              <p>• <strong className="text-foreground">Health & Fitness</strong> - Transform your physical and mental wellbeing</p>
              <p>• <strong className="text-foreground">Technology & Digital Skills</strong> - Master the tools shaping our future</p>
              <p>• <strong className="text-foreground">Food, Nutrition & Lifestyle</strong> - Cultivate healthy, sustainable living habits</p>
              <p>• <strong className="text-foreground">Entrepreneurship & Startup</strong> - Build and grow successful ventures</p>
              <p>• <strong className="text-foreground">Culture & Travel</strong> - Explore the world with confidence</p>
              <p>• <strong className="text-foreground">Social Media & Content Creation</strong> - Amplify your digital presence</p>
              <p>• <strong className="text-foreground">Spirituality & Wellness</strong> - Find balance and inner peace</p>
              <p>• <strong className="text-foreground">Career & Skill Development</strong> - Advance your professional journey</p>
              <p>• <strong className="text-foreground">Diaspora</strong> - Navigate life across cultures successfully</p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mt-8">
              <h2 className="mb-3 text-2xl font-bold text-foreground">Start Your Journey Today</h2>
              <p className="text-muted-foreground">
                Join thousands of learners who are transforming their lives with SmartLife Hub. 
                Browse our extensive collection, find the perfect resource for your goals, and take the first step 
                towards becoming the best version of yourself.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
