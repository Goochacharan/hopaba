
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { lazy, Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

// Lazy load pages for better performance
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
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Shop />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/business/:id" element={<BusinessDetails />} />
                <Route path="/seller/:id" element={<SellerDetails />} />
                <Route path="/listing/:id" element={<MarketplaceListingDetails />} />
                <Route path="/location/:id" element={<LocationDetails />} />
                <Route path="/messages/:id?" element={<Messages />} />
                <Route path="/messages-listing" element={<MessagesListing />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/post-request" element={<PostRequest />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/request/:id" element={<RequestDetail />} />
                <Route path="/service-requests" element={<ServiceRequests />} />
                <Route path="/provider-requests" element={<ProviderRequests />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/map" element={<Map />} />
                <Route path="/distance-demo" element={<DistanceDemo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
