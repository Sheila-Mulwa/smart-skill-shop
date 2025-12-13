import { useState } from 'react';
import { Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Product, deleteProduct, updateProduct } from '@/hooks/useProducts';
import { categories } from '@/data/products';
import { toast } from '@/hooks/use-toast';

interface ProductManagementProps {
  product: Product;
  onUpdate: () => void;
  onDelete: () => void;
}

const KES_TO_USD_RATE = 130;

export const ProductManagement = ({ product, onUpdate, onDelete }: ProductManagementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editData, setEditData] = useState({
    title: product.title,
    description: product.description,
    price: product.price.toString(),
    price_usd: product.priceUsd?.toString() || '',
    category: product.category,
    author: product.author,
    format: product.format,
    pages: product.pages?.toString() || '',
    level: product.level || '',
  });

  const handlePriceChange = (value: string) => {
    const kesValue = parseFloat(value) || 0;
    const usdValue = kesValue > 0 ? (kesValue / KES_TO_USD_RATE).toFixed(2) : '';
    setEditData(prev => ({ ...prev, price: value, price_usd: usdValue }));
  };

  const handleSave = async () => {
    if (!editData.title.trim() || !editData.description.trim() || !editData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const success = await updateProduct(product.id, {
      title: editData.title.trim(),
      description: editData.description.trim(),
      price: parseFloat(editData.price),
      price_usd: editData.price_usd ? parseFloat(editData.price_usd) : null,
      category: editData.category,
      author: editData.author.trim(),
      format: editData.format,
      pages: editData.pages ? parseInt(editData.pages) : null,
      level: editData.level || null,
    });
    
    setIsSaving(false);
    
    if (success) {
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteProduct(product.id);
    setIsDeleting(false);
    
    if (success) {
      onDelete();
    }
  };

  return (
    <div className="flex gap-2">
      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-1"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>

      {/* Delete Button with Confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to "{product.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price (KES) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Price (USD)</Label>
                <Input
                  value={editData.price_usd ? `$${editData.price_usd}` : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-author">Author *</Label>
                <Input
                  id="edit-author"
                  value={editData.author}
                  onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-format">Format</Label>
                <Input
                  id="edit-format"
                  value={editData.format}
                  onChange={(e) => setEditData(prev => ({ ...prev, format: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pages">Pages</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  value={editData.pages}
                  onChange={(e) => setEditData(prev => ({ ...prev, pages: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-level">Level</Label>
                <Select
                  value={editData.level}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
