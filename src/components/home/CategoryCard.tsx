import { Link } from 'react-router-dom';
import { Apple, Brain, Dumbbell, Laptop, Briefcase, Sparkles, LucideIcon } from 'lucide-react';
import { CategoryInfo } from '@/types/product';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Apple,
  Brain,
  Dumbbell,
  Laptop,
  Briefcase,
  Sparkles,
};

const colorMap: Record<string, string> = {
  nutrition: 'bg-category-nutrition/10 text-category-nutrition hover:bg-category-nutrition/20',
  'mental-health': 'bg-category-mental/10 text-category-mental hover:bg-category-mental/20',
  fitness: 'bg-category-fitness/10 text-category-fitness hover:bg-category-fitness/20',
  technology: 'bg-category-tech/10 text-category-tech hover:bg-category-tech/20',
  employment: 'bg-category-employment/10 text-category-employment hover:bg-category-employment/20',
  lifestyle: 'bg-category-lifestyle/10 text-category-lifestyle hover:bg-category-lifestyle/20',
};

interface CategoryCardProps {
  category: CategoryInfo;
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const Icon = iconMap[category.icon] || Sparkles;
  const colorClass = colorMap[category.id] || colorMap.lifestyle;

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
