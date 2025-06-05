const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// データベース接続設定
const config = {
    user: 'sqladmin',
    password: 'ZuruAzure0919',
    server: 'chatgpt-plus-sql-new.database.windows.net',
    database: 'chatgpt_plus_main_db',
    options: {
        encrypt: true, // Azure SQL Databaseでは必須
        trustServerCertificate: false,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function executeStatement(pool, statement, context) {
    try {
        console.log(`Executing ${context}...`);
        await pool.request().query(statement);
        console.log(`✓ ${context} completed`);
    } catch (error) {
        console.error(`✗ Error in ${context}:`, error.message);
        if (context.includes('CREATE TABLE')) {
            console.error('Statement:', statement.substring(0, 100) + '...');
        }
    }
}

async function setupDatabase() {
    let pool;
    
    try {
        console.log('Connecting to Azure SQL Database...');
        pool = await sql.connect(config);
        console.log('Connected successfully!');
        
        // スキーマファイルを読み込み
        const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // CREATE TABLEステートメントを最初に実行
        const tableStatements = [
            'CREATE TABLE Customers',
            'CREATE TABLE Products',
            'CREATE TABLE ChatGPTAccounts',
            'CREATE TABLE Invoices',
            'CREATE TABLE InvoiceItems',
            'CREATE TABLE PaymentHistory',
            'CREATE TABLE SystemSettings'
        ];
        
        const lines = schemaSQL.split('\n');
        let currentStatement = '';
        let isInTableStatement = false;
        let targetTable = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // コメント行をスキップ
            if (trimmedLine.startsWith('--') || trimmedLine === '') {
                continue;
            }
            
            // CREATE TABLEの開始を検出
            for (const tableStmt of tableStatements) {
                if (trimmedLine.startsWith(tableStmt)) {
                    if (currentStatement.trim()) {
                        // 前のステートメントを実行
                        await executeStatement(pool, currentStatement, targetTable);
                    }
                    isInTableStatement = true;
                    targetTable = tableStmt.split(' ')[2];
                    currentStatement = trimmedLine;
                    break;
                }
            }
            
            if (!isInTableStatement) {
                // CREATE TABLE以外のステートメント
                if (trimmedLine.includes('CREATE INDEX') || trimmedLine.includes('INSERT INTO')) {
                    if (currentStatement.trim()) {
                        await executeStatement(pool, currentStatement, 'OTHER');
                    }
                    currentStatement = trimmedLine;
                    if (trimmedLine.endsWith(';')) {
                        await executeStatement(pool, currentStatement, 'OTHER');
                        currentStatement = '';
                    }
                } else {
                    currentStatement += '\n' + trimmedLine;
                    if (trimmedLine.endsWith(';')) {
                        await executeStatement(pool, currentStatement, 'OTHER');
                        currentStatement = '';
                    }
                }
            } else {
                // CREATE TABLEステートメントの継続
                currentStatement += '\n' + trimmedLine;
                if (trimmedLine.includes(');')) {
                    await executeStatement(pool, currentStatement, targetTable);
                    currentStatement = '';
                    isInTableStatement = false;
                    targetTable = '';
                }
            }
        }
        
        // 最後のステートメントを実行
        if (currentStatement.trim()) {
            await executeStatement(pool, currentStatement, 'FINAL');
        }
        
        console.log('Database schema setup completed!');
        
        // テスト用のクエリを実行
        console.log('\nTesting database...');
        const result = await pool.request().query('SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
        console.log(`Created ${result.recordset[0].table_count} tables`);
        
        // 製品データの確認
        const products = await pool.request().query('SELECT product_name, unit_price FROM Products');
        console.log('\nProducts:');
        products.recordset.forEach(product => {
            console.log(`- ${product.product_name}: ¥${product.unit_price}`);
        });
        
    } catch (error) {
        console.error('Database setup failed:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
        }
    }
}

// スクリプト実行
setupDatabase();