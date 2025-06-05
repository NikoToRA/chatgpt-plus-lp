# Issue #10: Azure Functions用データベース接続モジュール開発

## 📋 概要
Azure SQL Databaseと連携するためのAzure Functions用共通データベース接続モジュールの開発

## 🎯 目標
既存のAzure FunctionsをローカルストレージからAzure SQL Databaseに移行

## 📦 対象Functions
- `customers/` - 顧客データ管理
- `dashboard/` - ダッシュボードデータ
- `generate-invoice-pdf/` - 請求書PDF生成
- `send-invoice-email/` - 請求書メール送信
- `submit-form/` - フォーム送信処理（新規）

## 🔧 技術要件

### データベース接続設定
```typescript
// api/shared/database.ts
import sql from 'mssql';

export interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  database: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    enableArithAbort: boolean;
  };
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

const config: DatabaseConfig = {
  user: process.env.SQL_USER || 'sqladmin',
  password: process.env.SQL_PASSWORD!,
  server: process.env.SQL_SERVER || 'chatgpt-plus-sql-new.database.windows.net',
  database: process.env.SQL_DATABASE || 'chatgpt_plus_main_db',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
```

## 📝 実装するDAO（Data Access Object）

### 1. CustomerDAO
```typescript
// api/shared/dao/CustomerDAO.ts
import sql from 'mssql';
import { getDbConnection } from '../database';

export interface Customer {
  customer_id: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone_number?: string;
  postal_code?: string;
  address?: string;
  facility_type: string;
  requested_account_count: number;
  application_date: Date;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  payment_method?: 'card' | 'invoice';
  stripe_customer_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export class CustomerDAO {
  private static instance: CustomerDAO;

  public static getInstance(): CustomerDAO {
    if (!CustomerDAO.instance) {
      CustomerDAO.instance = new CustomerDAO();
    }
    return CustomerDAO.instance;
  }

  async getAllCustomers(): Promise<Customer[]> {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT * FROM Customers 
      ORDER BY created_at DESC
    `);
    return result.recordset;
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('customerId', sql.UniqueIdentifier, customerId)
      .query('SELECT * FROM Customers WHERE customer_id = @customerId');
    
    return result.recordset[0] || null;
  }

  async createCustomer(customer: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('organizationName', sql.NVarChar(200), customer.organization_name)
      .input('contactPerson', sql.NVarChar(100), customer.contact_person)
      .input('email', sql.NVarChar(100), customer.email)
      .input('phoneNumber', sql.NVarChar(20), customer.phone_number)
      .input('postalCode', sql.NVarChar(10), customer.postal_code)
      .input('address', sql.NVarChar(500), customer.address)
      .input('facilityType', sql.NVarChar(50), customer.facility_type)
      .input('requestedAccountCount', sql.Int, customer.requested_account_count)
      .input('applicationDate', sql.DateTime2, customer.application_date)
      .input('status', sql.NVarChar(20), customer.status)
      .input('paymentMethod', sql.NVarChar(20), customer.payment_method)
      .input('stripeCustomerId', sql.NVarChar(100), customer.stripe_customer_id)
      .input('notes', sql.NVarChar(1000), customer.notes)
      .query(`
        INSERT INTO Customers (
          organization_name, contact_person, email, phone_number, postal_code, 
          address, facility_type, requested_account_count, application_date, 
          status, payment_method, stripe_customer_id, notes
        ) 
        OUTPUT INSERTED.customer_id
        VALUES (
          @organizationName, @contactPerson, @email, @phoneNumber, @postalCode,
          @address, @facilityType, @requestedAccountCount, @applicationDate,
          @status, @paymentMethod, @stripeCustomerId, @notes
        )
      `);
    
    return result.recordset[0].customer_id;
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<boolean> {
    const pool = await getDbConnection();
    
    const setClause = Object.keys(updates)
      .filter(key => key !== 'customer_id' && key !== 'created_at')
      .map(key => `${key} = @${key}`)
      .join(', ');

    if (!setClause) return false;

    const request = pool.request()
      .input('customerId', sql.UniqueIdentifier, customerId)
      .input('updatedAt', sql.DateTime2, new Date());

    // 動的にパラメータを追加
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'customer_id' && key !== 'created_at') {
        request.input(key, value);
      }
    });

    const result = await request.query(`
      UPDATE Customers 
      SET ${setClause}, updated_at = @updatedAt
      WHERE customer_id = @customerId
    `);

    return result.rowsAffected[0] > 0;
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('customerId', sql.UniqueIdentifier, customerId)
      .query('DELETE FROM Customers WHERE customer_id = @customerId');
    
    return result.rowsAffected[0] > 0;
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('status', sql.NVarChar(20), status)
      .query('SELECT * FROM Customers WHERE status = @status ORDER BY created_at DESC');
    
    return result.recordset;
  }
}
```

### 2. InvoiceDAO
```typescript
// api/shared/dao/InvoiceDAO.ts
export interface Invoice {
  invoice_id: string;
  customer_id: string;
  invoice_number: string;
  billing_type: 'monthly' | 'yearly';
  billing_period_start: Date;
  billing_period_end: Date;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  issue_date: Date;
  due_date: Date;
  payment_date?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pdf_url?: string;
  email_sent_at?: Date;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export class InvoiceDAO {
  private static instance: InvoiceDAO;

  public static getInstance(): InvoiceDAO {
    if (!InvoiceDAO.instance) {
      InvoiceDAO.instance = new InvoiceDAO();
    }
    return InvoiceDAO.instance;
  }

  async getAllInvoices(): Promise<Invoice[]> {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT i.*, c.organization_name, c.contact_person 
      FROM Invoices i
      LEFT JOIN Customers c ON i.customer_id = c.customer_id
      ORDER BY i.issue_date DESC
    `);
    return result.recordset;
  }

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const pool = await getDbConnection();
    const result = await pool.request()
      .query(`
        SELECT COUNT(*) as count 
        FROM Invoices 
        WHERE invoice_number LIKE '${year}${month}%'
      `);
    
    const sequence = String(result.recordset[0].count + 1).padStart(4, '0');
    return `${year}${month}${sequence}`;
  }

  async createInvoice(invoice: Omit<Invoice, 'invoice_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('customerId', sql.UniqueIdentifier, invoice.customer_id)
      .input('invoiceNumber', sql.NVarChar(50), invoice.invoice_number)
      .input('billingType', sql.NVarChar(20), invoice.billing_type)
      .input('billingPeriodStart', sql.DateTime2, invoice.billing_period_start)
      .input('billingPeriodEnd', sql.DateTime2, invoice.billing_period_end)
      .input('subtotalAmount', sql.Decimal(10, 2), invoice.subtotal_amount)
      .input('taxAmount', sql.Decimal(10, 2), invoice.tax_amount)
      .input('totalAmount', sql.Decimal(10, 2), invoice.total_amount)
      .input('issueDate', sql.DateTime2, invoice.issue_date)
      .input('dueDate', sql.DateTime2, invoice.due_date)
      .input('status', sql.NVarChar(20), invoice.status)
      .query(`
        INSERT INTO Invoices (
          customer_id, invoice_number, billing_type, billing_period_start, 
          billing_period_end, subtotal_amount, tax_amount, total_amount,
          issue_date, due_date, status
        )
        OUTPUT INSERTED.invoice_id
        VALUES (
          @customerId, @invoiceNumber, @billingType, @billingPeriodStart,
          @billingPeriodEnd, @subtotalAmount, @taxAmount, @totalAmount,
          @issueDate, @dueDate, @status
        )
      `);
    
    return result.recordset[0].invoice_id;
  }
}
```

### 3. DashboardDAO
```typescript
// api/shared/dao/DashboardDAO.ts
export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  overDueInvoices: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  customers: number;
}

export class DashboardDAO {
  private static instance: DashboardDAO;

  public static getInstance(): DashboardDAO {
    if (!DashboardDAO.instance) {
      DashboardDAO.instance = new DashboardDAO();
    }
    return DashboardDAO.instance;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const pool = await getDbConnection();
    
    const [customerStats, revenueStats, invoiceStats] = await Promise.all([
      // 顧客統計
      pool.request().query(`
        SELECT 
          COUNT(*) as totalCustomers,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCustomers
        FROM Customers
      `),
      
      // 売上統計
      pool.request().query(`
        SELECT 
          SUM(total_amount) as totalRevenue,
          SUM(CASE 
            WHEN YEAR(issue_date) = YEAR(GETDATE()) AND MONTH(issue_date) = MONTH(GETDATE()) 
            THEN total_amount ELSE 0 
          END) as monthlyRevenue
        FROM Invoices 
        WHERE status IN ('sent', 'paid')
      `),
      
      // 請求書統計
      pool.request().query(`
        SELECT 
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as pendingInvoices,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overDueInvoices
        FROM Invoices
      `)
    ]);

    return {
      totalCustomers: customerStats.recordset[0].totalCustomers || 0,
      activeCustomers: customerStats.recordset[0].activeCustomers || 0,
      totalRevenue: revenueStats.recordset[0].totalRevenue || 0,
      monthlyRevenue: revenueStats.recordset[0].monthlyRevenue || 0,
      pendingInvoices: invoiceStats.recordset[0].pendingInvoices || 0,
      overDueInvoices: invoiceStats.recordset[0].overDueInvoices || 0,
    };
  }

  async getRevenueData(months: number = 12): Promise<RevenueData[]> {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('months', sql.Int, months)
      .query(`
        SELECT 
          FORMAT(issue_date, 'yyyy-MM') as month,
          SUM(total_amount) as revenue,
          COUNT(DISTINCT customer_id) as customers
        FROM Invoices 
        WHERE status IN ('sent', 'paid')
          AND issue_date >= DATEADD(month, -@months, GETDATE())
        GROUP BY FORMAT(issue_date, 'yyyy-MM')
        ORDER BY month
      `);
    
    return result.recordset;
  }
}
```

## 🔧 既存Functions更新

### 1. customers/index.js 更新
```javascript
const { CustomerDAO } = require('../shared/dao/CustomerDAO');

module.exports = async function (context, req) {
    context.log('Customers function processed a request.');

    const customerDAO = CustomerDAO.getInstance();

    try {
        switch (req.method) {
            case 'GET':
                if (req.query.id) {
                    const customer = await customerDAO.getCustomerById(req.query.id);
                    context.res = {
                        status: customer ? 200 : 404,
                        body: customer || { error: 'Customer not found' }
                    };
                } else {
                    const customers = await customerDAO.getAllCustomers();
                    context.res = {
                        status: 200,
                        body: customers
                    };
                }
                break;

            case 'POST':
                const newCustomerId = await customerDAO.createCustomer(req.body);
                context.res = {
                    status: 201,
                    body: { customer_id: newCustomerId, message: 'Customer created successfully' }
                };
                break;

            case 'PUT':
                if (!req.query.id) {
                    context.res = { status: 400, body: { error: 'Customer ID required' } };
                    return;
                }
                const updated = await customerDAO.updateCustomer(req.query.id, req.body);
                context.res = {
                    status: updated ? 200 : 404,
                    body: { message: updated ? 'Customer updated' : 'Customer not found' }
                };
                break;

            case 'DELETE':
                if (!req.query.id) {
                    context.res = { status: 400, body: { error: 'Customer ID required' } };
                    return;
                }
                const deleted = await customerDAO.deleteCustomer(req.query.id);
                context.res = {
                    status: deleted ? 200 : 404,
                    body: { message: deleted ? 'Customer deleted' : 'Customer not found' }
                };
                break;

            default:
                context.res = {
                    status: 405,
                    body: { error: 'Method not allowed' }
                };
        }
    } catch (error) {
        context.log.error('Error in customers function:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};
```

### 2. dashboard/index.js 更新
```javascript
const { DashboardDAO } = require('../shared/dao/DashboardDAO');

module.exports = async function (context, req) {
    context.log('Dashboard function processed a request.');

    const dashboardDAO = DashboardDAO.getInstance();

    try {
        if (req.query.type === 'revenue') {
            const months = parseInt(req.query.months) || 12;
            const revenueData = await dashboardDAO.getRevenueData(months);
            context.res = {
                status: 200,
                body: revenueData
            };
        } else {
            const stats = await dashboardDAO.getDashboardStats();
            context.res = {
                status: 200,
                body: stats
            };
        }
    } catch (error) {
        context.log.error('Error in dashboard function:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
};
```

## 📋 実装チェックリスト

### 環境設定
- [ ] mssqlパッケージインストール
- [ ] 環境変数設定（SQL_USER, SQL_PASSWORD, SQL_SERVER, SQL_DATABASE）
- [ ] local.settings.json更新

### 共通モジュール
- [ ] database.ts 接続モジュール作成
- [ ] CustomerDAO実装
- [ ] InvoiceDAO実装  
- [ ] DashboardDAO実装
- [ ] エラーハンドリング共通化

### Functions更新
- [ ] customers/index.js更新
- [ ] dashboard/index.js更新
- [ ] generate-invoice-pdf/index.js更新
- [ ] send-invoice-email/index.js更新

### 新規Functions
- [ ] customer-application/index.js作成（顧客申込処理）
- [ ] invoice-items/index.js作成（請求書明細管理）
- [ ] system-settings/index.js作成（システム設定管理）

### テスト
- [ ] ローカル環境でのDB接続テスト
- [ ] 各Function単体テスト
- [ ] 統合テスト
- [ ] 本番環境デプロイテスト

## 🚀 デプロイ準備

### Azure Functions設定
```bash
# Application Settings追加
az functionapp config appsettings set \
  --name chatgpt-plus-functions \
  --resource-group Chatgpthospital \
  --settings \
  SQL_USER=sqladmin \
  SQL_PASSWORD=ZuruAzure0919 \
  SQL_SERVER=chatgpt-plus-sql-new.database.windows.net \
  SQL_DATABASE=chatgpt_plus_main_db
```

## ✅ 完了条件

### 機能要件
- [ ] 全てのCRUD操作がAzure SQL Databaseで動作
- [ ] エラーハンドリングが適切に実装
- [ ] パフォーマンスが許容範囲内（2秒以内）
- [ ] 同時アクセス処理が正常動作

### 非機能要件
- [ ] 接続プールが適切に管理
- [ ] SQLインジェクション対策済み
- [ ] ログ出力が適切
- [ ] 例外処理が網羅的

---

**担当者**: GitHub Actions / 自動化ワークフロー  
**期限**: 1週間  
**関連Issue**: #8 (顧客申込フォーム), #9 (管理画面デプロイ)  
**Dependencies**: Azure SQL Database（完了済み）