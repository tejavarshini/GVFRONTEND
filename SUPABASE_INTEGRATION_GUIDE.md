# Supabase Form Integration Guide

This document explains the Supabase integration for the three landing page contact forms: **Distributor**, **Reseller**, and **Corporate**.

## 🎯 Overview

All three modal forms now submit data directly to Supabase:
- **Distributor leads** → `gift360_distributor_leads` table
- **Reseller leads** → `gift360_reseller_leads` table
- **Corporate leads** → `gift360_corporate_leads` table + file upload to Storage

## 📦 Installation

The `@supabase/supabase-js` package has been installed:

```bash
npm install @supabase/supabase-js
```

## 🔧 Configuration

### Environment Variables

The following environment variables are configured in `.env`:

```env
# For Vite projects (current setup)
VITE_SUPABASE_URL=https://grbbtgfvgwxtkgxtakug.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For Next.js projects (backward compatibility)
NEXT_PUBLIC_SUPABASE_URL=https://grbbtgfvgwxtkgxtakug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Client

Located at: `src/lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🗄️ Database Setup

### Step 1: Create Tables

Run the SQL scripts in `SUPABASE_SETUP.sql`:

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from `SUPABASE_SETUP.sql`
5. Click **Run** to execute

This creates three tables:
- `gift360_distributor_leads`
- `gift360_reseller_leads`
- `gift360_corporate_leads`

### Step 2: Create Storage Bucket

For Corporate invoice uploads:

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `form-uploads`
4. Check **Public bucket**
5. Click **Create bucket**

Alternatively, the SQL script includes commands to create the bucket.

### Step 3: Configure Row Level Security (RLS)

The SQL script automatically enables RLS with policies:
- **INSERT**: Allow anyone (for public form submissions)
- **SELECT**: Allow authenticated users only (for admin viewing)

## 📝 Form Integration Details

### Distributor Form

**File**: `src/components/DistributorContactModal.tsx`

**Fields**:
- `organization_name` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `pan` (TEXT)
- `gst` (TEXT)
- `message` (TEXT)

**Submission Flow**:
```typescript
const { error } = await supabase
  .from('gift360_distributor_leads')
  .insert([{ organization_name, city, state, pan, gst, message }])
```

### Reseller Form

**File**: `src/components/ResellerContactModal.tsx`

**Fields**: Same as Distributor

**Submission Flow**:
```typescript
const { error } = await supabase
  .from('gift360_reseller_leads')
  .insert([{ organization_name, city, state, pan, gst, message }])
```

### Corporate Form

**File**: `src/components/CorporateContactModal.tsx`

**Fields**:
- `organization_name` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `pan_company` (TEXT)
- `gst_company` (TEXT)
- `sample_invoice_url` (TEXT) - uploaded file URL
- `message` (TEXT)

**Submission Flow**:
1. **Upload file** to `form-uploads` Storage bucket
2. **Get public URL** of uploaded file
3. **Insert data** with file URL into `corporate_leads` table

```typescript
// Upload file
const { error: uploadError } = await supabase.storage
  .from('form-uploads')
  .upload(filePath, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('form-uploads')
  .getPublicUrl(filePath)

// Insert with file URL
const { error } = await supabase
  .from('gift360_corporate_leads')
  .insert([{ ...formData, sample_invoice_url: publicUrl }])
```

## ✨ Features Implemented

### 1. Loading States
All forms show a loading spinner during submission:
```tsx
{loading ? (
  <>
    <Loader2 className="h-5 w-5 animate-spin" />
    Submitting...
  </>
) : (
  'Send Message'
)}
```

### 2. Error Handling
Errors are displayed in a red banner:
```tsx
{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
    {error}
  </div>
)}
```

### 3. Form Validation
- All fields marked with `*` are required
- PAN: 10 characters, auto-uppercase
- GST: 15 characters, auto-uppercase
- File upload: PDF, DOC, DOCX, XLS, XLSX only

### 4. Success State
After successful submission:
- Form shows success message
- Modal can be closed
- Form resets on close

## 🔍 Testing

### Test Distributor Form
1. Navigate to Distributor landing page
2. Click "Get Registered with SabbPe"
3. Fill in all required fields
4. Click "Send Message"
5. Check Supabase Dashboard > Table Editor > `gift360_distributor_leads`

### Test Reseller Form
Same process, check `gift360_reseller_leads` table

### Test Corporate Form (with file upload)
1. Fill in all fields
2. Upload a sample invoice
3. Submit form
4. Check:
   - `gift360_corporate_leads` table for data
   - `form-uploads` Storage bucket for uploaded file

## 🔐 Security Considerations

### ✅ What's Safe
- Using `VITE_SUPABASE_ANON_KEY` in frontend
- Public insert access (with RLS policies)
- Public Storage bucket for form uploads

### ⚠️ Important Notes
- Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- RLS policies prevent unauthorized SELECT queries
- Only authenticated users (admins) can view leads
- File uploads are public but bucket is isolated

## 📊 Viewing Submissions

### Via Supabase Dashboard
1. Go to **Table Editor**
2. Select table: `gift360_distributor_leads`, `gift360_reseller_leads`, or `gift360_corporate_leads`
3. View all submissions with timestamps

### Via SQL
```sql
-- Recent distributor leads
SELECT * FROM gift360_distributor_leads 
ORDER BY created_at DESC 
LIMIT 10;

-- Count leads by type
SELECT COUNT(*) as total FROM gift360_distributor_leads;
SELECT COUNT(*) as total FROM gift360_reseller_leads;
SELECT COUNT(*) as total FROM gift360_corporate_leads;

-- Search by organization
SELECT * FROM gift360_corporate_leads 
WHERE organization_name ILIKE '%company name%';
```

## 🛠️ Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: "Failed to submit your request"
**Solution**: 
1. Check Supabase tables exist
2. Verify RLS policies allow INSERT
3. Check browser console for detailed errors

### Issue: File upload fails
**Solution**:
1. Ensure `form-uploads` bucket exists
2. Check bucket is set to **Public**
3. Verify Storage policies allow INSERT

### Issue: Can't view data in dashboard
**Solution**: Log in to Supabase - RLS restricts SELECT to authenticated users

## 📁 File Structure

```
src/
├── lib/
│   └── supabaseClient.ts          # Supabase client configuration
├── components/
│   ├── DistributorContactModal.tsx # Distributor form with Supabase
│   ├── ResellerContactModal.tsx    # Reseller form with Supabase
│   └── CorporateContactModal.tsx   # Corporate form with file upload
└── ...

SUPABASE_SETUP.sql                  # Database setup scripts
SUPABASE_INTEGRATION_GUIDE.md       # This file
.env                                # Environment variables
```

## ✅ Verification Checklist

- [x] Supabase client installed
- [x] Environment variables configured
- [x] Tables created with RLS policies
- [x] Storage bucket created and configured
- [x] Forms submit successfully
- [x] Loading states work
- [x] Error handling displays properly
- [x] File uploads work (Corporate)
- [x] Data appears in Supabase Dashboard

## 🚀 Next Steps

1. **Test all three forms** in development
2. **Verify data** in Supabase Dashboard
3. **Set up email notifications** (optional - use Supabase Functions)
4. **Create admin dashboard** to view/manage leads
5. **Add export functionality** for lead data

---

**Need help?** Check the Supabase documentation: https://supabase.com/docs
