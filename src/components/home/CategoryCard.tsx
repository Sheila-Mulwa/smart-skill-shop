import { Link } from 'react-router-dom';
import { Apple, Dumbbell, Laptop, Briefcase, Sparkles, Rocket, Plane, Video, Globe, LucideIcon } from 'lucide-react';
import { CategoryInfo } from '@/types/product';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Apple,
  Dumbbell,
  Laptop,
  Briefcase,
  Sparkles,
  Rocket,
  Plane,
  Video,
  Globe,
};

const colorMap: Record<string, string> = {
  'health-fitness': 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  'technology': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  'food-nutrition': 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  'entrepreneurship': 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  'culture-travel': 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20',
  'social-media': 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
  'spirituality': 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  'career': 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
  'diaspora': 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20',
};

interface CategoryCardProps {
  category: CategoryInfo;
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const Icon = iconMap[category.icon] || Sparkles;
  const colorClass = colorMap[category.id] || 'bg-primary/10 text-primary hover:bg-primary/20';

  return (
    <Link
      to={`/category/${category.id}`}
      className="animate-fade-in group block"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
            colorClass
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          {category.description}
        </p>
        <p className="text-xs font-medium text-primary">
          {category.productCount} Products →
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
