
import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProfileLoginFallback: React.FC = () => {
  const navigate = useNavigate();
  return (
    <MainLayout>
      <div className="container mx-auto py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
};
export default ProfileLoginFallback;
