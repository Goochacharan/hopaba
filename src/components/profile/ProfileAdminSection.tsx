
import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AdminSection = React.lazy(() => import('@/components/admin/AdminSectionWrapper'));

const ProfileAdminSection: React.FC = () => (
  <Suspense
    fallback={
      <Card className="mb-8">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading admin section...</span>
        </CardContent>
      </Card>
    }
  >
    <AdminSection />
  </Suspense>
);

export default ProfileAdminSection;
