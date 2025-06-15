
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import BusinessFormSimple, { Business } from '@/components/business/BusinessFormSimple';
import BusinessListSimple from '@/components/business/BusinessListSimple';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BusinessesTabProps {
  showAddBusinessForm: boolean;
  editingBusiness: Business | null;
  onAddBusiness: () => void;
  onEditBusiness: (business: Business) => void;
  onSaved: () => void;
  onCancel: () => void;
  refreshBusinesses: boolean;
}

const BusinessesTab: React.FC<BusinessesTabProps> = ({
  showAddBusinessForm,
  editingBusiness,
  onAddBusiness,
  onEditBusiness,
  onSaved,
  onCancel,
  refreshBusinesses,
}) => {
  return showAddBusinessForm ? (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{editingBusiness ? 'Edit Business' : 'Add Business'}</CardTitle>
        <CardDescription>
          {editingBusiness ? 'Update your business information' : 'List your business or service'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BusinessFormSimple
          business={editingBusiness}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Business Listings</h2>
        <Button onClick={onAddBusiness} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>
      <BusinessListSimple onEdit={onEditBusiness} refresh={refreshBusinesses} />
    </div>
  );
};

export default BusinessesTab;
