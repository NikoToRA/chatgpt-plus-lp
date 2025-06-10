-- Supabase用顧客管理スキーマ
-- 既存のform_submissionsテーブルと連携する顧客テーブル

-- 顧客マスタテーブル
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL UNIQUE,
    organization VARCHAR(200) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    postal_code VARCHAR(10),
    address TEXT,
    facility_type VARCHAR(50) DEFAULT 'other', -- hospital, clinic, dental_clinic, pharmacy, nursing_home, other
    account_count INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'trial', -- trial, active, suspended, cancelled
    plan VARCHAR(20) DEFAULT 'plus', -- basic, plus, enterprise
    payment_method VARCHAR(20) DEFAULT 'card', -- card, invoice
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_months INTEGER DEFAULT 12,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id VARCHAR(100),
    notes TEXT,
    source_submission_id UUID, -- form_submissionsテーブルのIDを参照
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ChatGPTアカウント管理テーブル
CREATE TABLE IF NOT EXISTS chatgpt_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    product_id UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    subscription_months INTEGER DEFAULT 12,
    chatgpt_external_id VARCHAR(100), -- ChatGPT API側のID
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 製品・プランマスタテーブル
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.10,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization);
CREATE INDEX IF NOT EXISTS idx_customers_source_submission ON customers(source_submission_id);
CREATE INDEX IF NOT EXISTS idx_chatgpt_accounts_customer_id ON chatgpt_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_chatgpt_accounts_email ON chatgpt_accounts(email);

-- Row Level Security (RLS) 設定
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatgpt_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 管理者用ポリシー（認証済みユーザーは全てアクセス可能）
CREATE POLICY "Enable all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON chatgpt_accounts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- 匿名ユーザーからの読み込み許可（必要に応じて）
CREATE POLICY "Enable read for anonymous users" ON customers
    FOR SELECT USING (true);

-- 初期製品データ
INSERT INTO products (name, code, unit_price, tax_rate, billing_cycle, description) 
VALUES 
('ChatGPT Plus 医療機関向けプラン', 'CHATGPT_PLUS_MEDICAL', 3000.00, 0.10, 'monthly', '医療機関向けChatGPT Plusアカウント（月額）'),
('ChatGPT Plus 医療機関向けプラン（年額）', 'CHATGPT_PLUS_MEDICAL_YEARLY', 30000.00, 0.10, 'yearly', '医療機関向けChatGPT Plusアカウント（年額・2ヶ月分割引）')
ON CONFLICT (code) DO NOTHING;

-- Updated at トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated at トリガー設定
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatgpt_accounts_updated_at BEFORE UPDATE ON chatgpt_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();