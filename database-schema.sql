-- ChatGPT Plus LP Database Schema
-- Created: 2025-06-05
-- Server: chatgpt-plus-sql-server.database.windows.net
-- Database: chatgpt_plus_main_db

-- 顧客マスタテーブル
CREATE TABLE Customers (
    customer_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    organization_name NVARCHAR(200) NOT NULL,
    contact_person NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    phone_number NVARCHAR(20),
    postal_code NVARCHAR(10),
    address NVARCHAR(500),
    facility_type NVARCHAR(50), -- hospital, clinic, dental_clinic, pharmacy, nursing_home, other
    requested_account_count INT DEFAULT 1,
    application_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, cancelled
    payment_method NVARCHAR(20), -- card, invoice
    stripe_customer_id NVARCHAR(100),
    notes NVARCHAR(1000),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ChatGPTアカウント管理テーブル
CREATE TABLE ChatGPTAccounts (
    account_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    email NVARCHAR(100) NOT NULL,
    is_active BIT DEFAULT 1,
    product_id UNIQUEIDENTIFIER,
    start_date DATETIME2,
    end_date DATETIME2,
    subscription_months INT DEFAULT 12,
    chatgpt_external_id NVARCHAR(100), -- ChatGPT API側のID
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 製品・プランマスタテーブル
CREATE TABLE Products (
    product_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_name NVARCHAR(200) NOT NULL,
    product_code NVARCHAR(50) NOT NULL UNIQUE,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.10,
    billing_cycle NVARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    description NVARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 請求書管理テーブル
CREATE TABLE Invoices (
    invoice_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_number NVARCHAR(50) NOT NULL UNIQUE,
    billing_type NVARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    billing_period_start DATETIME2,
    billing_period_end DATETIME2,
    subtotal_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    issue_date DATETIME2 DEFAULT GETDATE(),
    due_date DATETIME2,
    payment_date DATETIME2,
    status NVARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    pdf_url NVARCHAR(500),
    email_sent_at DATETIME2,
    stripe_payment_intent_id NVARCHAR(100),
    notes NVARCHAR(1000),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);

-- 請求書明細テーブル
CREATE TABLE InvoiceItems (
    item_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER,
    description NVARCHAR(500),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (account_id) REFERENCES ChatGPTAccounts(account_id)
);

-- 決済履歴テーブル
CREATE TABLE PaymentHistory (
    payment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    invoice_id UNIQUEIDENTIFIER,
    payment_method NVARCHAR(20), -- stripe_card, bank_transfer, other
    amount DECIMAL(10,2),
    currency NVARCHAR(10) DEFAULT 'JPY',
    stripe_payment_intent_id NVARCHAR(100),
    stripe_charge_id NVARCHAR(100),
    status NVARCHAR(20), -- pending, succeeded, failed, cancelled
    payment_date DATETIME2,
    failure_reason NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id)
);

-- システム設定テーブル
CREATE TABLE SystemSettings (
    setting_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(1000),
    setting_type NVARCHAR(50), -- string, number, boolean, json
    description NVARCHAR(500),
    is_encrypted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- インデックス作成
CREATE INDEX IX_Customers_Email ON Customers(email);
CREATE INDEX IX_Customers_Status ON Customers(status);
CREATE INDEX IX_ChatGPTAccounts_CustomerID ON ChatGPTAccounts(customer_id);
CREATE INDEX IX_ChatGPTAccounts_Email ON ChatGPTAccounts(email);
CREATE INDEX IX_Invoices_CustomerID ON Invoices(customer_id);
CREATE INDEX IX_Invoices_Status ON Invoices(status);
CREATE INDEX IX_Invoices_IssueDate ON Invoices(issue_date);
CREATE INDEX IX_PaymentHistory_CustomerID ON PaymentHistory(customer_id);

-- 初期データ挿入
INSERT INTO Products (product_name, product_code, unit_price, tax_rate, billing_cycle, description) VALUES
('ChatGPT Plus 医療機関向けプラン', 'CHATGPT_PLUS_MEDICAL', 3000.00, 0.10, 'monthly', '医療機関向けChatGPT Plusアカウント（月額）'),
('ChatGPT Plus 医療機関向けプラン（年額）', 'CHATGPT_PLUS_MEDICAL_YEARLY', 30000.00, 0.10, 'yearly', '医療機関向けChatGPT Plusアカウント（年額・2ヶ月分割引）');

INSERT INTO SystemSettings (setting_key, setting_value, setting_type, description) VALUES
('default_tax_rate', '0.10', 'number', '消費税率'),
('invoice_due_days', '30', 'number', '請求書支払期限（日数）'),
('sendgrid_template_id', '', 'string', 'SendGridテンプレートID'),
('stripe_public_key', '', 'string', 'Stripe公開キー'),
('stripe_secret_key', '', 'string', 'Stripeシークレットキー'),
('chatgpt_api_key', '', 'string', 'ChatGPT API キー'),
('auto_provisioning_enabled', 'true', 'boolean', '自動アカウント生成有効/無効');