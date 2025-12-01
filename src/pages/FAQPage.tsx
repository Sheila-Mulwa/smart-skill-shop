import Layout from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold text-foreground">Frequently Asked Questions</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Find answers to common questions about SmartLife Hub, our products, and services.
          </p>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                What types of products do you offer?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a wide range of digital products including e-books, guides, courses, and downloadable resources 
                across 9 categories: Health & Fitness, Technology & Digital Skills, Food/Nutrition & Lifestyle, 
                Entrepreneurship & Startup, Culture & Travel, Social Media & Content Creation, Spirituality & Wellness, 
                Career & Skill Development, and Diaspora.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                How do I access my purchased products?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                After completing your purchase, you'll receive instant access to download your digital products. 
                You can access them from your account dashboard at any time. All products are delivered in PDF format 
                for easy viewing on any device.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept multiple payment methods including M-Pesa for local transactions, PayPal for international 
                payments, and major credit/debit cards. All transactions are processed securely through encrypted connections.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                Can I get a refund if I'm not satisfied?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We offer a 7-day money-back guarantee on all products. If you're not satisfied with your purchase, 
                contact our support team within 7 days for a full refund. Please review our Refund Policy for complete details.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                Do I need to create an account to make a purchase?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, creating an account is required to purchase and access digital products. This ensures you can 
                re-download your purchases anytime and helps us provide better customer service. Account creation is 
                quick, free, and secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                Are the products available in different formats?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, all our products are delivered in PDF format, which is universally compatible with all 
                devices including smartphones, tablets, computers, and e-readers. PDFs can be easily viewed, searched, 
                and annotated on any platform.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                Can I share my purchased products with others?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our products are licensed for personal use only. Sharing, distributing, or reselling purchased content 
                violates our Terms of Service and copyright laws. If multiple people want to access a product, 
                each person should purchase their own license.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                How do I contact customer support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can reach our customer support team through our Contact Us page. We typically respond within 24 hours 
                on business days. For urgent matters, please mark your inquiry as "urgent" in the subject line.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                Are there any subscription plans available?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, we offer individual product purchases only. However, we're working on subscription plans 
                that will give you access to multiple products at a discounted rate. Stay tuned for updates!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="rounded-lg border border-border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold">
                How often do you add new products?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We regularly add new products to our platform. New releases are featured on our homepage and you can 
                subscribe to our newsletter to get notified about new products, special offers, and exclusive content.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Still have questions?</h2>
            <p className="text-muted-foreground">
              If you couldn't find the answer you're looking for, please don't hesitate to contact us. 
              Our support team is always happy to help!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQPage;
