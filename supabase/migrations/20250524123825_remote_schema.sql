create extension if not exists "pg_trgm" with schema "extensions";


create table "public"."admin_users" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."admin_users" enable row level security;

create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."community_notes" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "user_id" uuid,
    "title" text not null,
    "content" jsonb not null,
    "images" text[] default '{}'::text[],
    "social_links" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "thumbs_up" integer default 0,
    "thumbs_up_users" uuid[] default '{}'::uuid[]
);


alter table "public"."community_notes" enable row level security;

create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "request_id" uuid not null,
    "provider_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "last_message_at" timestamp with time zone not null default now()
);


alter table "public"."conversations" enable row level security;

create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "date" text not null,
    "time" text not null,
    "location" text not null,
    "description" text not null,
    "image" text not null,
    "attendees" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "approval_status" text not null default 'pending'::text,
    "price_per_person" integer default 0,
    "user_id" uuid
);


alter table "public"."events" enable row level security;

create table "public"."marketplace_listings" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "price" integer not null,
    "category" text not null,
    "condition" text not null,
    "images" text[] default '{}'::text[],
    "seller_name" text not null,
    "seller_rating" numeric default 4.5,
    "seller_phone" text,
    "seller_whatsapp" text,
    "seller_instagram" text,
    "location" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "seller_id" uuid,
    "approval_status" text not null default 'pending'::text,
    "map_link" text,
    "is_negotiable" boolean default false,
    "damage_images" text[] default '{}'::text[],
    "inspection_certificates" text[] default '{}'::text[],
    "model_year" text,
    "postal_code" text not null,
    "seller_role" text not null default 'owner'::text,
    "area" text not null,
    "city" text not null,
    "seller_listing_limit" integer default 5,
    "latitude" numeric,
    "longitude" numeric,
    "shop_images" text[] default '{}'::text[],
    "bill_images" text[] default '{}'::text[],
    "ownership_number" text default '1st'::text
);


alter table "public"."marketplace_listings" enable row level security;

create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "sender_id" uuid not null,
    "sender_type" text not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "read" boolean not null default false,
    "attachments" text[] default '{}'::text[],
    "quotation_price" integer
);


alter table "public"."messages" enable row level security;

create table "public"."note_comments" (
    "id" uuid not null default gen_random_uuid(),
    "note_id" uuid not null,
    "user_id" uuid,
    "content" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."note_comments" enable row level security;

create table "public"."recommendations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "image" text not null,
    "images" text[],
    "category" text not null,
    "description" text not null,
    "address" text not null,
    "rating" numeric default 4.5,
    "price" text,
    "price_level" text,
    "phone" text,
    "website" text,
    "open_now" boolean default false,
    "hours" text,
    "distance" text,
    "tags" text[],
    "city" text,
    "instagram" text,
    "review_count" integer default 0,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."recommendations" enable row level security;

create table "public"."review_criteria" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."seller_listing_limits" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "max_listings" integer not null default 5,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."seller_reviews" (
    "id" uuid not null default gen_random_uuid(),
    "seller_id" uuid not null,
    "reviewer_id" uuid,
    "reviewer_name" text not null,
    "rating" integer not null,
    "comment" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."seller_reviews" enable row level security;

create table "public"."sellers" (
    "id" uuid not null default gen_random_uuid(),
    "seller_id" uuid,
    "seller_name" text not null,
    "seller_phone" text,
    "seller_whatsapp" text,
    "seller_instagram" text,
    "listing_limit" integer default 5,
    "seller_rating" numeric default 4.5,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."sellers" enable row level security;

create table "public"."service_providers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "category" text not null,
    "description" text not null,
    "area" text not null,
    "city" text not null,
    "contact_phone" text not null,
    "whatsapp" text not null,
    "contact_email" text,
    "website" text,
    "instagram" text,
    "map_link" text,
    "price_unit" text default 'per hour'::text,
    "price_range_min" numeric,
    "price_range_max" numeric,
    "availability" text,
    "availability_days" text[],
    "availability_start_time" text,
    "availability_end_time" text,
    "languages" text[],
    "experience" text,
    "tags" text[],
    "images" text[],
    "hours" text,
    "approval_status" text default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "postal_code" text not null,
    "latitude" numeric,
    "longitude" numeric,
    "subcategory" text[],
    "address" text not null default ''::text
);


alter table "public"."service_providers" enable row level security;

create table "public"."service_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "category" text not null,
    "subcategory" text,
    "budget" integer,
    "date_range_start" date,
    "date_range_end" date,
    "city" text not null,
    "area" text not null,
    "postal_code" text not null,
    "contact_phone" text not null,
    "images" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "status" text not null default 'open'::text
);


alter table "public"."service_requests" enable row level security;

create table "public"."subcategories" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (id);

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE INDEX community_notes_location_id_idx ON public.community_notes USING btree (location_id);

CREATE UNIQUE INDEX community_notes_pkey ON public.community_notes USING btree (id);

CREATE INDEX community_notes_user_id_idx ON public.community_notes USING btree (user_id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE INDEX events_user_id_idx ON public.events USING btree (user_id);

CREATE INDEX idx_marketplace_listings_category ON public.marketplace_listings USING btree (category);

CREATE INDEX idx_marketplace_listings_seller_id ON public.marketplace_listings USING btree (seller_id);

CREATE INDEX idx_seller_listing_limits_user_id ON public.seller_listing_limits USING btree (user_id);

CREATE INDEX idx_seller_reviews_rating ON public.seller_reviews USING btree (rating);

CREATE INDEX idx_seller_reviews_seller_id ON public.seller_reviews USING btree (seller_id);

CREATE UNIQUE INDEX marketplace_listings_pkey ON public.marketplace_listings USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX note_comments_note_id_idx ON public.note_comments USING btree (note_id);

CREATE UNIQUE INDEX note_comments_pkey ON public.note_comments USING btree (id);

CREATE UNIQUE INDEX recommendations_pkey ON public.recommendations USING btree (id);

CREATE INDEX review_criteria_category_idx ON public.review_criteria USING btree (category);

CREATE UNIQUE INDEX review_criteria_pkey ON public.review_criteria USING btree (id);

CREATE UNIQUE INDEX seller_listing_limits_pkey ON public.seller_listing_limits USING btree (id);

CREATE UNIQUE INDEX seller_listing_limits_user_id_key ON public.seller_listing_limits USING btree (user_id);

CREATE UNIQUE INDEX seller_reviews_pkey ON public.seller_reviews USING btree (id);

CREATE UNIQUE INDEX sellers_pkey ON public.sellers USING btree (id);

CREATE UNIQUE INDEX service_providers_pkey ON public.service_providers USING btree (id);

CREATE UNIQUE INDEX service_requests_pkey ON public.service_requests USING btree (id);

CREATE UNIQUE INDEX subcategories_category_id_name_key ON public.subcategories USING btree (category_id, name);

CREATE UNIQUE INDEX subcategories_pkey ON public.subcategories USING btree (id);

alter table "public"."admin_users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."community_notes" add constraint "community_notes_pkey" PRIMARY KEY using index "community_notes_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."marketplace_listings" add constraint "marketplace_listings_pkey" PRIMARY KEY using index "marketplace_listings_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."note_comments" add constraint "note_comments_pkey" PRIMARY KEY using index "note_comments_pkey";

alter table "public"."recommendations" add constraint "recommendations_pkey" PRIMARY KEY using index "recommendations_pkey";

alter table "public"."review_criteria" add constraint "review_criteria_pkey" PRIMARY KEY using index "review_criteria_pkey";

alter table "public"."seller_listing_limits" add constraint "seller_listing_limits_pkey" PRIMARY KEY using index "seller_listing_limits_pkey";

alter table "public"."seller_reviews" add constraint "seller_reviews_pkey" PRIMARY KEY using index "seller_reviews_pkey";

alter table "public"."sellers" add constraint "sellers_pkey" PRIMARY KEY using index "sellers_pkey";

alter table "public"."service_providers" add constraint "service_providers_pkey" PRIMARY KEY using index "service_providers_pkey";

alter table "public"."service_requests" add constraint "service_requests_pkey" PRIMARY KEY using index "service_requests_pkey";

alter table "public"."subcategories" add constraint "subcategories_pkey" PRIMARY KEY using index "subcategories_pkey";

alter table "public"."admin_users" add constraint "admin_users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."admin_users" validate constraint "admin_users_id_fkey";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."community_notes" add constraint "community_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."community_notes" validate constraint "community_notes_user_id_fkey";

alter table "public"."conversations" add constraint "conversations_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES service_providers(id) not valid;

alter table "public"."conversations" validate constraint "conversations_provider_id_fkey";

alter table "public"."conversations" add constraint "conversations_request_id_fkey" FOREIGN KEY (request_id) REFERENCES service_requests(id) not valid;

alter table "public"."conversations" validate constraint "conversations_request_id_fkey";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."events" add constraint "events_approval_status_check" CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."events" validate constraint "events_approval_status_check";

alter table "public"."events" add constraint "events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."events" validate constraint "events_user_id_fkey";

alter table "public"."marketplace_listings" add constraint "marketplace_listings_approval_status_check" CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."marketplace_listings" validate constraint "marketplace_listings_approval_status_check";

alter table "public"."marketplace_listings" add constraint "marketplace_listings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) not valid;

alter table "public"."marketplace_listings" validate constraint "marketplace_listings_seller_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."messages" add constraint "messages_sender_type_check" CHECK ((sender_type = ANY (ARRAY['user'::text, 'provider'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_sender_type_check";

alter table "public"."note_comments" add constraint "note_comments_note_id_fkey" FOREIGN KEY (note_id) REFERENCES community_notes(id) ON DELETE CASCADE not valid;

alter table "public"."note_comments" validate constraint "note_comments_note_id_fkey";

alter table "public"."note_comments" add constraint "note_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."note_comments" validate constraint "note_comments_user_id_fkey";

alter table "public"."seller_listing_limits" add constraint "seller_listing_limits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."seller_listing_limits" validate constraint "seller_listing_limits_user_id_fkey";

alter table "public"."seller_listing_limits" add constraint "seller_listing_limits_user_id_key" UNIQUE using index "seller_listing_limits_user_id_key";

alter table "public"."seller_reviews" add constraint "seller_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."seller_reviews" validate constraint "seller_reviews_rating_check";

alter table "public"."sellers" add constraint "sellers_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) not valid;

alter table "public"."sellers" validate constraint "sellers_seller_id_fkey";

alter table "public"."service_providers" add constraint "service_providers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."service_providers" validate constraint "service_providers_user_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."service_requests" validate constraint "service_requests_user_id_fkey";

alter table "public"."subcategories" add constraint "subcategories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."subcategories" validate constraint "subcategories_category_id_fkey";

alter table "public"."subcategories" add constraint "subcategories_category_id_name_key" UNIQUE using index "subcategories_category_id_name_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_service_request_cascade(request_id_param uuid, user_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use a transaction to ensure all operations succeed or fail together
  BEGIN
    -- Step 1: Delete all messages associated with any conversation related to this service request
    DELETE FROM public.messages 
    WHERE conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE request_id = request_id_param
    );
    
    -- Step 2: Delete all conversations related to this service request
    DELETE FROM public.conversations 
    WHERE request_id = request_id_param;
    
    -- Step 3: Delete the service request itself, ensuring it belongs to the user
    DELETE FROM public.service_requests 
    WHERE id = request_id_param AND user_id = user_id_param;
    
    -- If we reach this point without errors, COMMIT is automatic
  EXCEPTION
    WHEN OTHERS THEN
      -- If any error occurs, the transaction will be rolled back
      RAISE EXCEPTION 'Error during cascade delete: %', SQLERRM;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_high_limit_sellers()
 RETURNS TABLE(user_id uuid, max_listings integer, updated_at timestamp with time zone, seller_names text[], seller_phones text[], current_listing_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
    SELECT 
        s.seller_id as user_id,
        s.listing_limit as max_listings,
        s.updated_at,
        ARRAY[s.seller_name] as seller_names,
        ARRAY[CASE WHEN s.seller_phone IS NOT NULL THEN s.seller_phone END] as seller_phones,
        COUNT(DISTINCT ml.id) as current_listing_count
    FROM public.sellers s
    LEFT JOIN public.marketplace_listings ml ON s.seller_id = ml.seller_id
    WHERE s.listing_limit > 5
    GROUP BY s.seller_id, s.listing_limit, s.updated_at, s.seller_name, s.seller_phone;
$function$
;

CREATE OR REPLACE FUNCTION public.get_matching_providers_for_request(request_id uuid)
 RETURNS TABLE(provider_id uuid, provider_name text, provider_category text, provider_subcategory text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as provider_id, 
    sp.name as provider_name,
    sp.category as provider_category,
    -- Convert the first matching subcategory to text for display
    COALESCE(
      (SELECT unnest(sp.subcategory) LIMIT 1), 
      ''
    ) as provider_subcategory,
    sp.user_id
  FROM 
    public.service_providers sp
  JOIN 
    public.service_requests sr ON sr.id = request_id
  WHERE 
    -- Match on category (case insensitive)
    LOWER(sp.category) = LOWER(sr.category) 
    AND (
      -- Match if the service request subcategory exists in the provider's subcategory array
      -- OR if the service request has no subcategory
      sr.subcategory IS NULL
      OR TRIM(sr.subcategory) = ''
      OR EXISTS (
        SELECT 1 FROM unnest(sp.subcategory) sub
        WHERE LOWER(sub) = LOWER(TRIM(sr.subcategory))
      )
    )
    AND sp.approval_status = 'approved';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  count_unread INTEGER;
BEGIN
  SELECT COUNT(m.id) INTO count_unread
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE 
    ((c.user_id = user_uuid AND m.sender_type = 'provider') OR
     (EXISTS (
       SELECT 1 FROM public.service_providers sp
       WHERE sp.id = c.provider_id AND sp.user_id = user_uuid AND m.sender_type = 'user'
     ))) AND
    m.read = FALSE;
  
  RETURN count_unread;
END;
$function$
;

create or replace view "public"."high_limit_sellers" as  SELECT s.seller_id AS user_id,
    s.listing_limit AS max_listings,
    s.updated_at,
    ARRAY[s.seller_name] AS seller_names,
    ARRAY[
        CASE
            WHEN (s.seller_phone IS NOT NULL) THEN s.seller_phone
            ELSE NULL::text
        END] AS seller_phones,
    count(DISTINCT ml.id) AS current_listing_count
   FROM (sellers s
     LEFT JOIN marketplace_listings ml ON ((s.seller_id = ml.seller_id)))
  WHERE (s.listing_limit > 5)
  GROUP BY s.seller_id, s.listing_limit, s.updated_at, s.seller_name, s.seller_phone;


CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_enhanced_listings(search_query text)
 RETURNS TABLE(id uuid, title text, description text, price integer, category text, condition text, model_year text, location text, map_link text, seller_name text, seller_id uuid, seller_phone text, seller_whatsapp text, seller_instagram text, seller_rating numeric, review_count integer, images text[], created_at timestamp with time zone, approval_status text, is_negotiable boolean, search_rank real)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id, ml.title, ml.description, ml.price, ml.category,
    ml.condition, ml.model_year, ml.location, ml.map_link,
    ml.seller_name, ml.seller_id, ml.seller_phone, ml.seller_whatsapp,
    ml.seller_instagram, ml.seller_rating,
    COALESCE((SELECT COUNT(*) FROM seller_reviews sr WHERE sr.seller_id = ml.seller_id), 0)::integer as review_count,
    ml.images, ml.created_at, ml.approval_status, ml.is_negotiable,
    (
      extensions.similarity(ml.title, search_query) * 5 +
      CASE WHEN ml.model_year ILIKE search_query THEN 10 
           WHEN search_query ILIKE '%' || ml.model_year || '%' THEN 8
           ELSE 0 END +
      extensions.similarity(ml.description, search_query) * 3 +
      extensions.similarity(ml.category, search_query) * 4 +
      extensions.similarity(ml.condition, search_query) * 3 +
      CASE WHEN ml.location IS NOT NULL THEN extensions.similarity(ml.location, search_query) * 2 ELSE 0 END
    )::real AS search_rank
  FROM marketplace_listings ml
  WHERE 
    (
      EXISTS (
        WITH search_words AS (
          SELECT regexp_split_to_table(lower(search_query), '\s+') AS word
        )
        SELECT 1
        FROM search_words
        WHERE
          (lower(ml.title) LIKE '%' || word || '%') OR
          (lower(ml.description) LIKE '%' || word || '%') OR
          (lower(ml.category) LIKE '%' || word || '%') OR
          (lower(ml.condition) LIKE '%' || word || '%') OR
          (ml.model_year IS NOT NULL AND lower(ml.model_year) LIKE '%' || word || '%') OR
          (ml.location IS NOT NULL AND lower(ml.location) LIKE '%' || word || '%')
        GROUP BY 1
        HAVING COUNT(*) = (SELECT COUNT(*) FROM search_words)
      )
      OR ml.title ILIKE '%' || search_query || '%'
      OR ml.description ILIKE '%' || search_query || '%'
      OR ml.category ILIKE '%' || search_query || '%'
      OR ml.condition ILIKE '%' || search_query || '%'
      OR ml.model_year ILIKE '%' || search_query || '%'
      OR ml.location ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 
        FROM seller_reviews sr 
        WHERE sr.seller_id = ml.seller_id AND sr.comment ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY search_rank DESC, ml.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_enhanced_providers(search_query text)
 RETURNS TABLE(id uuid, name text, category text, description text, address text, area text, city text, contact_phone text, contact_email text, website text, instagram text, map_link text, price_range_min numeric, price_range_max numeric, price_unit text, availability text, availability_days text[], availability_start_time text, availability_end_time text, tags text[], images text[], hours text, languages text[], experience text, created_at timestamp with time zone, approval_status text, search_rank real)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.category,
    sp.description,
    sp.address,
    sp.area,
    sp.city,
    sp.contact_phone,
    sp.contact_email,
    sp.website,
    sp.instagram,
    sp.map_link,
    sp.price_range_min,
    sp.price_range_max,
    sp.price_unit,
    sp.availability,
    sp.availability_days,
    sp.availability_start_time,
    sp.availability_end_time,
    sp.tags,
    sp.images,
    sp.hours,
    sp.languages,
    sp.experience,
    sp.created_at,
    sp.approval_status,
    (
      -- Words in name have highest weight
      extensions.similarity(sp.name, search_query) * 5 +
      -- Words in description
      extensions.similarity(sp.description, search_query) * 3 +
      -- Category match
      extensions.similarity(sp.category, search_query) * 4 +
      -- Area and city match
      extensions.similarity(sp.area, search_query) * 2 +
      extensions.similarity(sp.city, search_query) * 2 +
      -- Tag matches
      CASE WHEN EXISTS (
        SELECT 1 FROM unnest(sp.tags) AS tag 
        WHERE tag ILIKE '%' || search_query || '%'
      ) THEN 3 ELSE 0 END
    )::real AS search_rank
  FROM service_providers sp
  WHERE 
    sp.approval_status = 'approved' AND
    (
      -- Check if all words in search query appear in any order
      EXISTS (
        WITH search_words AS (
          SELECT regexp_split_to_table(lower(search_query), '\s+') AS word
        )
        SELECT 1
        FROM search_words
        WHERE
          (lower(sp.name) LIKE '%' || word || '%') OR
          (lower(sp.description) LIKE '%' || word || '%') OR
          (lower(sp.category) LIKE '%' || word || '%') OR
          (lower(sp.area) LIKE '%' || word || '%') OR
          (lower(sp.city) LIKE '%' || word || '%') OR
          EXISTS (
            SELECT 1 FROM unnest(sp.tags) AS tag 
            WHERE lower(tag) LIKE '%' || word || '%'
          )
        GROUP BY 1
        HAVING COUNT(*) = (SELECT COUNT(*) FROM search_words)
      )
      -- Direct matches get priority
      OR sp.name ILIKE '%' || search_query || '%'
      OR sp.description ILIKE '%' || search_query || '%'
      OR sp.category ILIKE '%' || search_query || '%'
      OR sp.area ILIKE '%' || search_query || '%'
      OR sp.city ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(sp.tags) AS tag 
        WHERE tag ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY search_rank DESC, sp.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_recommendations(search_query text, category_filter text DEFAULT 'all'::text)
 RETURNS TABLE(id uuid, name text, image text, images text[], category text, description text, address text, rating numeric, price text, price_level text, phone text, website text, open_now boolean, hours text, distance text, tags text[], city text, instagram text, review_count integer, similarity real)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.name, r.image, r.images, r.category,
    r.description, r.address, r.rating, r.price,
    r.price_level, r.phone, r.website, r.open_now,
    r.hours, r.distance, r.tags, r.city,
    r.instagram, r.review_count,
    (
      extensions.similarity(r.name, search_query) * 5 +
      extensions.similarity(r.description, search_query) * 3 +
      CASE WHEN r.city ILIKE '%' || search_query || '%' THEN 3 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM unnest(r.tags) AS tag 
        WHERE tag ILIKE '%' || search_query || '%'
      ) THEN 2 ELSE 0 END +
      extensions.similarity(r.category, search_query) * 4
    ) AS similarity
  FROM recommendations r
  WHERE 
    (
      r.name ILIKE '%' || search_query || '%' OR
      r.description ILIKE '%' || search_query || '%' OR
      r.address ILIKE '%' || search_query || '%' OR
      r.category ILIKE '%' || search_query || '%' OR
      r.city ILIKE '%' || search_query || '%' OR
      EXISTS (
        SELECT 1 FROM unnest(r.tags) AS tag 
        WHERE tag ILIKE '%' || search_query || '%'
      )
    )
    AND (category_filter = 'all' OR LOWER(r.category) = LOWER(category_filter))
  ORDER BY similarity DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_suggestions(search_term text)
 RETURNS TABLE(suggestion text, category text, source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Return suggestions from recommendations
  RETURN QUERY
  -- Get matches from place names
  SELECT DISTINCT name, category, 'place' 
  FROM recommendations 
  WHERE name ILIKE '%' || search_term || '%'
  -- Get matches from place categories
  UNION 
  SELECT DISTINCT category, category, 'category'
  FROM recommendations
  WHERE category ILIKE '%' || search_term || '%'
  -- Get matches from place tags
  UNION
  SELECT DISTINCT tag, category, 'tag'
  FROM recommendations, unnest(tags) AS tag
  WHERE tag ILIKE '%' || search_term || '%'
  -- Get matches from cities/locations
  UNION
  SELECT DISTINCT city, 'location', 'city'
  FROM recommendations
  WHERE city IS NOT NULL AND city ILIKE '%' || search_term || '%'
  -- Get matches from place descriptions
  UNION
  SELECT DISTINCT 
    CASE 
      WHEN LENGTH(description) > 50 
      THEN substring(description from 1 for 50) || '...' 
      ELSE description 
    END, 
    category, 'description'
  FROM recommendations
  WHERE description ILIKE '%' || search_term || '%'
  -- Get matches from event titles
  UNION
  SELECT DISTINCT title, 'Events', 'event'
  FROM events
  WHERE title ILIKE '%' || search_term || '%'
  ORDER BY category, suggestion
  LIMIT 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_seller_listing_limit(admin_user_id uuid, target_seller_phone text, new_limit integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the user making the request is an admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = admin_user_id
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;

  -- Update the seller's listing limit
  UPDATE sellers
  SET 
    listing_limit = new_limit,
    updated_at = NOW()
  WHERE seller_phone = target_seller_phone;

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_seller_listing_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    -- Insert or update seller listing limits when a marketplace listing is created
    INSERT INTO public.seller_listing_limits (user_id, max_listings)
    VALUES (NEW.seller_id, 5)  -- Default to 5 listings
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_users" to "anon";

grant insert on table "public"."admin_users" to "anon";

grant references on table "public"."admin_users" to "anon";

grant select on table "public"."admin_users" to "anon";

grant trigger on table "public"."admin_users" to "anon";

grant truncate on table "public"."admin_users" to "anon";

grant update on table "public"."admin_users" to "anon";

grant delete on table "public"."admin_users" to "authenticated";

grant insert on table "public"."admin_users" to "authenticated";

grant references on table "public"."admin_users" to "authenticated";

grant select on table "public"."admin_users" to "authenticated";

grant trigger on table "public"."admin_users" to "authenticated";

grant truncate on table "public"."admin_users" to "authenticated";

grant update on table "public"."admin_users" to "authenticated";

grant delete on table "public"."admin_users" to "service_role";

grant insert on table "public"."admin_users" to "service_role";

grant references on table "public"."admin_users" to "service_role";

grant select on table "public"."admin_users" to "service_role";

grant trigger on table "public"."admin_users" to "service_role";

grant truncate on table "public"."admin_users" to "service_role";

grant update on table "public"."admin_users" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."community_notes" to "anon";

grant insert on table "public"."community_notes" to "anon";

grant references on table "public"."community_notes" to "anon";

grant select on table "public"."community_notes" to "anon";

grant trigger on table "public"."community_notes" to "anon";

grant truncate on table "public"."community_notes" to "anon";

grant update on table "public"."community_notes" to "anon";

grant delete on table "public"."community_notes" to "authenticated";

grant insert on table "public"."community_notes" to "authenticated";

grant references on table "public"."community_notes" to "authenticated";

grant select on table "public"."community_notes" to "authenticated";

grant trigger on table "public"."community_notes" to "authenticated";

grant truncate on table "public"."community_notes" to "authenticated";

grant update on table "public"."community_notes" to "authenticated";

grant delete on table "public"."community_notes" to "service_role";

grant insert on table "public"."community_notes" to "service_role";

grant references on table "public"."community_notes" to "service_role";

grant select on table "public"."community_notes" to "service_role";

grant trigger on table "public"."community_notes" to "service_role";

grant truncate on table "public"."community_notes" to "service_role";

grant update on table "public"."community_notes" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."marketplace_listings" to "anon";

grant insert on table "public"."marketplace_listings" to "anon";

grant references on table "public"."marketplace_listings" to "anon";

grant select on table "public"."marketplace_listings" to "anon";

grant trigger on table "public"."marketplace_listings" to "anon";

grant truncate on table "public"."marketplace_listings" to "anon";

grant update on table "public"."marketplace_listings" to "anon";

grant delete on table "public"."marketplace_listings" to "authenticated";

grant insert on table "public"."marketplace_listings" to "authenticated";

grant references on table "public"."marketplace_listings" to "authenticated";

grant select on table "public"."marketplace_listings" to "authenticated";

grant trigger on table "public"."marketplace_listings" to "authenticated";

grant truncate on table "public"."marketplace_listings" to "authenticated";

grant update on table "public"."marketplace_listings" to "authenticated";

grant delete on table "public"."marketplace_listings" to "service_role";

grant insert on table "public"."marketplace_listings" to "service_role";

grant references on table "public"."marketplace_listings" to "service_role";

grant select on table "public"."marketplace_listings" to "service_role";

grant trigger on table "public"."marketplace_listings" to "service_role";

grant truncate on table "public"."marketplace_listings" to "service_role";

grant update on table "public"."marketplace_listings" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."note_comments" to "anon";

grant insert on table "public"."note_comments" to "anon";

grant references on table "public"."note_comments" to "anon";

grant select on table "public"."note_comments" to "anon";

grant trigger on table "public"."note_comments" to "anon";

grant truncate on table "public"."note_comments" to "anon";

grant update on table "public"."note_comments" to "anon";

grant delete on table "public"."note_comments" to "authenticated";

grant insert on table "public"."note_comments" to "authenticated";

grant references on table "public"."note_comments" to "authenticated";

grant select on table "public"."note_comments" to "authenticated";

grant trigger on table "public"."note_comments" to "authenticated";

grant truncate on table "public"."note_comments" to "authenticated";

grant update on table "public"."note_comments" to "authenticated";

grant delete on table "public"."note_comments" to "service_role";

grant insert on table "public"."note_comments" to "service_role";

grant references on table "public"."note_comments" to "service_role";

grant select on table "public"."note_comments" to "service_role";

grant trigger on table "public"."note_comments" to "service_role";

grant truncate on table "public"."note_comments" to "service_role";

grant update on table "public"."note_comments" to "service_role";

grant delete on table "public"."recommendations" to "anon";

grant insert on table "public"."recommendations" to "anon";

grant references on table "public"."recommendations" to "anon";

grant select on table "public"."recommendations" to "anon";

grant trigger on table "public"."recommendations" to "anon";

grant truncate on table "public"."recommendations" to "anon";

grant update on table "public"."recommendations" to "anon";

grant delete on table "public"."recommendations" to "authenticated";

grant insert on table "public"."recommendations" to "authenticated";

grant references on table "public"."recommendations" to "authenticated";

grant select on table "public"."recommendations" to "authenticated";

grant trigger on table "public"."recommendations" to "authenticated";

grant truncate on table "public"."recommendations" to "authenticated";

grant update on table "public"."recommendations" to "authenticated";

grant delete on table "public"."recommendations" to "service_role";

grant insert on table "public"."recommendations" to "service_role";

grant references on table "public"."recommendations" to "service_role";

grant select on table "public"."recommendations" to "service_role";

grant trigger on table "public"."recommendations" to "service_role";

grant truncate on table "public"."recommendations" to "service_role";

grant update on table "public"."recommendations" to "service_role";

grant delete on table "public"."review_criteria" to "anon";

grant insert on table "public"."review_criteria" to "anon";

grant references on table "public"."review_criteria" to "anon";

grant select on table "public"."review_criteria" to "anon";

grant trigger on table "public"."review_criteria" to "anon";

grant truncate on table "public"."review_criteria" to "anon";

grant update on table "public"."review_criteria" to "anon";

grant delete on table "public"."review_criteria" to "authenticated";

grant insert on table "public"."review_criteria" to "authenticated";

grant references on table "public"."review_criteria" to "authenticated";

grant select on table "public"."review_criteria" to "authenticated";

grant trigger on table "public"."review_criteria" to "authenticated";

grant truncate on table "public"."review_criteria" to "authenticated";

grant update on table "public"."review_criteria" to "authenticated";

grant delete on table "public"."review_criteria" to "service_role";

grant insert on table "public"."review_criteria" to "service_role";

grant references on table "public"."review_criteria" to "service_role";

grant select on table "public"."review_criteria" to "service_role";

grant trigger on table "public"."review_criteria" to "service_role";

grant truncate on table "public"."review_criteria" to "service_role";

grant update on table "public"."review_criteria" to "service_role";

grant delete on table "public"."seller_listing_limits" to "anon";

grant insert on table "public"."seller_listing_limits" to "anon";

grant references on table "public"."seller_listing_limits" to "anon";

grant select on table "public"."seller_listing_limits" to "anon";

grant trigger on table "public"."seller_listing_limits" to "anon";

grant truncate on table "public"."seller_listing_limits" to "anon";

grant update on table "public"."seller_listing_limits" to "anon";

grant delete on table "public"."seller_listing_limits" to "authenticated";

grant insert on table "public"."seller_listing_limits" to "authenticated";

grant references on table "public"."seller_listing_limits" to "authenticated";

grant select on table "public"."seller_listing_limits" to "authenticated";

grant trigger on table "public"."seller_listing_limits" to "authenticated";

grant truncate on table "public"."seller_listing_limits" to "authenticated";

grant update on table "public"."seller_listing_limits" to "authenticated";

grant delete on table "public"."seller_listing_limits" to "service_role";

grant insert on table "public"."seller_listing_limits" to "service_role";

grant references on table "public"."seller_listing_limits" to "service_role";

grant select on table "public"."seller_listing_limits" to "service_role";

grant trigger on table "public"."seller_listing_limits" to "service_role";

grant truncate on table "public"."seller_listing_limits" to "service_role";

grant update on table "public"."seller_listing_limits" to "service_role";

grant delete on table "public"."seller_reviews" to "anon";

grant insert on table "public"."seller_reviews" to "anon";

grant references on table "public"."seller_reviews" to "anon";

grant select on table "public"."seller_reviews" to "anon";

grant trigger on table "public"."seller_reviews" to "anon";

grant truncate on table "public"."seller_reviews" to "anon";

grant update on table "public"."seller_reviews" to "anon";

grant delete on table "public"."seller_reviews" to "authenticated";

grant insert on table "public"."seller_reviews" to "authenticated";

grant references on table "public"."seller_reviews" to "authenticated";

grant select on table "public"."seller_reviews" to "authenticated";

grant trigger on table "public"."seller_reviews" to "authenticated";

grant truncate on table "public"."seller_reviews" to "authenticated";

grant update on table "public"."seller_reviews" to "authenticated";

grant delete on table "public"."seller_reviews" to "service_role";

grant insert on table "public"."seller_reviews" to "service_role";

grant references on table "public"."seller_reviews" to "service_role";

grant select on table "public"."seller_reviews" to "service_role";

grant trigger on table "public"."seller_reviews" to "service_role";

grant truncate on table "public"."seller_reviews" to "service_role";

grant update on table "public"."seller_reviews" to "service_role";

grant delete on table "public"."sellers" to "anon";

grant insert on table "public"."sellers" to "anon";

grant references on table "public"."sellers" to "anon";

grant select on table "public"."sellers" to "anon";

grant trigger on table "public"."sellers" to "anon";

grant truncate on table "public"."sellers" to "anon";

grant update on table "public"."sellers" to "anon";

grant delete on table "public"."sellers" to "authenticated";

grant insert on table "public"."sellers" to "authenticated";

grant references on table "public"."sellers" to "authenticated";

grant select on table "public"."sellers" to "authenticated";

grant trigger on table "public"."sellers" to "authenticated";

grant truncate on table "public"."sellers" to "authenticated";

grant update on table "public"."sellers" to "authenticated";

grant delete on table "public"."sellers" to "service_role";

grant insert on table "public"."sellers" to "service_role";

grant references on table "public"."sellers" to "service_role";

grant select on table "public"."sellers" to "service_role";

grant trigger on table "public"."sellers" to "service_role";

grant truncate on table "public"."sellers" to "service_role";

grant update on table "public"."sellers" to "service_role";

grant delete on table "public"."service_providers" to "anon";

grant insert on table "public"."service_providers" to "anon";

grant references on table "public"."service_providers" to "anon";

grant select on table "public"."service_providers" to "anon";

grant trigger on table "public"."service_providers" to "anon";

grant truncate on table "public"."service_providers" to "anon";

grant update on table "public"."service_providers" to "anon";

grant delete on table "public"."service_providers" to "authenticated";

grant insert on table "public"."service_providers" to "authenticated";

grant references on table "public"."service_providers" to "authenticated";

grant select on table "public"."service_providers" to "authenticated";

grant trigger on table "public"."service_providers" to "authenticated";

grant truncate on table "public"."service_providers" to "authenticated";

grant update on table "public"."service_providers" to "authenticated";

grant delete on table "public"."service_providers" to "service_role";

grant insert on table "public"."service_providers" to "service_role";

grant references on table "public"."service_providers" to "service_role";

grant select on table "public"."service_providers" to "service_role";

grant trigger on table "public"."service_providers" to "service_role";

grant truncate on table "public"."service_providers" to "service_role";

grant update on table "public"."service_providers" to "service_role";

grant delete on table "public"."service_requests" to "anon";

grant insert on table "public"."service_requests" to "anon";

grant references on table "public"."service_requests" to "anon";

grant select on table "public"."service_requests" to "anon";

grant trigger on table "public"."service_requests" to "anon";

grant truncate on table "public"."service_requests" to "anon";

grant update on table "public"."service_requests" to "anon";

grant delete on table "public"."service_requests" to "authenticated";

grant insert on table "public"."service_requests" to "authenticated";

grant references on table "public"."service_requests" to "authenticated";

grant select on table "public"."service_requests" to "authenticated";

grant trigger on table "public"."service_requests" to "authenticated";

grant truncate on table "public"."service_requests" to "authenticated";

grant update on table "public"."service_requests" to "authenticated";

grant delete on table "public"."service_requests" to "service_role";

grant insert on table "public"."service_requests" to "service_role";

grant references on table "public"."service_requests" to "service_role";

grant select on table "public"."service_requests" to "service_role";

grant trigger on table "public"."service_requests" to "service_role";

grant truncate on table "public"."service_requests" to "service_role";

grant update on table "public"."service_requests" to "service_role";

grant delete on table "public"."subcategories" to "anon";

grant insert on table "public"."subcategories" to "anon";

grant references on table "public"."subcategories" to "anon";

grant select on table "public"."subcategories" to "anon";

grant trigger on table "public"."subcategories" to "anon";

grant truncate on table "public"."subcategories" to "anon";

grant update on table "public"."subcategories" to "anon";

grant delete on table "public"."subcategories" to "authenticated";

grant insert on table "public"."subcategories" to "authenticated";

grant references on table "public"."subcategories" to "authenticated";

grant select on table "public"."subcategories" to "authenticated";

grant trigger on table "public"."subcategories" to "authenticated";

grant truncate on table "public"."subcategories" to "authenticated";

grant update on table "public"."subcategories" to "authenticated";

grant delete on table "public"."subcategories" to "service_role";

grant insert on table "public"."subcategories" to "service_role";

grant references on table "public"."subcategories" to "service_role";

grant select on table "public"."subcategories" to "service_role";

grant trigger on table "public"."subcategories" to "service_role";

grant truncate on table "public"."subcategories" to "service_role";

grant update on table "public"."subcategories" to "service_role";

create policy "Admins can view admin_users"
on "public"."admin_users"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM admin_users admin_users_1
  WHERE (admin_users_1.id = auth.uid()))));


create policy "Anyone can view community notes"
on "public"."community_notes"
as permissive
for select
to public
using (true);


create policy "Authenticated users can create community notes"
on "public"."community_notes"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "Users can delete their own community notes"
on "public"."community_notes"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own community notes"
on "public"."community_notes"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can create conversations if they own the request or provi"
on "public"."conversations"
as permissive
for insert
to public
with check (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM service_providers
  WHERE ((service_providers.id = conversations.provider_id) AND (service_providers.user_id = auth.uid()))))));


create policy "Users can view their own conversations"
on "public"."conversations"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM service_providers
  WHERE ((service_providers.id = conversations.provider_id) AND (service_providers.user_id = auth.uid()))))));


create policy "Admins can update events"
on "public"."events"
as permissive
for update
to public
using ((is_admin() = true));


create policy "Allow public read access"
on "public"."events"
as permissive
for select
to public
using (true);


create policy "Only approved events are viewable by everyone"
on "public"."events"
as permissive
for select
to public
using (((approval_status = 'approved'::text) OR (is_admin() = true)));


create policy "Users can delete their own events"
on "public"."events"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own events"
on "public"."events"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can select their own events"
on "public"."events"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own events"
on "public"."events"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Admins can update marketplace_listings"
on "public"."marketplace_listings"
as permissive
for update
to public
using ((is_admin() = true));


create policy "Only approved marketplace_listings are viewable by non-owners"
on "public"."marketplace_listings"
as permissive
for select
to public
using (((approval_status = 'approved'::text) OR (seller_id = auth.uid()) OR (is_admin() = true)));


create policy "Public can view all marketplace listings"
on "public"."marketplace_listings"
as permissive
for select
to public
using (true);


create policy "Users can create their own marketplace listings"
on "public"."marketplace_listings"
as permissive
for insert
to public
with check ((seller_id = auth.uid()));


create policy "Users can delete their own marketplace listings"
on "public"."marketplace_listings"
as permissive
for delete
to public
using ((seller_id = auth.uid()));


create policy "Users can update their own marketplace listings"
on "public"."marketplace_listings"
as permissive
for update
to public
using ((seller_id = auth.uid()));


create policy "Users can view their own marketplace listings"
on "public"."marketplace_listings"
as permissive
for select
to public
using (((seller_id = auth.uid()) OR (seller_id IS NULL)));


create policy "Users can insert messages in their conversations"
on "public"."messages"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM service_providers sp
          WHERE ((sp.id = c.provider_id) AND (sp.user_id = auth.uid())))))))));


create policy "Users can insert messages"
on "public"."messages"
as permissive
for insert
to authenticated
with check (((auth.uid() = sender_id) AND (((sender_type = 'user'::text) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid()))))) OR ((sender_type = 'provider'::text) AND (EXISTS ( SELECT 1
   FROM (conversations c
     JOIN service_providers sp ON ((c.provider_id = sp.id)))
  WHERE ((c.id = messages.conversation_id) AND (sp.user_id = auth.uid()))))))));


create policy "Users can update messages"
on "public"."messages"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (conversations c
     JOIN service_providers sp ON ((c.provider_id = sp.id)))
  WHERE ((c.id = messages.conversation_id) AND (sp.user_id = auth.uid()))))));


create policy "Users can view messages in their conversations"
on "public"."messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM service_providers sp
          WHERE ((sp.id = c.provider_id) AND (sp.user_id = auth.uid())))))))));


create policy "Users can view messages"
on "public"."messages"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (conversations c
     JOIN service_providers sp ON ((c.provider_id = sp.id)))
  WHERE ((c.id = messages.conversation_id) AND (sp.user_id = auth.uid()))))));


create policy "Anyone can read note comments"
on "public"."note_comments"
as permissive
for select
to public
using (true);


create policy "Authenticated users can create comments"
on "public"."note_comments"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can delete their own comments"
on "public"."note_comments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own comments"
on "public"."note_comments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Allow public read access"
on "public"."recommendations"
as permissive
for select
to public
using (true);


create policy "Anyone can view reviews"
on "public"."seller_reviews"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can delete their own reviews"
on "public"."seller_reviews"
as permissive
for delete
to authenticated
using ((reviewer_id = auth.uid()));


create policy "Users can insert reviews"
on "public"."seller_reviews"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can update their own reviews"
on "public"."seller_reviews"
as permissive
for update
to authenticated
using ((reviewer_id = auth.uid()));


create policy "Sellers are viewable by everyone"
on "public"."sellers"
as permissive
for select
to public
using (true);


create policy "Users can insert their own seller profile"
on "public"."sellers"
as permissive
for insert
to public
with check ((auth.uid() = seller_id));


create policy "Users can update their own seller profile"
on "public"."sellers"
as permissive
for update
to public
using ((auth.uid() = seller_id));


create policy "Admins can delete any service provider"
on "public"."service_providers"
as permissive
for delete
to public
using (is_admin());


create policy "Admins can update any service provider"
on "public"."service_providers"
as permissive
for update
to public
using (is_admin());


create policy "Users can delete their own service_providers"
on "public"."service_providers"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own service_providers"
on "public"."service_providers"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own service_providers"
on "public"."service_providers"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view all service_providers"
on "public"."service_providers"
as permissive
for select
to public
using (true);


create policy "Users can create their own requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own requests"
on "public"."service_requests"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own requests"
on "public"."service_requests"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own requests"
on "public"."service_requests"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_seller_listing_limits_trigger AFTER INSERT ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_seller_listing_limits();

CREATE TRIGGER update_conversation_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();


