import { categories } from '@/data/products';
import CategoryCard from './CategoryCard';

const Categories = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">
            Explore Our Categories
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Dive into comprehensive resources designed to help you grow in every aspect of life
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
