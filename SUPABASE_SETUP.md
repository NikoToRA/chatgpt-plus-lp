# Supabase Database Setup

## 1. Supabase Project Creation
1. Go to https://supabase.com/
2. Create new project
3. Choose region (Tokyo/Asia Pacific)
4. Save the project URL and anon key

## 2. Database Schema

```sql
-- customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  organization VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  phone_number VARCHAR,
  postal_code VARCHAR,
  address TEXT,
  prefecture VARCHAR,
  city VARCHAR,
  address_detail VARCHAR,
  facility_type VARCHAR CHECK (facility_type IN ('hospital', 'clinic', 'dental_clinic', 'pharmacy', 'nursing_home', 'other')),
  department VARCHAR,
  contact_phone VARCHAR,
  plan VARCHAR DEFAULT 'plus' CHECK (plan IN ('basic', 'plus', 'enterprise')),
  plan_id VARCHAR,
  account_count INTEGER DEFAULT 1,
  requested_account_count INTEGER DEFAULT 1,
  billing_cycle VARCHAR DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR DEFAULT 'invoice' CHECK (payment_method IN ('card', 'invoice')),
  card_holder_name VARCHAR,
  billing_contact VARCHAR,
  billing_email VARCHAR,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_months INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE,
  application_id VARCHAR,
  terms_accepted BOOLEAN DEFAULT false,
  privacy_accepted BOOLEAN DEFAULT false,
  product_id VARCHAR,
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access (adjust as needed)
CREATE POLICY "Enable all operations for authenticated users" ON customers
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE
    ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- form_submissions table (for contact form data)
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  purpose VARCHAR NOT NULL CHECK (purpose IN ('資料請求', 'お申し込み', 'その他')),
  accounts INTEGER DEFAULT 1,
  message TEXT,
  user_agent TEXT,
  ip_address INET,
  status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for form submissions (allow public insert, authenticated read/update)
CREATE POLICY "Enable insert for everyone" ON form_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON form_submissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger for form_submissions
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE
    ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 3. Environment Variables
Add to admin-dashboard/.env.local:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Install Supabase Client
```bash
cd admin-dashboard
npm install @supabase/supabase-js
```