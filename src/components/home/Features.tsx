import { Download, Shield, CreditCard, Clock } from 'lucide-react';

const features = [
  {
    icon: Download,
    title: 'Instant Download',
    description: 'Get immediate access to your purchased products',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'M-Pesa, PayPal, and card payments supported',
  },
  {
    icon: CreditCard,
    title: 'Local & International',
    description: 'Payment options for both local and global customers',
  },
  {
    icon: Clock,
    title: 'Lifetime Access',
    description: 'Download your products anytime, forever',
  },
];

const Features = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-fade-in flex flex-col items-center text-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
