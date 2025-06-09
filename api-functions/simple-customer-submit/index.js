// シンプルな申し込み処理API - エラーハンドリング強化版
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Simple Customer Submit API called');

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

    try {
        const submissionData = req.body;
        context.log('Received submission data:', JSON.stringify(submissionData, null, 2));
        
        // 基本的なバリデーション
        if (!submissionData || !submissionData.serviceSelection || !submissionData.basicInformation) {
            context.res = {
                status: 400,
                headers: corsHeaders,
                body: {
                    success: false,
                    message: "必須フィールドが不足しています"
                }
            };
            return;
        }

        // アプリケーションID生成
        const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        const customerId = `customer-${Date.now()}`;
        
        context.log('Generated IDs:', { applicationId, customerId });

        // 環境変数の詳細ログ
        context.log('Environment variables check:');
        context.log('- AzureWebJobsStorage exists:', !!process.env.AzureWebJobsStorage);
        context.log('- AZURE_STORAGE_CONNECTION_STRING exists:', !!process.env.AZURE_STORAGE_CONNECTION_STRING);
        
        // 接続文字列の確認（Azure Static Web Apps対応環境変数から取得）
        let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        
        if (!connectionString) {
            connectionString = process.env.STORAGE_CONNECTION_STRING;
        }
        
        if (!connectionString) {
            // フォールバック用の接続文字列
            connectionString = "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";
        }
        
        context.log('Connection string source:', 
            process.env.AZURE_STORAGE_CONNECTION_STRING ? 'AZURE_STORAGE_CONNECTION_STRING' : 
            process.env.STORAGE_CONNECTION_STRING ? 'STORAGE_CONNECTION_STRING' : 
            'default fallback');
        
        // 接続文字列の詳細検証
        context.log('Connection string length:', connectionString.length);
        context.log('Connection string starts with:', connectionString.substring(0, 50));
        context.log('Connection string contains AccountName:', connectionString.includes('AccountName='));
        context.log('Connection string contains AccountKey:', connectionString.includes('AccountKey='));
        
        // 接続文字列の基本フォーマット検証
        if (!connectionString || typeof connectionString !== 'string') {
            throw new Error('Connection string is null or not a string');
        }
        
        if (!connectionString.includes('AccountName=') || !connectionString.includes('AccountKey=')) {
            throw new Error('Connection string missing required AccountName or AccountKey');
        }

        // TableClient作成の詳細エラーハンドリング
        let customerTableClient;
        try {
            context.log('Attempting to create TableClient with Customers table...');
            customerTableClient = new TableClient(connectionString, "Customers");
            context.log('✅ TableClient created successfully');
        } catch (tableClientError) {
            context.log.error('❌ TableClient creation failed:', tableClientError.message);
            context.log.error('Error stack:', tableClientError.stack);
            
            // より詳細なエラー情報を提供
            if (tableClientError.message.includes('Invalid URL')) {
                context.log.error('URL parsing error detected. Connection string format issue.');
                context.log.error('Connection string components check:');
                const parts = connectionString.split(';');
                parts.forEach((part, index) => {
                    context.log.error(`  ${index}: ${part}`);
                });
            }
            
            throw new Error(`TableClient creation failed: ${tableClientError.message}`);
        }
        
        try {
            context.log('Attempting to create/verify Customers table...');
            await customerTableClient.createTable();
            context.log('✅ Customers table verified/created successfully');
        } catch (tableCreateError) {
            context.log.error('❌ Table creation error:', tableCreateError.message);
            context.log.error('Table creation error stack:', tableCreateError.stack);
            // テーブル作成エラーでも続行（既存テーブルの可能性）
            if (tableCreateError.code === 'TableAlreadyExists') {
                context.log('Table already exists, continuing...');
            }
        }
        
        // シンプルな顧客エンティティ
        const customerEntity = {
            partitionKey: "Customer",
            rowKey: customerId,
            
            // 基本情報
            id: customerId,
            applicationId: applicationId,
            email: submissionData.basicInformation.email || '',
            organization: submissionData.basicInformation.organizationName || '',
            name: submissionData.basicInformation.contactPerson || '',
            phoneNumber: submissionData.basicInformation.phoneNumber || '',
            address: `${submissionData.basicInformation.prefecture || ''} ${submissionData.basicInformation.city || ''} ${submissionData.basicInformation.address || ''}`.trim(),
            facilityType: submissionData.basicInformation.facilityType || '',
            
            // サービス情報
            plan: submissionData.serviceSelection.planId === 'prod-1' ? 'plus' : 'enterprise',
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount || 1,
            paymentMethod: submissionData.paymentInformation.paymentMethod || 'card',
            
            // ステータス
            status: 'trial',
            isNewApplication: true,
            
            // タイムスタンプ
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            registeredAt: new Date().toISOString(),
            
            // その他
            chatGptAccounts: '[]', // JSON文字列として保存
            billingCycle: submissionData.serviceSelection.billingCycle || 'monthly'
        };
        
        context.log('Customer entity to save:', JSON.stringify(customerEntity, null, 2));

        try {
            context.log('Attempting to save customer entity...');
            await customerTableClient.createEntity(customerEntity);
            context.log('✅ Customer successfully saved to table:', customerId);
        } catch (saveError) {
            context.log.error('❌ Error saving customer entity:', saveError.message);
            context.log.error('Save error stack:', saveError.stack);
            context.log.error('Entity data that failed to save:', JSON.stringify(customerEntity, null, 2));
            throw new Error(`Customer save failed: ${saveError.message}`);
        }

        // 成功レスポンス
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                applicationId: applicationId,
                customerId: customerId,
                message: "申し込みを受け付けました",
                data: {
                    applicationId: applicationId,
                    customerId: customerId,
                    status: 'saved_to_azure_table',
                    estimatedProcessingTime: submissionData.paymentInformation.paymentMethod === 'card' ? '当日中' : '1-3営業日'
                }
            }
        };

    } catch (error) {
        context.log.error('❌ Error processing customer application:', error);
        context.log.error('Error stack:', error.stack);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                error: error.message,
                errorDetails: error.stack,
                message: "申し込み処理中にエラーが発生しました"
            }
        };
    }
};