import Layout from '@/components/layout/Layout';

const TermsPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using SmartLife Hub, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">2. Services Description</h2>
              <p className="text-muted-foreground">
                SmartLife Hub provides a platform for purchasing and downloading digital products including e-books, guides, 
                courses, and other educational materials. We reserve the right to modify, suspend, or discontinue any part 
                of our services at any time without prior notice.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">3. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To purchase products, you must create an account. You agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Provide accurate, current, and complete information</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Maintain and update your information to keep it accurate</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Maintain the security of your password</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Accept responsibility for all activities under your account</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Notify us immediately of any unauthorized use</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">4. Purchases and Payments</h2>
              <p className="text-muted-foreground mb-4">
                All purchases are subject to the following terms:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Prices are displayed in the applicable currency and may change without notice</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Payment must be received before product delivery</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>We accept M-Pesa, PayPal, and major credit/debit cards</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>All sales are final unless covered by our refund policy</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>You are responsible for any applicable taxes</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">5. Digital Product Delivery</h2>
              <p className="text-muted-foreground">
                Upon successful payment, digital products are delivered immediately through download links accessible from 
                your account dashboard. You are responsible for downloading and storing your purchased products. While we 
                strive to maintain access to your purchases, we are not responsible for files lost due to device failure, 
                account deletion, or other circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">6. License and Usage Rights</h2>
              <p className="text-muted-foreground mb-4">
                When you purchase a digital product, you receive a limited, non-exclusive, non-transferable license to:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Download and view the product for personal use only</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Store personal copies for backup purposes</span></li>
              </ul>
              <p className="text-muted-foreground mb-4">You may NOT:</p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Share, distribute, or resell the products</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Modify, adapt, or create derivative works</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Remove copyright notices or proprietary markings</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Use products for commercial purposes</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">7. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on SmartLife Hub, including products, logos, text, graphics, and software, is protected by 
                copyright, trademark, and other intellectual property laws. Unauthorized use may violate these laws and 
                is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">8. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Violate any applicable laws or regulations</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Impersonate any person or entity</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Interfere with or disrupt our services</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Attempt unauthorized access to our systems</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Use automated systems to access our website</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Engage in fraudulent activities</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">9. Refunds and Returns</h2>
              <p className="text-muted-foreground">
                Our refund policy is outlined in our Refund Policy page. Please review it carefully before making a purchase. 
                Digital products may be eligible for refunds within 7 days of purchase under certain conditions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">10. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                Our services and products are provided "as is" without warranties of any kind, either express or implied. 
                We do not guarantee that our services will be uninterrupted, secure, or error-free. We are not responsible 
                for the accuracy, reliability, or effectiveness of product content.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">11. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, SmartLife Hub shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages arising from your use of our services or products. Our total 
                liability shall not exceed the amount you paid for the specific product or service.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">12. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account and access to our services at our sole discretion, 
                without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, 
                us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">13. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately 
                upon posting to the website. Your continued use of our services after changes constitutes acceptance of 
                the modified terms.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">14. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with applicable laws, without 
                regard to conflict of law principles. Any disputes shall be resolved through binding arbitration.
              </p>
            </section>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mt-8">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
                <br /><strong className="text-foreground">support@smartlifehub.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
