import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User, Store, MessageSquare, Plus, Briefcase, Inbox } from 'lucide-react';
import SearchBar from './SearchBar';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useNotifications } from '@/hooks/useNotifications';
import { useServiceProviderUnreadCount } from '@/hooks/useServiceProviderUnreadCount';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  
  const { unreadCount } = useConversations();
  const { isNotificationsEnabled } = useNotifications();
  const { data: serviceProviderUnreadCount = 0 } = useServiceProviderUnreadCount();
  
  // Check if user is a service provider with longer cache time to prevent refetching
  const { data: isServiceProvider, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['isServiceProvider', user?.id],
    queryFn: async () => {
      if (!user) return false;
      console.log('Checking if user is service provider:', user.id);
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id);
      
      const result = data && data.length > 0;
      console.log('Is service provider result:', result);
      return result;
    },
    enabled: !!user,
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000   // Keep in cache for 10 minutes (changed from cacheTime to gcTime)
  });
  
  useEffect(() => {
    console.log('MainLayout - isServiceProvider:', isServiceProvider);
  }, [isServiceProvider]);
  
  const onSearch = (query: string) => {
    console.log("MainLayout search triggered with:", query);
    if (!user) {
      navigate('/login');
      return;
    }
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  
  const navigateToShop = () => {
    navigate('/shop');
    window.scrollTo(0, 0);
    console.log("Navigating to shop page from: ", location.pathname);
  };
  
  const shouldShowSearchBar = () => {
    return !['/location', '/search', '/post-request'].some(path => location.pathname.startsWith(path));
  };
  
  const getSearchPlaceholder = () => {
    return "What are you looking for today?";
  };
  
  const handlePostRequest = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/post-request');
  };
  
  return <div className="min-h-screen w-full bg-background flex flex-col items-center relative pb-24">
      <header className="w-full sticky top-0 z-50 glass border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link to="/shop" className="flex items-center" role="button" aria-label="Go to shop page" onClick={e => {
          e.preventDefault();
          navigateToShop();
        }}>
            <img 
              src="/lovable-uploads/0d7d8a94-2755-46c0-b154-5b61bc26f3ce.png" 
              alt="Chowkashi Logo" 
              className="h-8 object-contain"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            {!user && <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </div>}
          </div>
        </div>
      </header>
      
      <main className="w-full flex-1 overflow-y-auto pb-32">
        {children}
      </main>
      
      {shouldShowSearchBar() && <div className="fixed bottom-10 left-0 right-0 px-4 z-[60] py-[4px]">
          <div className="max-w-5xl mx-auto">
            <SearchBar onSearch={onSearch} className="mb-0" placeholder={getSearchPlaceholder()} initialValue="" currentRoute={location.pathname} />
          </div>
        </div>}
      
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 z-[60] py-px">
        <div className="max-w-5xl mx-auto flex justify-around items-center">
          <NavButton 
            to="/shop" 
            icon={<Store className="h-5 w-5" />} 
            label="Shop" 
            isActive={location.pathname === '/shop'} 
          />
     
          
          {/* Inbox button */}
          <NavButton 
            to={user ? "/inbox" : "/login"}
            icon={(
              <div className="relative">
                <Inbox className="h-5 w-5" />
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            )}
            label="Inbox" 
            isActive={location.pathname === '/inbox'} 
          />
               
          {/* Post Request Button (middle) */}
          <div className="relative flex flex-col items-center justify-center">
            <button 
              onClick={handlePostRequest}
              className="bg-primary text-primary-foreground flex items-center justify-center rounded-full w-14 h-14 shadow-lg relative bottom-6"
              aria-label="Post a request"
            >
              <Plus className="h-7 w-7" />
            </button>
            {/* Removed the Post Request text */}
          </div>
          
          {/* Vault Button - only show for service providers */}
          {isServiceProvider && (
            <NavButton 
              to="/service-requests" 
              icon={(
                <div className="relative">
                  <Briefcase className="h-5 w-5" />
                  {serviceProviderUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {serviceProviderUnreadCount > 99 ? '99+' : serviceProviderUnreadCount}
                    </span>
                  )}
                </div>
              )}
              label="Vault" 
              isActive={location.pathname === '/service-requests'} 
            />
          )}
          
          {/* Profile Button */}
          <NavButton 
            to={user ? "/profile" : "/login"} 
            icon={<User className="h-5 w-5" />} 
            label={user ? "Profile" : "Login"} 
            isActive={location.pathname === '/profile' || location.pathname === '/login'} 
          />
        </div>
      </div>
    </div>;
};

interface NavButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({
  to,
  icon,
  label,
  isActive
}) => {
  return <Link to={to} className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-all", isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")} aria-label={label}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>;
};

export default MainLayout;
