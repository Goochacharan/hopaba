
import React from 'react';
import MainLayout from '@/components/MainLayout';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <section className="py-8 px-4 w-full pb-28">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-medium mb-6">Profile Settings</h1>
          <ProfileSettings />
        </div>
      </section>
    </MainLayout>
  );
};

export default Settings;
