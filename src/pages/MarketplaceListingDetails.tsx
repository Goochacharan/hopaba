import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useMarketplaceListing } from '@/hooks/useMarketplaceListings';
import { ArrowLeft, AlertCircle, Image, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ListingImageCarousel from '@/components/marketplace/ListingImageCarousel';
import ListingThumbnails from '@/components/marketplace/ListingThumbnails';
import ListingDescription from '@/components/marketplace/ListingDescription';
import ListingMetadata from '@/components/marketplace/ListingMetadata';
import ImageViewer from '@/components/ImageViewer';
import SafeTradingTips from '@/components/marketplace/SafeTradingTips';
import SellerDetailsCard from '@/components/marketplace/SellerDetailsCard';
import CertificateBadge from '@/components/marketplace/CertificateBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InspectionCertificatesCard from '@/components/marketplace/InspectionCertificatesCard';

const MarketplaceListingDetails = () => {
  const {
    id = ''
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    data: listing,
    isLoading: loading,
    error
  } = useMarketplaceListing(id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [damageImageIndex, setDamageImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'regular' | 'damage'>('regular');
  
  const openImageViewer = (index: number, type: 'regular' | 'damage') => {
    if (type === 'regular') {
      setSelectedImageIndex(index);
    } else {
      setDamageImageIndex(index);
    }
    setCurrentImageType(type);
    setImageViewerOpen(true);
  };
  
  const handleBackToMarketplace = () => {
    if (listing) {
      navigate(`/marketplace?highlight=${id}&category=${listing.category}`);
    } else {
      navigate('/marketplace');
    }
  };
  
  if (loading) {
    return <MainLayout>
        <div className="container mx-auto py-8 px-4 max-w-6xl animate-pulse">
          <div className="mb-8 h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="h-[450px] bg-gray-200 rounded-xl mb-4"></div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>;
  }
  
  if (error || !listing) {
    return <MainLayout>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <Button 
            onClick={handleBackToMarketplace}
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Button>
          
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "Failed to load listing details"}</AlertDescription>
          </Alert>
          
          <Button asChild>
            <Link to="/marketplace">Browse other listings</Link>
          </Button>
        </div>
      </MainLayout>;
  }
  
  const hasDamageImages = listing.damage_images && listing.damage_images.length > 0;
  
  return <MainLayout>
      <div className="w-full py-8 overflow-y-auto pb-32 px-[11px]">
        <div className="max-w-[1400px] mx-auto">
          <Button 
            onClick={handleBackToMarketplace}
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 px-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Button>
          
          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="mb-3">
                <Badge className="mb-2">{listing?.category}</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold mb-0">{listing?.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <ListingMetadata location={listing?.location || ''} createdAt={listing?.created_at || ''} condition={listing?.condition || ''} />
                </div>
              </div>
              
              <Tabs defaultValue="regular" className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="regular" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>Product Images</span>
                  </TabsTrigger>
                  {hasDamageImages && (
                    <TabsTrigger value="damage" className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4" />
                      <span>Damage/Scratch Images</span>
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="regular" className="mt-0 bg-black/5 rounded-xl shadow-sm overflow-hidden">
                  <ListingImageCarousel 
                    images={listing.images} 
                    onImageClick={(index) => openImageViewer(index, 'regular')} 
                    listing={listing}
                  />
                  
                  <div className="p-4">
                    <ListingThumbnails 
                      images={listing.images} 
                      selectedIndex={selectedImageIndex} 
                      onSelect={(index) => {
                        setSelectedImageIndex(index);
                        openImageViewer(index, 'regular');
                      }} 
                    />
                  </div>
                </TabsContent>
                
                {hasDamageImages && (
                  <TabsContent value="damage" className="mt-0 bg-black/5 rounded-xl shadow-sm overflow-hidden">
                    <ListingImageCarousel 
                      images={listing.damage_images} 
                      onImageClick={(index) => openImageViewer(index, 'damage')} 
                      listing={listing}
                      isDamageImages={true}
                    />
                    
                    <div className="p-4">
                      <ListingThumbnails 
                        images={listing.damage_images || []} 
                        selectedIndex={damageImageIndex} 
                        onSelect={(index) => {
                          setDamageImageIndex(index);
                          openImageViewer(index, 'damage');
                        }}
                        isDamageImages={true}
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
              
              {listing && <ImageViewer 
                images={currentImageType === 'regular' ? listing.images : (listing.damage_images || [])} 
                initialIndex={currentImageType === 'regular' ? selectedImageIndex : damageImageIndex} 
                open={imageViewerOpen} 
                onOpenChange={(open) => {
                  setImageViewerOpen(open);
                }} 
              />}
              
              <ListingDescription 
                description={listing?.description || ''} 
                category={listing?.category || ''} 
                condition={listing?.condition || ''} 
                location={listing?.location || ''} 
                createdAt={listing?.created_at || ''} 
                instagram={listing?.seller_instagram || ''}
                showMetadata={false} 
              />
              
              <div className="mt-6">
                {listing && (
                  <SellerDetailsCard
                    id={id || ''}
                    title={listing?.title || ''}
                    price={listing?.price || 0}
                    sellerId={listing?.seller_id || ''}
                    sellerName={listing?.seller_name || ''}
                    sellerRating={listing?.seller_rating || 0}
                    sellerPhone={listing?.seller_phone || null}
                    sellerWhatsapp={listing?.seller_whatsapp || null}
                    sellerInstagram={listing?.seller_instagram || null}
                    location={listing?.location || ''}
                    createdAt={listing?.created_at || ''}
                    mapLink={listing?.map_link || null}
                    reviewCount={listing?.review_count}
                    isNegotiable={listing?.is_negotiable}
                  />
                )}
                
                {listing?.inspection_certificates && listing.inspection_certificates.length > 0 && (
                  <InspectionCertificatesCard
                    certificates={listing.inspection_certificates}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 mb-16">
            <SafeTradingTips />
          </div>
        </div>
      </div>
    </MainLayout>;
};

export default MarketplaceListingDetails;
