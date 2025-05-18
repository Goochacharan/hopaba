import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AnimatedLogo from "./AnimatedLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: React.ReactNode;
  hideSearch?: boolean;
}

const MainLayout = ({ children, hideSearch = false }: MainLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <AnimatedLogo size="sm" />
              <span className="hidden font-medium sm:inline-block text-xl">
                Hopaba
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/search" className="transition-colors hover:text-foreground/80">
                Search
              </Link>
              <Link to="/shop" className="transition-colors hover:text-foreground/80">
                Shop
              </Link>
              {user && (
                <Link to="/profile" className="transition-colors hover:text-foreground/80">
                  Profile
                </Link>
              )}
              {user && (
                <Link to="/admin" className="transition-colors hover:text-foreground/80">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center ml-auto md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-64">
                <SheetHeader className="text-left">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Explore and manage your account settings.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="my-4">
                  <div className="flex flex-col space-y-2">
                    <Link to="/" className="block py-2 px-3 hover:bg-secondary rounded-md">
                      Home
                    </Link>
                    <Link to="/search" className="block py-2 px-3 hover:bg-secondary rounded-md">
                      Search
                    </Link>
                    <Link to="/shop" className="block py-2 px-3 hover:bg-secondary rounded-md">
                      Shop
                    </Link>
                    {user && (
                      <Link to="/profile" className="block py-2 px-3 hover:bg-secondary rounded-md">
                        Profile
                      </Link>
                    )}
                    {user && (
                      <Link to="/admin" className="block py-2 px-3 hover:bg-secondary rounded-md">
                        Admin
                      </Link>
                    )}
                    {!user && (
                      <Link to="/login" className="block py-2 px-3 hover:bg-secondary rounded-md">
                        Login
                      </Link>
                    )}
                    {!user && (
                      <Link to="/signup" className="block py-2 px-3 hover:bg-secondary rounded-md">
                        Sign Up
                      </Link>
                    )}
                    {user && (
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          {!hideSearch && (
            <div className="relative hidden md:flex w-[360px] lg:w-[480px] mx-auto">
              <Input
                type="search"
                placeholder="Search..."
                className="pr-10 rounded-full"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Button>
            </div>
          )}
          {user ? (
            <div className="flex items-center space-x-4 ml-auto">
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url as string} />
                <AvatarFallback>{user.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="ml-auto space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Log In
              </Button>
              <Button size="sm" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-64">
          <SheetHeader className="text-left">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Explore and manage your account settings.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="my-4">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="block py-2 px-3 hover:bg-secondary rounded-md">
                Home
              </Link>
              <Link to="/search" className="block py-2 px-3 hover:bg-secondary rounded-md">
                Search
              </Link>
              {user && (
                <Link to="/profile" className="block py-2 px-3 hover:bg-secondary rounded-md">
                  Profile
                </Link>
              )}
              {user && (
                <Link to="/settings" className="block py-2 px-3 hover:bg-secondary rounded-md">
                  Settings
                </Link>
              )}
              {!user && (
                <Link to="/login" className="block py-2 px-3 hover:bg-secondary rounded-md">
                  Login
                </Link>
              )}
              {!user && (
                <Link to="/signup" className="block py-2 px-3 hover:bg-secondary rounded-md">
                  Sign Up
                </Link>
              )}
              {user && (
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                  Sign Out
                </Button>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-12">{children}</div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Hopaba. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
