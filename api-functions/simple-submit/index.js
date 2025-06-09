// シンプルな申し込み処理 - Azure Table Storage保存機能付き
const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

const tableClient = TableClient.fromConnectionString(connectionString, "Customers");

module.exports = async function (context, req) {
    context.log('Simple Submit API called');

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

        // Azure Table Storage用のエンティティ作成
        const customerEntity = {
            partitionKey: "Customer",
            rowKey: customerId,
            id: customerId,
            applicationId: applicationId,
            
            // 基本情報
            email: submissionData.basicInformation.email || '',
            organization: submissionData.basicInformation.organizationName || '',
            name: submissionData.basicInformation.contactPerson || '',
            phoneNumber: submissionData.basicInformation.phoneNumber || '',
            contactPhone: submissionData.basicInformation.contactPhone || submissionData.basicInformation.phoneNumber || '',
            department: submissionData.basicInformation.department || '',
            
            // 住所情報
            postalCode: submissionData.basicInformation.postalCode || '',
            prefecture: submissionData.basicInformation.prefecture || '',
            city: submissionData.basicInformation.city || '',
            address: submissionData.basicInformation.address || '',
            addressDetail: submissionData.basicInformation.addressDetail || '',
            
            // 医療機関情報
            facilityType: submissionData.basicInformation.facilityType || '',
            
            // サービス情報
            plan: submissionData.serviceSelection.planId === 'prod-1' ? 'plus' : 'enterprise',
            planId: submissionData.serviceSelection.planId || '',
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount || 1,
            accountCount: submissionData.serviceSelection.requestedAccountCount || 1,
            billingCycle: submissionData.serviceSelection.billingCycle || 'monthly',
            startDate: submissionData.serviceSelection.startDate ? new Date(submissionData.serviceSelection.startDate).toISOString() : '',
            
            // 支払い情報
            paymentMethod: submissionData.paymentInformation.paymentMethod || 'card',
            cardHolderName: submissionData.paymentInformation.cardHolderName || '',
            billingContact: submissionData.paymentInformation.billingContact || submissionData.basicInformation.contactPerson || '',
            billingEmail: submissionData.paymentInformation.billingEmail || submissionData.basicInformation.email || '',
            
            // システム情報
            status: 'trial',
            chatGptAccounts: JSON.stringify([]),
            stripeCustomerId: null,
            
            // 同意フラグ
            termsAccepted: submissionData.paymentInformation.termsAccepted || false,
            privacyAccepted: submissionData.paymentInformation.privacyAccepted || false,
            privacyUnderstandingConfirmed: submissionData.paymentInformation.privacyUnderstandingConfirmed || false,
            
            // タイムスタンプ
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            subscriptionMonths: submissionData.serviceSelection.billingCycle === 'monthly' ? 1 : 12,
            expiresAt: new Date(Date.now() + (submissionData.serviceSelection.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
            
            // 新規申し込みフラグ
            isNewApplication: true
        };

        // Azure Table Storageに保存
        try {
            await tableClient.createEntity(customerEntity);
            context.log('✅ Customer data saved to Azure Table Storage');
        } catch (storageError) {
            context.log.error('❌ Failed to save to Azure Table Storage:', storageError);
            // ストレージエラーでも処理を続行（フォールバック対応）
        }

        // 管理画面用のデータ形式（従来のローカルストレージ連携用）
        const customerData = {
            id: customerId,
            applicationId: applicationId,
            email: submissionData.basicInformation.email || '',
            organization: submissionData.basicInformation.organizationName || '',
            name: submissionData.basicInformation.contactPerson || '',
            phoneNumber: submissionData.basicInformation.phoneNumber || '',
            address: `${submissionData.basicInformation.prefecture || ''} ${submissionData.basicInformation.city || ''} ${submissionData.basicInformation.address || ''}`.trim(),
            facilityType: submissionData.basicInformation.facilityType || '',
            plan: submissionData.serviceSelection.planId === 'prod-1' ? 'plus' : 'enterprise',
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount || 1,
            paymentMethod: submissionData.paymentInformation.paymentMethod || 'card',
            status: 'trial',
            isNewApplication: true,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            chatGptAccounts: [],
            billingCycle: submissionData.serviceSelection.billingCycle || 'monthly',
            subscriptionMonths: submissionData.serviceSelection.billingCycle === 'monthly' ? 1 : 12,
            expiresAt: new Date(Date.now() + (submissionData.serviceSelection.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
            lastActivityAt: new Date().toISOString(),
            stripeCustomerId: null,
            productId: ''
        };

        // 成功レスポンス
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                applicationId: applicationId,
                customerId: customerId,
                message: "申し込みを受け付けました",
                customerData: customerData, // 管理画面で使用するデータ
                data: {
                    applicationId: applicationId,
                    customerId: customerId,
                    status: 'submitted',
                    estimatedProcessingTime: submissionData.paymentInformation.paymentMethod === 'card' ? '当日中' : '1-3営業日',
                    instructions: '管理画面の「申し込み確認」ボタンで新規申し込みを確認してください'
                }
            }
        };

    } catch (error) {
        context.log.error('❌ Error processing application:', error);
        
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