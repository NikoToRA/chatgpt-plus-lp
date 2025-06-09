// Azure Table Storage データ確認用デバッグAPI
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Debug Azure Data API called');

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

    const debugResults = {
        timestamp: new Date().toISOString(),
        tables: {},
        connectionTest: null,
        errors: []
    };

    try {
        // 接続文字列の取得
        const connectionString = process.env.AzureWebJobsStorage || 
            process.env.AZURE_STORAGE_CONNECTION_STRING || 
            "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";
        
        context.log('Using connection string source:', 
            process.env.AzureWebJobsStorage ? 'AzureWebJobsStorage' : 
            process.env.AZURE_STORAGE_CONNECTION_STRING ? 'AZURE_STORAGE_CONNECTION_STRING' : 
            'hardcoded fallback');

        // 1. Customersテーブルの確認
        try {
            const customerTableClient = new TableClient(connectionString, "Customers");
            
            debugResults.connectionTest = 'SUCCESS - TableClient created';
            
            // データ数をカウント
            const customerEntities = [];
            const entities = customerTableClient.listEntities({
                queryOptions: { filter: "PartitionKey eq 'Customer'" }
            });
            
            for await (const entity of entities) {
                customerEntities.push({
                    id: entity.id || entity.rowKey,
                    email: entity.email,
                    organization: entity.organization,
                    name: entity.name,
                    createdAt: entity.createdAt || entity.timestamp,
                    isNewApplication: entity.isNewApplication,
                    applicationId: entity.applicationId,
                    // 個人情報を除外した基本情報のみ
                });
            }
            
            debugResults.tables.Customers = {
                exists: true,
                count: customerEntities.length,
                recentEntries: customerEntities.slice(-5), // 最新5件
                lastModified: customerEntities.length > 0 ? 
                    Math.max(...customerEntities.map(e => new Date(e.createdAt || 0).getTime())) : null
            };
            
            context.log(`Found ${customerEntities.length} customers in table`);
            
        } catch (customerError) {
            debugResults.errors.push({
                table: 'Customers',
                error: customerError.message,
                code: customerError.code
            });
            context.log.error('Customers table error:', customerError);
        }

        // 2. CustomerApplicationsテーブルの確認
        try {
            const applicationTableClient = new TableClient(connectionString, "CustomerApplications");
            
            const applicationEntities = [];
            const appEntities = applicationTableClient.listEntities({
                queryOptions: { filter: "PartitionKey eq 'CustomerApplication'" }
            });
            
            for await (const entity of appEntities) {
                applicationEntities.push({
                    applicationId: entity.applicationId || entity.rowKey,
                    organizationName: entity.organizationName,
                    email: entity.email,
                    submittedAt: entity.submittedAt || entity.timestamp,
                    status: entity.status
                });
            }
            
            debugResults.tables.CustomerApplications = {
                exists: true,
                count: applicationEntities.length,
                recentEntries: applicationEntities.slice(-5)
            };
            
            context.log(`Found ${applicationEntities.length} applications in table`);
            
        } catch (applicationError) {
            debugResults.errors.push({
                table: 'CustomerApplications',
                error: applicationError.message,
                code: applicationError.code
            });
            context.log.error('CustomerApplications table error:', applicationError);
        }

        // 3. 今日の申し込み数をカウント
        const today = new Date().toISOString().split('T')[0];
        const todayApplications = debugResults.tables.Customers?.recentEntries?.filter(c => 
            c.createdAt?.startsWith(today)
        ) || [];
        
        debugResults.todayApplications = todayApplications.length;
        debugResults.newApplications = debugResults.tables.Customers?.recentEntries?.filter(c => 
            c.isNewApplication === true
        ) || [];

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: debugResults
        };

    } catch (error) {
        context.log.error('❌ Error in debug API:', error);
        
        debugResults.connectionTest = 'FAILED';
        debugResults.errors.push({
            general: error.message,
            stack: error.stack
        });
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: debugResults
        };
    }
};