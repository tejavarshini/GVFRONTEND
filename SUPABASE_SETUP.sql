-- SUPABASE DATABASE SETUP FOR FORM SUBMISSIONS
-- Run these SQL commands in your Supabase SQL Editor
-- Navigate to: Supabase Dashboard > SQL Editor > New Query

-- =====================================================
-- 1. CREATE GIFT360 DISTRIBUTOR LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gift360_distributor_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pan TEXT NOT NULL,
  gst TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.gift360_distributor_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for form submissions)
CREATE POLICY "gift360_public_insert_distributor"
ON public.gift360_distributor_leads
FOR INSERT
WITH CHECK (true);

-- Create policy to allow admins to view all records
CREATE POLICY "gift360_authenticated_read_distributor"
ON public.gift360_distributor_leads
FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. CREATE GIFT360 RESELLER LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gift360_reseller_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pan TEXT NOT NULL,
  gst TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.gift360_reseller_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for form submissions)
CREATE POLICY "gift360_public_insert_reseller"
ON public.gift360_reseller_leads
FOR INSERT
WITH CHECK (true);

-- Create policy to allow admins to view all records
CREATE POLICY "gift360_authenticated_read_reseller"
ON public.gift360_reseller_leads
FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. CREATE GIFT360 CORPORATE LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gift360_corporate_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pan_company TEXT NOT NULL,
  gst_company TEXT NOT NULL,
  sample_invoice_url TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.gift360_corporate_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for form submissions)
CREATE POLICY "gift360_public_insert_corporate"
ON public.gift360_corporate_leads
FOR INSERT
WITH CHECK (true);

-- Create policy to allow admins to view all records
CREATE POLICY "gift360_authenticated_read_corporate"
ON public.gift360_corporate_leads
FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. CREATE STORAGE BUCKET FOR FILE UPLOADS
-- =====================================================
-- Note: This must be done through Supabase Dashboard > Storage
-- Or run this SQL if you have the appropriate permissions:

INSERT INTO storage.buckets (id, name, public)
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public uploads
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'form-uploads');

-- Create policy to allow public access to files
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'form-uploads');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your tables were created successfully:

-- Check distributor leads
SELECT * FROM public.gift360_distributor_leads LIMIT 5;

-- Check reseller leads
SELECT * FROM public.gift360_reseller_leads LIMIT 5;

-- Check corporate leads
SELECT * FROM public.gift360_corporate_leads LIMIT 5;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'form-uploads';

-- =====================================================
-- MANUAL STORAGE BUCKET SETUP (ALTERNATIVE)
-- =====================================================
-- If SQL insertion doesn't work, create the bucket manually:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: form-uploads
-- 4. Check "Public bucket"
-- 5. Click "Create bucket"
-- 6. Click on the bucket > Policies tab
-- 7. Add policies for INSERT and SELECT as shown above
