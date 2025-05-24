-- Create location_reviews table for location-based reviews
CREATE TABLE IF NOT EXISTS "public"."location_reviews" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "location_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "reviewer_name" text NOT NULL,
    "rating" integer NOT NULL,
    "text" text DEFAULT '',
    "is_must_visit" boolean DEFAULT false,
    "is_hidden_gem" boolean DEFAULT false,
    "criteria_ratings" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "location_reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);

-- Create business_reviews table for business-based reviews
CREATE TABLE IF NOT EXISTS "public"."business_reviews" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "business_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "reviewer_name" text NOT NULL,
    "rating" integer NOT NULL,
    "text" text DEFAULT '',
    "is_must_visit" boolean DEFAULT false,
    "is_hidden_gem" boolean DEFAULT false,
    "criteria_ratings" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "business_reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);

-- Add primary keys
ALTER TABLE ONLY "public"."location_reviews"
    ADD CONSTRAINT "location_reviews_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."location_reviews"
    ADD CONSTRAINT "location_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX "location_reviews_location_id_idx" ON "public"."location_reviews" USING btree ("location_id");
CREATE INDEX "location_reviews_user_id_idx" ON "public"."location_reviews" USING btree ("user_id");
CREATE INDEX "location_reviews_rating_idx" ON "public"."location_reviews" USING btree ("rating");

CREATE INDEX "business_reviews_business_id_idx" ON "public"."business_reviews" USING btree ("business_id");
CREATE INDEX "business_reviews_user_id_idx" ON "public"."business_reviews" USING btree ("user_id");
CREATE INDEX "business_reviews_rating_idx" ON "public"."business_reviews" USING btree ("rating");

-- Add unique constraints to prevent duplicate reviews from same user
ALTER TABLE ONLY "public"."location_reviews"
    ADD CONSTRAINT "location_reviews_user_location_unique" UNIQUE ("user_id", "location_id");

ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_user_business_unique" UNIQUE ("user_id", "business_id");

-- Enable Row Level Security
ALTER TABLE "public"."location_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."business_reviews" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for location_reviews
CREATE POLICY "Anyone can view location reviews" ON "public"."location_reviews"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own location reviews" ON "public"."location_reviews"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location reviews" ON "public"."location_reviews"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location reviews" ON "public"."location_reviews"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for business_reviews
CREATE POLICY "Anyone can view business reviews" ON "public"."business_reviews"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own business reviews" ON "public"."business_reviews"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business reviews" ON "public"."business_reviews"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business reviews" ON "public"."business_reviews"
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON "public"."location_reviews" TO "authenticated";
GRANT SELECT ON "public"."location_reviews" TO "anon";

GRANT ALL ON "public"."business_reviews" TO "authenticated";
GRANT SELECT ON "public"."business_reviews" TO "anon"; 