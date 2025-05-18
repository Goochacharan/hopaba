
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AnimatedLogo from './AnimatedLogo';
import { cn } from '@/lib/utils';
import { User, Store } from 'lucide-react';
import SearchBar from './SearchBar';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';

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
    return !['/location', '/search'].some(path => location.pathname.startsWith(path));
  };
  
  const getSearchPlaceholder = () => {
    return "What are you looking for today?";
  };
  
  return <div className="min-h-screen w-full bg-background flex flex-col items-center relative pb-24">
      <header className="w-full sticky top-0 z-50 glass border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2" role="button" aria-label="Go to shop page" onClick={e => {
          e.preventDefault();
          navigateToShop();
        }}>
            <AnimatedLogo size="sm" />
            <h1 className="text-xl font-medium tracking-tight">
              Hopaba
            </h1>
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
        <div className="max-w-5xl mx-auto flex justify-around">
          <NavButton to="/shop" icon={<Store className="h-5 w-5" />} label="Shop" isActive={location.pathname === '/shop'} />
          
          <NavButton to={user ? "/profile" : "/login"} icon={<User className="h-5 w-5" />} label={user ? "Profile" : "Login"} isActive={location.pathname === '/profile' || location.pathname === '/login'} />
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
