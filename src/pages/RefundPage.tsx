import Layout from '@/components/layout/Layout';

const RefundPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-foreground">Refund Policy</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Our Commitment</h2>
            <p className="text-muted-foreground mb-6">
              At SmartLife Hub, we stand behind the quality of our digital products. We want you to be completely satisfied 
              with your purchase. If you're not happy with a product, we offer a straightforward refund process.
            </p>

            <h2 className="mb-4 text-2xl font-bold text-foreground">7-Day Money-Back Guarantee</h2>
            <p className="text-muted-foreground mb-4">
              All digital products purchased from SmartLife Hub are covered by our 7-day money-back guarantee. 
              If you're not satisfied with your purchase for any reason, you can request a full refund within 7 days 
              of the purchase date.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-foreground">Eligible Refunds</h3>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Product does not match the description provided</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>File is corrupted or cannot be accessed</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Product content is incomplete or missing pages</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>You experienced technical issues preventing access to the product</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Product quality does not meet reasonable expectations</span>
              </li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-foreground">How to Request a Refund</h3>
            <ol className="space-y-3 text-muted-foreground mb-6">
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-primary">1.</span>
                <span>Contact our support team through the Contact Us page or email support@smartlifehub.com</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-primary">2.</span>
                <span>Include your order number and the reason for your refund request</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-primary">3.</span>
                <span>Our team will review your request within 1-2 business days</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold text-primary">4.</span>
                <span>Once approved, refunds are processed within 5-7 business days</span>
              </li>
            </ol>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Refund Processing</h2>
            <p className="text-muted-foreground mb-4">
              Approved refunds will be credited back to your original payment method:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span><strong className="text-foreground">M-Pesa:</strong> 1-3 business days</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span><strong className="text-foreground">PayPal:</strong> 3-5 business days</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span><strong className="text-foreground">Credit/Debit Card:</strong> 5-10 business days</span>
              </li>
            </ul>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Non-Refundable Situations</h2>
            <p className="text-muted-foreground mb-4">
              While we strive to accommodate all reasonable refund requests, the following situations are not eligible for refunds:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Refund requests made after the 7-day guarantee period</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Change of mind without a valid reason after downloading the product</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Duplicate purchases of the same product</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Products purchased during promotional sales or bundles (unless defective)</span>
              </li>
            </ul>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Exchanges</h2>
            <p className="text-muted-foreground mb-6">
              We do not offer direct exchanges. If you wish to purchase a different product, please request a refund 
              for your original purchase and make a new purchase of the desired product.
            </p>

            <h2 className="mb-4 text-2xl font-bold text-foreground">Technical Support</h2>
            <p className="text-muted-foreground mb-6">
              Before requesting a refund due to technical issues, please contact our support team. We often can resolve 
              access or download problems quickly, allowing you to enjoy your purchase without delay.
            </p>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mt-8">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Questions About Refunds?</h2>
              <p className="text-muted-foreground">
                If you have any questions about our refund policy or need assistance with a refund request, 
                please don't hesitate to contact our customer support team. We're here to help ensure your 
                complete satisfaction with SmartLife Hub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPage;
