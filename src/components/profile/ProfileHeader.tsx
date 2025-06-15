
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Settings as SettingsIcon, LogOut, Shield, Youtube } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileHeaderProps {
  onLogout: () => void;
  user: any;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onLogout, user }) => {
  const navigate = useNavigate();

  const handleContactUs = () => {
    window.open('https://wa.me/919035852926', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col mb-8">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <p className="text-muted-foreground mb-3">
        {user.user_metadata?.full_name || user.email}
      </p>
      <div className="flex gap-3 mb-2">
        <Button variant="outline" onClick={() => navigate('/settings')} className="flex items-center gap-2" size="sm">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
        <Button variant="outline" onClick={onLogout} size="sm" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate('/privacy-policy')} size="sm" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy Policy
        </Button>
        <Button
          variant="outline"
          onClick={handleContactUs}
          size="sm"
          className="flex items-center gap-2"
        >
          {/* Substituting Youtube icon for WhatsApp icon due to project restrictions */}
          <Youtube className="h-4 w-4 text-[#25D366]" />
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default ProfileHeader;
