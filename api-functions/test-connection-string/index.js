// 接続文字列のテスト用API
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Connection String Test API called');

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
        environmentVariables: {},
        connectionStringTests: [],
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    };

    try {
        // 1. 環境変数の確認
        testResults.environmentVariables = {
            AzureWebJobsStorage: !!process.env.AzureWebJobsStorage,
            AZURE_STORAGE_CONNECTION_STRING: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
            NODE_ENV: process.env.NODE_ENV || 'undefined',
            WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME || 'undefined'
        };

        context.log('Environment variables check:', testResults.environmentVariables);

        // 2. 接続文字列のリスト
        const connectionStrings = [];
        
        if (process.env.AzureWebJobsStorage) {
            connectionStrings.push({
                name: 'AzureWebJobsStorage (env)',
                value: process.env.AzureWebJobsStorage
            });
        }
        
        if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
            connectionStrings.push({
                name: 'AZURE_STORAGE_CONNECTION_STRING (env)',
                value: process.env.AZURE_STORAGE_CONNECTION_STRING
            });
        }
        
        // フォールバック
        connectionStrings.push({
            name: 'Hardcoded Fallback',
            value: "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net"
        });

        // 3. 各接続文字列をテスト
        for (const connStr of connectionStrings) {
            const testResult = {
                name: connStr.name,
                length: connStr.value ? connStr.value.length : 0,
                hasAccountName: connStr.value ? connStr.value.includes('AccountName=') : false,
                hasAccountKey: connStr.value ? connStr.value.includes('AccountKey=') : false,
                hasProtocol: connStr.value ? connStr.value.includes('DefaultEndpointsProtocol=') : false,
                hasEndpoint: connStr.value ? connStr.value.includes('EndpointSuffix=') : false,
                firstChars: connStr.value ? connStr.value.substring(0, 50) : 'null',
                tableClientTest: null,
                error: null
            };

            if (connStr.value) {
                try {
                    context.log(`Testing connection string: ${connStr.name}`);
                    
                    // TableClientの作成をテスト
                    const testTableClient = new TableClient(connStr.value, "TestTable");
                    testResult.tableClientTest = 'SUCCESS - TableClient created';
                    
                    context.log(`✅ ${connStr.name}: TableClient creation successful`);
                    
                } catch (error) {
                    testResult.tableClientTest = 'FAILED';
                    testResult.error = {
                        message: error.message,
                        name: error.name,
                        code: error.code || 'unknown'
                    };
                    
                    context.log(`❌ ${connStr.name}: ${error.message}`);
                }
            } else {
                testResult.error = { message: 'Connection string is null or empty' };
            }

            testResults.connectionStringTests.push(testResult);
        }

        // 4. 推奨アクション
        const recommendations = [];
        
        if (!testResults.environmentVariables.AzureWebJobsStorage && !testResults.environmentVariables.AZURE_STORAGE_CONNECTION_STRING) {
            recommendations.push('環境変数にAzureWebJobsStorageまたはAZURE_STORAGE_CONNECTION_STRINGを設定してください');
        }
        
        const hasSuccessfulConnection = testResults.connectionStringTests.some(test => test.tableClientTest === 'SUCCESS - TableClient created');
        
        if (!hasSuccessfulConnection) {
            recommendations.push('すべての接続文字列でTableClient作成に失敗しています。Azure Portalでの設定を確認してください');
        }

        testResults.recommendations = recommendations;

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: testResults
        };

    } catch (error) {
        context.log.error('❌ Error in connection test:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                error: error.message,
                testResults: testResults,
                message: "接続テスト中にエラーが発生しました"
            }
        };
    }
};