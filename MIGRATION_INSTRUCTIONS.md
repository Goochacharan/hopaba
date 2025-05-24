# Database Migration Instructions

Since the automatic migration push failed, you'll need to manually apply the migration to your Supabase database.

## Steps to Apply the Migration

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the following SQL**

```sql
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
```

4. **Run the Query**
   - Click "Run" to execute the SQL
   - You should see a success message

5. **Verify the Tables**
   - Go to "Table Editor" in the left sidebar
   - You should see the new tables: `location_reviews` and `business_reviews`

## What This Migration Does

- **Creates two new tables**: `location_reviews` and `business_reviews`
- **Replaces localStorage**: Reviews will now be stored in Supabase instead of browser localStorage
- **Enables sharing**: Reviews will be visible to all users across devices
- **Adds security**: Row Level Security (RLS) ensures users can only modify their own reviews
- **Prevents duplicates**: Unique constraints prevent users from submitting multiple reviews for the same location/business

## After Migration

Once the migration is complete, the app will:
- Store all new reviews in Supabase
- Display reviews from all users
- Allow users to edit/delete only their own reviews
- Show real-time review counts and ratings across all users 