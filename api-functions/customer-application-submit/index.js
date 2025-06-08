// Azure Table Storage を使用した申し込み処理API
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Customer Application Submit API called');

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
        
        context.log('Application ID generated:', applicationId);
        context.log('Submission data received:', JSON.stringify(submissionData, null, 2));

        // シンプルにローカルストレージ用のデータ形式で返す
        const customerData = {
            id: `customer-${Date.now()}`,
            applicationId: applicationId,
            email: submissionData.basicInformation.email,
            organization: submissionData.basicInformation.organizationName,
            name: submissionData.basicInformation.contactPerson,
            phoneNumber: submissionData.basicInformation.phoneNumber,
            postalCode: submissionData.basicInformation.postalCode,
            address: `${submissionData.basicInformation.prefecture} ${submissionData.basicInformation.city} ${submissionData.basicInformation.address}`,
            facilityType: submissionData.basicInformation.facilityType,
            plan: submissionData.serviceSelection.planId === 'prod-1' ? 'plus' : 'enterprise',
            accountCount: submissionData.serviceSelection.requestedAccountCount,
            paymentMethod: submissionData.paymentInformation.paymentMethod,
            status: 'trial',
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString()
        };

        // Azure Table Storage への直接保存
        const connectionString = process.env.AzureWebJobsStorage || 
            process.env.AZURE_STORAGE_CONNECTION_STRING || 
            "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

        // CustomerApplications テーブルに保存
        const applicationTableClient = new TableClient(connectionString, "CustomerApplications");
        await applicationTableClient.createTable();

        const applicationEntity = {
            partitionKey: "CustomerApplication",
            rowKey: applicationId,
            applicationId: applicationId,
            
            // Service Selection
            planId: submissionData.serviceSelection.planId,
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount,
            billingCycle: submissionData.serviceSelection.billingCycle,
            startDate: submissionData.serviceSelection.startDate,
            
            // Basic Information
            organizationName: submissionData.basicInformation.organizationName,
            facilityType: submissionData.basicInformation.facilityType,
            postalCode: submissionData.basicInformation.postalCode,
            prefecture: submissionData.basicInformation.prefecture,
            city: submissionData.basicInformation.city,
            address: submissionData.basicInformation.address,
            phoneNumber: submissionData.basicInformation.phoneNumber,
            contactPerson: submissionData.basicInformation.contactPerson,
            department: submissionData.basicInformation.department || '',
            email: submissionData.basicInformation.email,
            contactPhone: submissionData.basicInformation.contactPhone || '',
            
            // Payment Information
            paymentMethod: submissionData.paymentInformation.paymentMethod,
            cardHolderName: submissionData.paymentInformation.cardHolderName || '',
            billingContact: submissionData.paymentInformation.billingContact || '',
            billingEmail: submissionData.paymentInformation.billingEmail || '',
            termsAccepted: submissionData.paymentInformation.termsAccepted,
            privacyAccepted: submissionData.paymentInformation.privacyAccepted,
            
            // Metadata
            submittedAt: new Date().toISOString(),
            status: 'new_application',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isNewApplication: true
        };

        await applicationTableClient.createEntity(applicationEntity);
        context.log('Application saved to CustomerApplications table:', applicationId);

        // Customers テーブルにも保存（管理画面での表示用）
        const customerTableClient = new TableClient(connectionString, "Customers");
        await customerTableClient.createTable();
        
        const customerEntity = {
            partitionKey: "Customer",
            rowKey: customerData.id,
            
            // 管理画面で表示するための基本情報
            id: customerData.id,
            email: customerData.email,
            organization: customerData.organization,
            name: customerData.name,
            phoneNumber: customerData.phoneNumber,
            postalCode: customerData.postalCode,
            address: customerData.address,
            facilityType: customerData.facilityType,
            plan: customerData.plan,
            accountCount: customerData.accountCount,
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount,
            paymentMethod: customerData.paymentMethod,
            status: customerData.status,
            
            // タイムスタンプ
            registeredAt: customerData.registeredAt,
            createdAt: customerData.createdAt,
            submittedAt: customerData.submittedAt,
            
            // 申し込み関連
            applicationId: applicationId,
            isNewApplication: true,
            
            // ChatGPTアカウント（初期状態では空の配列）
            chatGptAccounts: JSON.stringify([]),
            
            // 追加フィールド
            billingCycle: submissionData.serviceSelection.billingCycle,
            startDate: submissionData.serviceSelection.startDate,
            department: submissionData.basicInformation.department || '',
            contactPhone: submissionData.basicInformation.contactPhone || '',
            prefecture: submissionData.basicInformation.prefecture,
            city: submissionData.basicInformation.city,
            
            // 有効期限設定（トライアルなので3ヶ月後）
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            subscriptionMonths: submissionData.serviceSelection.billingCycle === 'monthly' ? 1 : 12
        };

        await customerTableClient.createEntity(customerEntity);
        context.log('Customer saved to Customers table:', customerData.id);

        // 成功レスポンス
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                applicationId: applicationId,
                message: "申し込みを受け付けました",
                customerData: customerData,
                data: {
                    applicationId: applicationId,
                    status: 'pending_review',
                    estimatedProcessingTime: submissionData.paymentInformation.paymentMethod === 'card' ? '当日中' : '1-3営業日'
                }
            }
        };

    } catch (error) {
        context.log.error('Error processing application:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                error: error.message,
                message: "申し込み処理中にエラーが発生しました"
            }
        };
    }
};