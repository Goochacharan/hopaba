// Types for enhanced quotation system

export interface EnhancedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'provider';
  content: string;
  created_at: string;
  read: boolean;
  attachments: string[];
  quotation_price?: number;
  quotation_images?: string[];
  delivery_available?: boolean;
  pricing_type?: 'fixed' | 'negotiable' | 'wholesale';
  wholesale_price?: number;
  negotiable_price?: number;
}

export interface Shop {
  id: string;
  owner_id: string;
  shop_name: string;
  description: string;
  category: string;
  subcategory?: string[];
  address: string;
  area: string;
  city: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  whatsapp?: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  map_link?: string;
  shop_images?: string[];
  logo_image?: string;
  hours?: string;
  tags?: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ShopDetails extends Shop {
  product_count: number;
  owner_name: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  wholesale_price?: number;
  is_negotiable: boolean;
  delivery_available: boolean;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationFormData {
  message: string;
  price: number;
  pricing_type: 'fixed' | 'negotiable' | 'wholesale';
  wholesale_price?: number;
  negotiable_price?: number;
  delivery_available: boolean;
  quotation_images: string[];
}

export interface ShopFormData {
  shop_name: string;
  description: string;
  category: string;
  subcategory: string[];
  address: string;
  area: string;
  city: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  whatsapp?: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  map_link?: string;
  shop_images: string[];
  logo_image?: string;
  hours?: string;
  tags: string[];
}

export interface ShopProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  wholesale_price?: number;
  is_negotiable: boolean;
  delivery_available: boolean;
  images: string[];
  stock_quantity: number;
}

export type PricingType = 'fixed' | 'negotiable' | 'wholesale';

export interface QuotationPricing {
  type: PricingType;
  fixed_price?: number;
  negotiable_price?: number;
  wholesale_price?: number;
  delivery_available: boolean;
} 