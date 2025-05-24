export interface ServiceRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget?: number;
  date_range_start?: string;
  date_range_end?: string;
  city: string;
  area: string;
  postal_code: string;
  contact_phone: string;
  images: string[];
  created_at: string;
  status: 'open' | 'closed';
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  subcategory?: string[];
  user_id: string;
  provider_name?: string;
  provider_category?: string;
  provider_subcategory?: string[];
  provider_id?: string;
}

export interface Conversation {
  id: string;
  request_id: string;
  provider_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
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
