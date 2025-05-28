
import React from 'react';
import { Form } from '@/components/ui/form';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BusinessFormContent from './BusinessFormContent';
import { Business } from './BusinessForm';
import { useBusinessFormLogic } from '@/hooks/useBusinessFormLogic';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { useAdmin } from '@/hooks/useAdmin';
import { formatPhoneInput } from '@/utils/businessFormUtils';

interface BusinessFormProps {
  business?: Business;
  onSaved: () => void;
  onCancel: () => void;
}

const BusinessFormSimple: React.FC<BusinessFormProps> = ({ business, onSaved, onCancel }) => {
  const { isAdmin } = useAdmin();
  
  const {
    form,
    selectedDays,
    selectedCategoryId,
    setSelectedCategoryId,
    handleDayToggle
  } = useBusinessFormLogic(business);

  const {
    categories,
    dbCategories,
    loadingCategories,
    subcategories,
    loadingSubcategories,
    showAddCategoryDialog,
    setShowAddCategoryDialog,
    showAddSubcategoryDialog,
    setShowAddSubcategoryDialog,
    newCategory,
    setNewCategory,
    newSubcategory,
    setNewSubcategory,
    handleAddCategory,
    handleAddSubcategory
  } = useCategoryManagement();

  const {
    isSubmitting,
    showSuccessDialog,
    handleSubmit,
    handleSuccessDialogClose
  } = useFormSubmission(business, onSaved);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => {
    const formattedValue = formatPhoneInput(e.target.value);
    form.setValue(fieldName, formattedValue, { shouldValidate: true });
  };

  const onSubmit = (data: any) => {
    handleSubmit(data, selectedDays);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <BusinessFormContent 
                form={form}
                handlePhoneInput={handlePhoneInput}
                handleDayToggle={handleDayToggle}
                selectedDays={selectedDays}
                loadingCategories={loadingCategories}
                dbCategories={dbCategories}
                categories={categories}
                isAdmin={isAdmin}
                setShowAddCategoryDialog={setShowAddCategoryDialog}
                selectedCategoryId={selectedCategoryId}
                loadingSubcategories={loadingSubcategories}
                subcategories={subcategories}
                setShowAddSubcategoryDialog={setShowAddSubcategoryDialog}
                isSubmitting={isSubmitting}
                business={business}
                onCancel={onCancel}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 
                "Saving..." : 
                business?.id ? "Update Business" : "Submit Business"
              }
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Add Category Dialog */}
      <AlertDialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Category</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new business category to add to the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddCategory}>Add Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Subcategory Dialog */}
      <AlertDialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new subcategory for the selected category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Subcategory name"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddSubcategory}>Add Subcategory</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={showSuccessDialog} 
        onOpenChange={handleSuccessDialogClose}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {business?.id ? "Business Updated" : "Business Added"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {business?.id ? 
                "Your business listing has been updated and will be reviewed by an admin." :
                "Your business has been listed and will be reviewed by an admin."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleSuccessDialogClose(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BusinessFormSimple;
