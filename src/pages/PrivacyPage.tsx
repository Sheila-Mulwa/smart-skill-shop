import Layout from '@/components/layout/Layout';

const PrivacyPage = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Introduction</h2>
              <p className="text-muted-foreground">
                At SmartLife Hub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you visit our website and use our services. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Information We Collect</h2>
              
              <h3 className="mb-3 text-xl font-semibold text-foreground">Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We collect information that you voluntarily provide to us when you:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Create an account</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Make a purchase</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Contact customer support</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Subscribe to our newsletter</span></li>
              </ul>
              <p className="text-muted-foreground mb-4">This information may include:</p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Name and email address</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Phone number (if provided)</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Payment information</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Purchase history</span></li>
              </ul>

              <h3 className="mb-3 text-xl font-semibold text-foreground">Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">
                When you visit our website, we automatically collect certain information about your device and usage, including:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>IP address and browser type</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Operating system and device information</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Pages visited and time spent on pages</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Referring website addresses</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the collected information to:</p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Process and fulfill your orders</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Manage your account and provide customer support</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Send you product updates and promotional materials (with your consent)</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Improve our website and services</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Detect and prevent fraud or abuse</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Comply with legal obligations</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information with:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span><strong className="text-foreground">Payment Processors:</strong> To process transactions securely (M-Pesa, PayPal, etc.)</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span><strong className="text-foreground">Service Providers:</strong> Third parties who assist in operating our website and conducting our business</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights</span></li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Access and receive a copy of your personal data</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Request correction of inaccurate data</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Request deletion of your data</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Object to processing of your data</span></li>
                <li className="flex items-start"><span className="mr-2 text-primary">•</span><span>Withdraw consent at any time</span></li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, please contact us at support@smartlifehub.com
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, 
                and understand where our visitors are coming from. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not intended for children under the age of 13. We do not knowingly collect personal information 
                from children under 13. If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mt-8">
              <h2 className="mb-3 text-xl font-semibold text-foreground">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
                <br /><strong className="text-foreground">support@smartlifehub.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
