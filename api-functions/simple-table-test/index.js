// シンプルなテーブル接続テスト - REST API直接使用
const https = require('https');

module.exports = async function (context, req) {
    context.log('Simple Table Test API called');

    // CORS設定
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
    };

    // OPTIONSリクエスト（CORS preflight）の処理
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders
        };
        return;
    }

    const testResults = {
        timestamp: new Date().toISOString(),
        libraryTest: null,
        restApiTest: null,
        connectionString: null
    };

    try {
        // 接続文字列の取得
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
            process.env.STORAGE_CONNECTION_STRING;
        
        if (!connectionString) {
            throw new Error('No connection string found in environment variables');
        }

        // 接続文字列を解析
        const parts = connectionString.split(';');
        const config = {};
        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                config[key] = value;
            }
        });

        testResults.connectionString = {
            hasAccountName: !!config.AccountName,
            hasAccountKey: !!config.AccountKey,
            hasProtocol: !!config.DefaultEndpointsProtocol,
            accountName: config.AccountName,
            protocol: config.DefaultEndpointsProtocol
        };

        // 1. @azure/data-tables ライブラリのテスト
        try {
            const { TableClient } = require("@azure/data-tables");
            
            // 接続文字列をクリーンアップ
            const cleanConnectionString = connectionString.trim().replace(/[\r\n]/g, '');
            
            const tableClient = new TableClient(cleanConnectionString, "Customers");
            testResults.libraryTest = 'SUCCESS - TableClient created';
            context.log('✅ @azure/data-tables library test passed');
            
            // テーブル作成テスト
            try {
                await tableClient.createTable();
                testResults.libraryTest += ' and table created';
            } catch (tableError) {
                if (tableError.code === 'TableAlreadyExists') {
                    testResults.libraryTest += ' and table exists';
                } else {
                    testResults.libraryTest += ` but table creation failed: ${tableError.message}`;
                }
            }
            
        } catch (libraryError) {
            testResults.libraryTest = `FAILED: ${libraryError.message}`;
            context.log('❌ @azure/data-tables library test failed:', libraryError.message);
        }

        // 2. REST API 直接テスト
        try {
            const accountName = config.AccountName;
            const accountKey = config.AccountKey;
            
            if (!accountName || !accountKey) {
                throw new Error('Missing account name or key');
            }

            // REST API URL
            const url = `https://${accountName}.table.core.windows.net/Tables`;
            
            testResults.restApiTest = 'URL constructed successfully';
            context.log('✅ REST API URL constructed:', url);
            
            // 簡単な認証ヘッダー生成（テスト用）
            const crypto = require('crypto');
            const timestamp = new Date().toUTCString();
            
            testResults.restApiTest += `, timestamp: ${timestamp}`;
            
        } catch (restError) {
            testResults.restApiTest = `FAILED: ${restError.message}`;
            context.log('❌ REST API test failed:', restError.message);
        }

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: testResults
        };

    } catch (error) {
        context.log.error('❌ Error in simple table test:', error);
        
        testResults.error = {
            message: error.message,
            stack: error.stack
        };
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: testResults
        };
    }
};