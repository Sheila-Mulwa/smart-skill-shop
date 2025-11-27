import { useState } from 'react';
import { Upload, FileText, DollarSign, Tag, User, BookOpen, Save, Plus, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { categories } from '@/data/products';
import { Category, ProductTag } from '@/types/product';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: Category | '';
  author: string;
  format: string;
  pages: string;
  level: 'beginner' | 'advanced' | 'all-levels' | '';
  tags: ProductTag[];
  featured: boolean;
  pdfFile: File | null;
  coverImage: File | null;
}

const initialFormData: ProductFormData = {
  title: '',
  description: '',
  price: '',
  category: '',
  author: '',
  format: 'PDF',
  pages: '',
  level: '',
  tags: [],
  featured: false,
  pdfFile: null,
  coverImage: null,
};

const availableTags: { value: ProductTag; label: string }[] = [
  { value: 'trending', label: '🔥 Trending' },
  { value: 'bestseller', label: '⭐ Bestseller' },
  { value: 'popular', label: '💎 Popular' },
  { value: 'new', label: '✨ New' },
];

const AdminUploadPage = () => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tag: ProductTag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'PDF must be less than 50MB',
          variant: 'destructive',
        });
        return;
      }
      handleInputChange('pdfFile', file);
      setPdfPreview(file.name);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      handleInputChange('coverImage', file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Description required', variant: 'destructive' });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: 'Valid price required', variant: 'destructive' });
      return false;
    }
    if (!formData.category) {
      toast({ title: 'Category required', variant: 'destructive' });
      return false;
    }
    if (!formData.author.trim()) {
      toast({ title: 'Author required', variant: 'destructive' });
      return false;
    }
    if (!formData.pdfFile) {
      toast({ title: 'PDF file required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement actual upload to Supabase storage
      // For now, simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Product uploaded successfully!',
        description: `"${formData.title}" has been added to the store.`,
      });

      // Reset form
      setFormData(initialFormData);
      setPdfPreview(null);
      setCoverPreview(null);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData(initialFormData);
    setPdfPreview(null);
    setCoverPreview(null);
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Upload New Product</h1>
          <p className="mt-2 text-muted-foreground">
            Add a new eBook, guide, or digital product to your store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                Product Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., The Complete Guide to..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what readers will learn..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 min-h-[120px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="author">Author/Creator *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="author"
                        placeholder="Your name or brand"
                        value={formData.author}
                        onChange={(e) => handleInputChange('author', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="29.99"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleInputChange('level', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="all-levels">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="pages">Number of Pages</Label>
                  <Input
                    id="pages"
                    type="number"
                    min="1"
                    placeholder="e.g., 150"
                    value={formData.pages}
                    onChange={(e) => handleInputChange('pages', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Tags & Featured */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Tag className="h-5 w-5 text-primary" />
                Tags & Visibility
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Product Tags</Label>
                  <div className="flex flex-wrap gap-3">
                    {availableTags.map((tag) => (
                      <label
                        key={tag.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          formData.tags.includes(tag.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <Checkbox
                          checked={formData.tags.includes(tag.value)}
                          onCheckedChange={() => handleTagToggle(tag.value)}
                          className="sr-only"
                        />
                        {tag.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange('featured', !!checked)}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    <span className="font-medium">Mark as Featured</span>
                    <p className="text-sm text-muted-foreground">
                      Featured products appear on the homepage
                    </p>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* File Uploads & Preview */}
          <div className="space-y-6">
            {/* PDF Upload */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                PDF File *
              </h2>

              <div className="space-y-4">
                <label
                  htmlFor="pdf-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {pdfPreview || 'Upload PDF'}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    Max 50MB
                  </span>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>

                {pdfPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange('pdfFile', null);
                      setPdfPreview(null);
                    }}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove PDF
                  </Button>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Cover Image
              </h2>

              <div className="space-y-4">
                {coverPreview ? (
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ) : (
                  <label
                    htmlFor="cover-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Upload Cover
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG - Max 5MB
                    </span>
                  </label>
                )}

                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />

                {coverPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange('coverImage', null);
                      setCoverPreview(null);
                    }}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Image
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Product
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={clearForm}
              >
                Clear Form
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AdminUploadPage;
