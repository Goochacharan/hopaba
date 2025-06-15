
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/MainLayout';

interface ErrorFallbackProps {
  pageError: string;
}

const ProfileErrorFallback: React.FC<ErrorFallbackProps> = ({ pageError }) => (
  <MainLayout>
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error loading your profile: {pageError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  </MainLayout>
);
export default ProfileErrorFallback;
