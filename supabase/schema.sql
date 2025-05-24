

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") IS 'Securely deletes a service request and all related conversations and messages in a transaction.
The user_id parameter ensures only the owner can delete their service requests.';



CREATE OR REPLACE FUNCTION "public"."get_high_limit_sellers"() RETURNS TABLE("user_id" "uuid", "max_listings" integer, "updated_at" timestamp with time zone, "seller_names" "text"[], "seller_phones" "text"[], "current_listing_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_high_limit_sellers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid") RETURNS TABLE("provider_id" "uuid", "provider_name" "text", "provider_category" "text", "provider_subcategory" "text", "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_enhanced_listings"("search_query" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "price" integer, "category" "text", "condition" "text", "model_year" "text", "location" "text", "map_link" "text", "seller_name" "text", "seller_id" "uuid", "seller_phone" "text", "seller_whatsapp" "text", "seller_instagram" "text", "seller_rating" numeric, "review_count" integer, "images" "text"[], "created_at" timestamp with time zone, "approval_status" "text", "is_negotiable" boolean, "search_rank" real)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."search_enhanced_listings"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_enhanced_providers"("search_query" "text") RETURNS TABLE("id" "uuid", "name" "text", "category" "text", "description" "text", "address" "text", "area" "text", "city" "text", "contact_phone" "text", "contact_email" "text", "website" "text", "instagram" "text", "map_link" "text", "price_range_min" numeric, "price_range_max" numeric, "price_unit" "text", "availability" "text", "availability_days" "text"[], "availability_start_time" "text", "availability_end_time" "text", "tags" "text"[], "images" "text"[], "hours" "text", "languages" "text"[], "experience" "text", "created_at" timestamp with time zone, "approval_status" "text", "search_rank" real)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."search_enhanced_providers"("search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_recommendations"("search_query" "text", "category_filter" "text" DEFAULT 'all'::"text") RETURNS TABLE("id" "uuid", "name" "text", "image" "text", "images" "text"[], "category" "text", "description" "text", "address" "text", "rating" numeric, "price" "text", "price_level" "text", "phone" "text", "website" "text", "open_now" boolean, "hours" "text", "distance" "text", "tags" "text"[], "city" "text", "instagram" "text", "review_count" integer, "similarity" real)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."search_recommendations"("search_query" "text", "category_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_suggestions"("search_term" "text") RETURNS TABLE("suggestion" "text", "category" "text", "source" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."search_suggestions"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seller_listing_limit"("admin_user_id" "uuid", "target_seller_phone" "text", "new_limit" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."update_seller_listing_limit"("admin_user_id" "uuid", "target_seller_phone" "text", "new_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seller_listing_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
    -- Insert or update seller listing limits when a marketplace listing is created
    INSERT INTO public.seller_listing_limits (user_id, max_listings)
    VALUES (NEW.seller_id, 5)  -- Default to 5 listings
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_seller_listing_limits"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "thumbs_up" integer DEFAULT 0,
    "thumbs_up_users" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."community_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "date" "text" NOT NULL,
    "time" "text" NOT NULL,
    "location" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image" "text" NOT NULL,
    "attendees" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approval_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "price_per_person" integer DEFAULT 0,
    "user_id" "uuid",
    CONSTRAINT "events_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" integer NOT NULL,
    "category" "text" NOT NULL,
    "condition" "text" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "seller_name" "text" NOT NULL,
    "seller_rating" numeric DEFAULT 4.5,
    "seller_phone" "text",
    "seller_whatsapp" "text",
    "seller_instagram" "text",
    "location" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seller_id" "uuid",
    "approval_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "map_link" "text",
    "is_negotiable" boolean DEFAULT false,
    "damage_images" "text"[] DEFAULT '{}'::"text"[],
    "inspection_certificates" "text"[] DEFAULT '{}'::"text"[],
    "model_year" "text",
    "postal_code" "text" NOT NULL,
    "seller_role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "area" "text" NOT NULL,
    "city" "text" NOT NULL,
    "seller_listing_limit" integer DEFAULT 5,
    "latitude" numeric,
    "longitude" numeric,
    "shop_images" "text"[] DEFAULT '{}'::"text"[],
    "bill_images" "text"[] DEFAULT '{}'::"text"[],
    "ownership_number" "text" DEFAULT '1st'::"text",
    CONSTRAINT "marketplace_listings_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."marketplace_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sellers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid",
    "seller_name" "text" NOT NULL,
    "seller_phone" "text",
    "seller_whatsapp" "text",
    "seller_instagram" "text",
    "listing_limit" integer DEFAULT 5,
    "seller_rating" numeric DEFAULT 4.5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sellers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."high_limit_sellers" AS
 SELECT "s"."seller_id" AS "user_id",
    "s"."listing_limit" AS "max_listings",
    "s"."updated_at",
    ARRAY["s"."seller_name"] AS "seller_names",
    ARRAY[
        CASE
            WHEN ("s"."seller_phone" IS NOT NULL) THEN "s"."seller_phone"
            ELSE NULL::"text"
        END] AS "seller_phones",
    "count"(DISTINCT "ml"."id") AS "current_listing_count"
   FROM ("public"."sellers" "s"
     LEFT JOIN "public"."marketplace_listings" "ml" ON (("s"."seller_id" = "ml"."seller_id")))
  WHERE ("s"."listing_limit" > 5)
  GROUP BY "s"."seller_id", "s"."listing_limit", "s"."updated_at", "s"."seller_name", "s"."seller_phone";


ALTER TABLE "public"."high_limit_sellers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "attachments" "text"[] DEFAULT '{}'::"text"[],
    "quotation_price" integer,
    CONSTRAINT "messages_sender_type_check" CHECK (("sender_type" = ANY (ARRAY['user'::"text", 'provider'::"text"])))
);

ALTER TABLE ONLY "public"."messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "image" "text" NOT NULL,
    "images" "text"[],
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "address" "text" NOT NULL,
    "rating" numeric DEFAULT 4.5,
    "price" "text",
    "price_level" "text",
    "phone" "text",
    "website" "text",
    "open_now" boolean DEFAULT false,
    "hours" "text",
    "distance" "text",
    "tags" "text"[],
    "city" "text",
    "instagram" "text",
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_criteria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."review_criteria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_listing_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "max_listings" integer DEFAULT 5 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seller_listing_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "reviewer_id" "uuid",
    "reviewer_name" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seller_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."seller_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "area" "text" NOT NULL,
    "city" "text" NOT NULL,
    "contact_phone" "text" NOT NULL,
    "whatsapp" "text" NOT NULL,
    "contact_email" "text",
    "website" "text",
    "instagram" "text",
    "map_link" "text",
    "price_unit" "text" DEFAULT 'per hour'::"text",
    "price_range_min" numeric,
    "price_range_max" numeric,
    "availability" "text",
    "availability_days" "text"[],
    "availability_start_time" "text",
    "availability_end_time" "text",
    "languages" "text"[],
    "experience" "text",
    "tags" "text"[],
    "images" "text"[],
    "hours" "text",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "postal_code" "text" NOT NULL,
    "latitude" numeric,
    "longitude" numeric,
    "subcategory" "text"[],
    "address" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."service_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "budget" integer,
    "date_range_start" "date",
    "date_range_end" "date",
    "city" "text" NOT NULL,
    "area" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "contact_phone" "text" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL
);

ALTER TABLE ONLY "public"."service_requests" REPLICA IDENTITY FULL;


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subcategories" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_notes"
    ADD CONSTRAINT "community_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_comments"
    ADD CONSTRAINT "note_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_criteria"
    ADD CONSTRAINT "review_criteria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_listing_limits"
    ADD CONSTRAINT "seller_listing_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_listing_limits"
    ADD CONSTRAINT "seller_listing_limits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."seller_reviews"
    ADD CONSTRAINT "seller_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_providers"
    ADD CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");



CREATE INDEX "community_notes_location_id_idx" ON "public"."community_notes" USING "btree" ("location_id");



CREATE INDEX "community_notes_user_id_idx" ON "public"."community_notes" USING "btree" ("user_id");



CREATE INDEX "events_user_id_idx" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_marketplace_listings_category" ON "public"."marketplace_listings" USING "btree" ("category");



CREATE INDEX "idx_marketplace_listings_seller_id" ON "public"."marketplace_listings" USING "btree" ("seller_id");



CREATE INDEX "idx_seller_listing_limits_user_id" ON "public"."seller_listing_limits" USING "btree" ("user_id");



CREATE INDEX "idx_seller_reviews_rating" ON "public"."seller_reviews" USING "btree" ("rating");



CREATE INDEX "idx_seller_reviews_seller_id" ON "public"."seller_reviews" USING "btree" ("seller_id");



CREATE INDEX "note_comments_note_id_idx" ON "public"."note_comments" USING "btree" ("note_id");



CREATE INDEX "review_criteria_category_idx" ON "public"."review_criteria" USING "btree" ("category");



CREATE OR REPLACE TRIGGER "update_conversation_last_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_timestamp"();



CREATE OR REPLACE TRIGGER "update_seller_listing_limits_trigger" AFTER INSERT ON "public"."marketplace_listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_seller_listing_limits"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_notes"
    ADD CONSTRAINT "community_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."note_comments"
    ADD CONSTRAINT "note_comments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."community_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_comments"
    ADD CONSTRAINT "note_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."seller_listing_limits"
    ADD CONSTRAINT "seller_listing_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_providers"
    ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete any service provider" ON "public"."service_providers" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can update any service provider" ON "public"."service_providers" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE USING (("public"."is_admin"() = true));



CREATE POLICY "Admins can update marketplace_listings" ON "public"."marketplace_listings" FOR UPDATE USING (("public"."is_admin"() = true));



CREATE POLICY "Admins can view admin_users" ON "public"."admin_users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE ("admin_users_1"."id" = "auth"."uid"()))));



CREATE POLICY "Allow public read access" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."recommendations" FOR SELECT USING (true);



CREATE POLICY "Anyone can read note comments" ON "public"."note_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view community notes" ON "public"."community_notes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."seller_reviews" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Authenticated users can create comments" ON "public"."note_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create community notes" ON "public"."community_notes" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Only approved events are viewable by everyone" ON "public"."events" FOR SELECT USING ((("approval_status" = 'approved'::"text") OR ("public"."is_admin"() = true)));



CREATE POLICY "Only approved marketplace_listings are viewable by non-owners" ON "public"."marketplace_listings" FOR SELECT USING ((("approval_status" = 'approved'::"text") OR ("seller_id" = "auth"."uid"()) OR ("public"."is_admin"() = true)));



CREATE POLICY "Public can view all marketplace listings" ON "public"."marketplace_listings" FOR SELECT USING (true);



CREATE POLICY "Sellers are viewable by everyone" ON "public"."sellers" FOR SELECT USING (true);



CREATE POLICY "Users can create conversations if they own the request or provi" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."service_providers"
  WHERE (("service_providers"."id" = "conversations"."provider_id") AND ("service_providers"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create their own marketplace listings" ON "public"."marketplace_listings" FOR INSERT WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own requests" ON "public"."service_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."note_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own community notes" ON "public"."community_notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own marketplace listings" ON "public"."marketplace_listings" FOR DELETE USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own requests" ON "public"."service_requests" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own reviews" ON "public"."seller_reviews" FOR DELETE TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own service_providers" ON "public"."service_providers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "sender_id") AND ((("sender_type" = 'user'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"()))))) OR (("sender_type" = 'provider'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."conversations" "c"
     JOIN "public"."service_providers" "sp" ON (("c"."provider_id" = "sp"."id")))
  WHERE (("c"."id" = "messages"."conversation_id") AND ("sp"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."service_providers" "sp"
          WHERE (("sp"."id" = "c"."provider_id") AND ("sp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can insert reviews" ON "public"."seller_reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert their own events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own seller profile" ON "public"."sellers" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can insert their own service_providers" ON "public"."service_providers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own events" ON "public"."events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."conversations" "c"
     JOIN "public"."service_providers" "sp" ON (("c"."provider_id" = "sp"."id")))
  WHERE (("c"."id" = "messages"."conversation_id") AND ("sp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own comments" ON "public"."note_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own community notes" ON "public"."community_notes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own marketplace listings" ON "public"."marketplace_listings" FOR UPDATE USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own requests" ON "public"."service_requests" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."seller_reviews" FOR UPDATE TO "authenticated" USING (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own seller profile" ON "public"."sellers" FOR UPDATE USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can update their own service_providers" ON "public"."service_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all service_providers" ON "public"."service_providers" FOR SELECT USING (true);



CREATE POLICY "Users can view messages" ON "public"."messages" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."conversations" "c"
     JOIN "public"."service_providers" "sp" ON (("c"."provider_id" = "sp"."id")))
  WHERE (("c"."id" = "messages"."conversation_id") AND ("sp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."service_providers" "sp"
          WHERE (("sp"."id" = "c"."provider_id") AND ("sp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."service_providers"
  WHERE (("service_providers"."id" = "conversations"."provider_id") AND ("service_providers"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own marketplace listings" ON "public"."marketplace_listings" FOR SELECT USING ((("seller_id" = "auth"."uid"()) OR ("seller_id" IS NULL)));



CREATE POLICY "Users can view their own requests" ON "public"."service_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_high_limit_sellers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_high_limit_sellers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_high_limit_sellers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_enhanced_listings"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_enhanced_listings"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_enhanced_listings"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_enhanced_providers"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_enhanced_providers"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_enhanced_providers"("search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_recommendations"("search_query" "text", "category_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_recommendations"("search_query" "text", "category_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_recommendations"("search_query" "text", "category_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_suggestions"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_suggestions"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_suggestions"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_seller_listing_limit"("admin_user_id" "uuid", "target_seller_phone" "text", "new_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_seller_listing_limit"("admin_user_id" "uuid", "target_seller_phone" "text", "new_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_seller_listing_limit"("admin_user_id" "uuid", "target_seller_phone" "text", "new_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_seller_listing_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_seller_listing_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_seller_listing_limits"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."community_notes" TO "anon";
GRANT ALL ON TABLE "public"."community_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."community_notes" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_listings" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "service_role";



GRANT ALL ON TABLE "public"."sellers" TO "anon";
GRANT ALL ON TABLE "public"."sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."sellers" TO "service_role";



GRANT ALL ON TABLE "public"."high_limit_sellers" TO "anon";
GRANT ALL ON TABLE "public"."high_limit_sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."high_limit_sellers" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."note_comments" TO "anon";
GRANT ALL ON TABLE "public"."note_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."note_comments" TO "service_role";



GRANT ALL ON TABLE "public"."recommendations" TO "anon";
GRANT ALL ON TABLE "public"."recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."review_criteria" TO "anon";
GRANT ALL ON TABLE "public"."review_criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."review_criteria" TO "service_role";



GRANT ALL ON TABLE "public"."seller_listing_limits" TO "anon";
GRANT ALL ON TABLE "public"."seller_listing_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_listing_limits" TO "service_role";



GRANT ALL ON TABLE "public"."seller_reviews" TO "anon";
GRANT ALL ON TABLE "public"."seller_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."service_providers" TO "anon";
GRANT ALL ON TABLE "public"."service_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."service_providers" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
