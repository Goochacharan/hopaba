import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { WishlistProvider } from "./contexts/WishlistContext";
import { AuthProvider } from "./hooks/useAuth";
import React, { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy load route components with chunks named for better debugging
const SearchResults = React.lazy(() => import(/* webpackChunkName: "search-results" */ "./pages/SearchResults"));
const LocationDetails = React.lazy(() => import(/* webpackChunkName: "location-details" */ "./pages/LocationDetails"));
const NotFound = React.lazy(() => import(/* webpackChunkName: "not-found" */ "./pages/NotFound"));
const Profile = React.lazy(() => import(/* webpackChunkName: "profile" */ "./pages/Profile"));
const Login = React.lazy(() => import(/* webpackChunkName: "login" */ "./pages/Login"));
const Signup = React.lazy(() => import(/* webpackChunkName: "signup" */ "./pages/Signup"));
const SellerDetails = React.lazy(() => import(/* webpackChunkName: "seller-details" */ "./pages/SellerDetails"));
const AdminPanel = React.lazy(() => import(/* webpackChunkName: "admin-panel" */ "./pages/AdminPanel"));
const Settings = React.lazy(() => import(/* webpackChunkName: "settings" */ "./pages/Settings"));
const Shop = React.lazy(() => import(/* webpackChunkName: "shop" */ "./pages/Shop"));
const BusinessDetails = React.lazy(() => import(/* webpackChunkName: "business-details" */ "./pages/BusinessDetails"));
const PostRequestForm = React.lazy(() => import(/* webpackChunkName: "post-request-form" */ "./components/request/PostRequestForm"));
const PostRequest = React.lazy(() => import(/* webpackChunkName: "post-request" */ "./pages/PostRequest"));
const Requests = React.lazy(() => import(/* webpackChunkName: "requests" */ "./pages/Requests"));
const RequestDetail = React.lazy(() => import(/* webpackChunkName: "request-detail" */ "./pages/RequestDetail"));
const MessagesListing = React.lazy(() => import(/* webpackChunkName: "messages-listing" */ "./pages/MessagesListing"));
const Messages = React.lazy(() => import(/* webpackChunkName: "messages" */ "./pages/Messages"));
const ProviderRequests = React.lazy(() => import(/* webpackChunkName: "provider-requests" */ "./pages/ProviderRequests"));
const ServiceRequests = React.lazy(() => import(/* webpackChunkName: "service-requests" */ "./pages/ServiceRequests"));
const Inbox = React.lazy(() => import(/* webpackChunkName: "inbox" */ "./pages/Inbox"));

// Configure Query Client with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes (renamed from cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component with better UX
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

// Error boundary component for handling lazy load errors
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background/50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
      <h2 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        We encountered an error loading this page. Please try refreshing.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Route prefetching component
const RoutePrefetcher = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch adjacent routes based on current location
    const prefetchRoutes = () => {
      if (location.pathname === '/shop') {
        import("./pages/SearchResults");
      } else if (location.pathname.startsWith('/location/')) {
        import("./pages/LocationDetails");
      }
    };

    prefetchRoutes();
  }, [location]);

  return null;
};

// Custom ErrorBoundary for lazy-loaded components
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Route loading error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RoutePrefetcher />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Redirect root to shop page */}
                  <Route path="/" element={<Navigate to="/shop" replace />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/location/:id" element={<LocationDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/seller/:id" element={<SellerDetails />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/business/:id" element={<BusinessDetails />} />
                  
                  {/* Service Requests routes */}
                  <Route path="/post-request" element={<PostRequest />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/request/:id" element={<RequestDetail />} />
                  <Route path="/messages" element={<MessagesListing />} />
                  <Route path="/messages/:id" element={<Messages />} />
                  
                  {/* Provider routes */}
                  <Route path="/provider-requests" element={<ProviderRequests />} />
                  
                  {/* New Service Requests page */}
                  <Route path="/service-requests" element={<ServiceRequests />} />
                  
                  {/* New Inbox page */}
                  <Route path="/inbox" element={<Inbox />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
