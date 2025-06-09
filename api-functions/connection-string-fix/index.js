// 接続文字列の詳細検証と修正API
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Connection String Fix API called');

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

    const fixResults = {
        timestamp: new Date().toISOString(),
        originalConnectionString: '',
        fixedConnectionString: '',
        issues: [],
        testResults: {}
    };

    try {
        // 接続文字列の取得
        let originalConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
            process.env.STORAGE_CONNECTION_STRING || 
            "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";
        
        fixResults.originalConnectionString = originalConnectionString.substring(0, 100) + '...';
        
        context.log('Original connection string length:', originalConnectionString.length);
        context.log('Original connection string preview:', originalConnectionString.substring(0, 100));

        // 接続文字列の詳細解析
        const parts = originalConnectionString.split(';');
        const parsedParts = {};
        
        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                parsedParts[key] = value;
            }
        });
        
        context.log('Parsed connection string parts:', Object.keys(parsedParts));
        
        // 問題のチェック
        if (!parsedParts.DefaultEndpointsProtocol) {
            fixResults.issues.push('Missing DefaultEndpointsProtocol');
        }
        if (!parsedParts.AccountName) {
            fixResults.issues.push('Missing AccountName');
        }
        if (!parsedParts.AccountKey) {
            fixResults.issues.push('Missing AccountKey');
        }
        if (!parsedParts.EndpointSuffix) {
            fixResults.issues.push('Missing EndpointSuffix');
        }

        // 修正された接続文字列を構築
        const fixedConnectionString = [
            `DefaultEndpointsProtocol=${parsedParts.DefaultEndpointsProtocol || 'https'}`,
            `AccountName=${parsedParts.AccountName || 'koereqqstorage'}`,
            `AccountKey=${parsedParts.AccountKey || 'VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg=='}`,
            `EndpointSuffix=${parsedParts.EndpointSuffix || 'core.windows.net'}`
        ].join(';');
        
        fixResults.fixedConnectionString = fixedConnectionString.substring(0, 100) + '...';
        
        context.log('Fixed connection string:', fixedConnectionString.substring(0, 100));

        // 修正された接続文字列でテスト
        try {
            context.log('Testing with fixed connection string...');
            const testTableClient = new TableClient(fixedConnectionString, "TestTable");
            
            fixResults.testResults.tableClientCreation = 'SUCCESS';
            context.log('✅ TableClient creation successful with fixed string');
            
            // 実際にテーブル作成をテスト
            try {
                await testTableClient.createTable();
                fixResults.testResults.tableCreation = 'SUCCESS';
                context.log('✅ Table creation successful');
            } catch (tableError) {
                if (tableError.code === 'TableAlreadyExists') {
                    fixResults.testResults.tableCreation = 'SUCCESS (already exists)';
                } else {
                    fixResults.testResults.tableCreation = `FAILED: ${tableError.message}`;
                }
            }
            
        } catch (fixedTestError) {
            fixResults.testResults.tableClientCreation = `FAILED: ${fixedTestError.message}`;
            context.log('❌ TableClient creation still fails:', fixedTestError.message);
        }

        // 空白文字や特殊文字の確認
        const connectionStringBytes = Buffer.from(originalConnectionString, 'utf8');
        fixResults.connectionStringAnalysis = {
            length: originalConnectionString.length,
            byteLength: connectionStringBytes.length,
            hasInvisibleChars: originalConnectionString.length !== originalConnectionString.trim().length,
            endsWithSemicolon: originalConnectionString.endsWith(';'),
            containsLineBreaks: originalConnectionString.includes('\n') || originalConnectionString.includes('\r')
        };
        
        // クリーンアップされた接続文字列
        const cleanedConnectionString = originalConnectionString
            .trim()
            .replace(/\r\n/g, '')
            .replace(/\n/g, '')
            .replace(/\r/g, '');
            
        if (cleanedConnectionString !== originalConnectionString) {
            fixResults.issues.push('Connection string contains whitespace or line breaks');
            
            // クリーンアップされた文字列でテスト
            try {
                const cleanTestTableClient = new TableClient(cleanedConnectionString, "TestTable");
                fixResults.testResults.cleanedStringTest = 'SUCCESS';
                context.log('✅ TableClient creation successful with cleaned string');
            } catch (cleanError) {
                fixResults.testResults.cleanedStringTest = `FAILED: ${cleanError.message}`;
            }
        }

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: fixResults
        };

    } catch (error) {
        context.log.error('❌ Error in connection string fix:', error);
        
        fixResults.error = {
            message: error.message,
            stack: error.stack
        };
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: fixResults
        };
    }
};