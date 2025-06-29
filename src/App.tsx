import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { queryClient } from '@/lib/queryClient';
import { lazy, Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

// Lazy load pages for better performance
const Welcome = lazy(() => import('@/pages/Welcome'));
const LocationSelection = lazy(() => import('@/pages/LocationSelection'));
const Shop = lazy(() => import('@/pages/Shop'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const BusinessDetails = lazy(() => import('@/pages/BusinessDetails'));
const SellerDetails = lazy(() => import('@/pages/SellerDetails'));
const MarketplaceListingDetails = lazy(() => import('@/pages/MarketplaceListingDetails'));
const LocationDetails = lazy(() => import('@/pages/LocationDetails'));
const Messages = lazy(() => import('@/pages/Messages'));
const MessagesListing = lazy(() => import('@/pages/MessagesListing'));
const Inbox = lazy(() => import('@/pages/Inbox'));
const Profile = lazy(() => import('@/pages/Profile'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const PostRequest = lazy(() => import('@/pages/PostRequest'));
const Requests = lazy(() => import('@/pages/Requests'));
const RequestDetail = lazy(() => import('@/pages/RequestDetail'));
const ServiceRequests = lazy(() => import('@/pages/ServiceRequests'));
const ProviderRequests = lazy(() => import('@/pages/ProviderRequests'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const Map = lazy(() => import('@/pages/Map'));
const DistanceDemo = lazy(() => import('@/pages/DistanceDemo'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsConditions = lazy(() => import('@/pages/TermsConditions'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasLocationPreference } = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (!hasLocationPreference) {
    return <Navigate to="/location-selection" replace />;
  }

  return <>{children}</>;
};

// Auth Route Component (for login/signup when already authenticated)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasLocationPreference } = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    if (!hasLocationPreference) {
      return <Navigate to="/location-selection" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Updated Location Route Component - allows access for location changes
const LocationRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  // Allow access even if user has location preference (for changing location)
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <WishlistProvider>
            <Router>
              <div className="App">
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    {/* Welcome page for unauthenticated users */}
                    <Route path="/welcome" element={<Welcome />} />
                    
                    {/* Auth routes */}
                    <Route path="/login" element={
                      <AuthRoute>
                        <Login />
                      </AuthRoute>
                    } />
                    <Route path="/signup" element={
                      <AuthRoute>
                        <Signup />
                      </AuthRoute>
                    } />
                    
                    {/* Location selection - now accessible for changing location too */}
                    <Route path="/location-selection" element={
                      <LocationRoute>
                        <LocationSelection />
                      </LocationRoute>
                    } />
                    
                    {/* Protected routes - require auth and location */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Shop />
                      </ProtectedRoute>
                    } />
                    <Route path="/shop" element={
                      <ProtectedRoute>
                        <Shop />
                      </ProtectedRoute>
                    } />
                    <Route path="/search" element={
                      <ProtectedRoute>
                        <SearchResults />
                      </ProtectedRoute>
                    } />
                    <Route path="/business/:id" element={
                      <ProtectedRoute>
                        <BusinessDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/:id" element={
                      <ProtectedRoute>
                        <SellerDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/listing/:id" element={
                      <ProtectedRoute>
                        <MarketplaceListingDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/location/:id" element={
                      <ProtectedRoute>
                        <LocationDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/messages/:id?" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    <Route path="/messages-listing" element={
                      <ProtectedRoute>
                        <MessagesListing />
                      </ProtectedRoute>
                    } />
                    <Route path="/inbox" element={
                      <ProtectedRoute>
                        <Inbox />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/post-request" element={
                      <ProtectedRoute>
                        <PostRequest />
                      </ProtectedRoute>
                    } />
                    <Route path="/requests" element={
                      <ProtectedRoute>
                        <Requests />
                      </ProtectedRoute>
                    } />
                    <Route path="/request/:id" element={
                      <ProtectedRoute>
                        <RequestDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/service-requests" element={
                      <ProtectedRoute>
                        <ServiceRequests />
                      </ProtectedRoute>
                    } />
                    <Route path="/provider-requests" element={
                      <ProtectedRoute>
                        <ProviderRequests />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminPanel />
                      </ProtectedRoute>
                    } />
                    <Route path="/map" element={
                      <ProtectedRoute>
                        <Map />
                      </ProtectedRoute>
                    } />
                    <Route path="/distance-demo" element={
                      <ProtectedRoute>
                        <DistanceDemo />
                      </ProtectedRoute>
                    } />
                    
                    {/* Public routes */}
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-conditions" element={<TermsConditions />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </Router>
          </WishlistProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
