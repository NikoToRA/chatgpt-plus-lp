const sql = require('mssql');

const config = {
    user: 'sqladmin',
    password: 'ZuruAzure0919',
    server: 'chatgpt-plus-sql-new.database.windows.net',
    database: 'chatgpt_plus_main_db',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function setupTables() {
    let pool;
    
    try {
        console.log('Connecting to Azure SQL Database...');
        pool = await sql.connect(config);
        console.log('Connected successfully!');
        
        // 1. Customersテーブル
        console.log('Creating Customers table...');
        await pool.request().query(`
            CREATE TABLE Customers (
                customer_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                organization_name NVARCHAR(200) NOT NULL,
                contact_person NVARCHAR(100) NOT NULL,
                email NVARCHAR(100) NOT NULL UNIQUE,
                phone_number NVARCHAR(20),
                postal_code NVARCHAR(10),
                address NVARCHAR(500),
                facility_type NVARCHAR(50),
                requested_account_count INT DEFAULT 1,
                application_date DATETIME2 DEFAULT GETDATE(),
                status NVARCHAR(20) DEFAULT 'pending',
                payment_method NVARCHAR(20),
                stripe_customer_id NVARCHAR(100),
                notes NVARCHAR(1000),
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );
        `);
        console.log('✓ Customers table created');
        
        // 2. Productsテーブル
        console.log('Creating Products table...');
        await pool.request().query(`
            CREATE TABLE Products (
                product_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                product_name NVARCHAR(200) NOT NULL,
                product_code NVARCHAR(50) NOT NULL UNIQUE,
                unit_price DECIMAL(10,2) NOT NULL,
                tax_rate DECIMAL(5,2) DEFAULT 0.10,
                billing_cycle NVARCHAR(20) DEFAULT 'monthly',
                description NVARCHAR(500),
                is_active BIT DEFAULT 1,
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );
        `);
        console.log('✓ Products table created');
        
        // 3. ChatGPTAccountsテーブル
        console.log('Creating ChatGPTAccounts table...');
        await pool.request().query(`
            CREATE TABLE ChatGPTAccounts (
                account_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                customer_id UNIQUEIDENTIFIER NOT NULL,
                email NVARCHAR(100) NOT NULL,
                is_active BIT DEFAULT 1,
                product_id UNIQUEIDENTIFIER,
                start_date DATETIME2,
                end_date DATETIME2,
                subscription_months INT DEFAULT 12,
                chatgpt_external_id NVARCHAR(100),
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
                FOREIGN KEY (product_id) REFERENCES Products(product_id)
            );
        `);
        console.log('✓ ChatGPTAccounts table created');
        
        // 4. Invoicesテーブル
        console.log('Creating Invoices table...');
        await pool.request().query(`
            CREATE TABLE Invoices (
                invoice_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                customer_id UNIQUEIDENTIFIER NOT NULL,
                invoice_number NVARCHAR(50) NOT NULL UNIQUE,
                billing_type NVARCHAR(20) DEFAULT 'monthly',
                billing_period_start DATETIME2,
                billing_period_end DATETIME2,
                subtotal_amount DECIMAL(10,2),
                tax_amount DECIMAL(10,2),
                total_amount DECIMAL(10,2),
                issue_date DATETIME2 DEFAULT GETDATE(),
                due_date DATETIME2,
                payment_date DATETIME2,
                status NVARCHAR(20) DEFAULT 'draft',
                pdf_url NVARCHAR(500),
                email_sent_at DATETIME2,
                stripe_payment_intent_id NVARCHAR(100),
                notes NVARCHAR(1000),
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            );
        `);
        console.log('✓ Invoices table created');
        
        // 5. InvoiceItemsテーブル
        console.log('Creating InvoiceItems table...');
        await pool.request().query(`
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
        `);
        console.log('✓ InvoiceItems table created');
        
        // 6. PaymentHistoryテーブル
        console.log('Creating PaymentHistory table...');
        await pool.request().query(`
            CREATE TABLE PaymentHistory (
                payment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                customer_id UNIQUEIDENTIFIER NOT NULL,
                invoice_id UNIQUEIDENTIFIER,
                payment_method NVARCHAR(20),
                amount DECIMAL(10,2),
                currency NVARCHAR(10) DEFAULT 'JPY',
                stripe_payment_intent_id NVARCHAR(100),
                stripe_charge_id NVARCHAR(100),
                status NVARCHAR(20),
                payment_date DATETIME2,
                failure_reason NVARCHAR(500),
                created_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
                FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id)
            );
        `);
        console.log('✓ PaymentHistory table created');
        
        // 7. SystemSettingsテーブル
        console.log('Creating SystemSettings table...');
        await pool.request().query(`
            CREATE TABLE SystemSettings (
                setting_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                setting_key NVARCHAR(100) NOT NULL UNIQUE,
                setting_value NVARCHAR(1000),
                setting_type NVARCHAR(50),
                description NVARCHAR(500),
                is_encrypted BIT DEFAULT 0,
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );
        `);
        console.log('✓ SystemSettings table created');
        
        // 初期データ挿入
        console.log('Inserting initial data...');
        await pool.request().query(`
            INSERT INTO Products (product_name, product_code, unit_price, tax_rate, billing_cycle, description) VALUES
            ('ChatGPT Plus 医療機関向けプラン', 'CHATGPT_PLUS_MEDICAL', 3000.00, 0.10, 'monthly', '医療機関向けChatGPT Plusアカウント（月額）'),
            ('ChatGPT Plus 医療機関向けプラン（年額）', 'CHATGPT_PLUS_MEDICAL_YEARLY', 30000.00, 0.10, 'yearly', '医療機関向けChatGPT Plusアカウント（年額・2ヶ月分割引）');
        `);
        
        await pool.request().query(`
            INSERT INTO SystemSettings (setting_key, setting_value, setting_type, description) VALUES
            ('default_tax_rate', '0.10', 'number', '消費税率'),
            ('invoice_due_days', '30', 'number', '請求書支払期限（日数）'),
            ('sendgrid_template_id', '', 'string', 'SendGridテンプレートID'),
            ('stripe_public_key', '', 'string', 'Stripe公開キー'),
            ('stripe_secret_key', '', 'string', 'Stripeシークレットキー'),
            ('chatgpt_api_key', '', 'string', 'ChatGPT API キー'),
            ('auto_provisioning_enabled', 'true', 'boolean', '自動アカウント生成有効/無効');
        `);
        console.log('✓ Initial data inserted');
        
        // テーブル確認
        const result = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        console.log('\n✅ Database setup completed!');
        console.log('Created tables:', result.recordset.map(r => r.TABLE_NAME).join(', '));
        
        // 製品データ確認
        const products = await pool.request().query('SELECT product_name, unit_price FROM Products');
        console.log('\n📦 Products:');
        products.recordset.forEach(product => {
            console.log(`- ${product.product_name}: ¥${product.unit_price}`);
        });
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

setupTables();