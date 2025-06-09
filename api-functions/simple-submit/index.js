// シンプルな申し込み処理 - ローカルストレージ連携
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

        // 管理画面用のデータ形式
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
        
        context.log('✅ Customer data prepared for local storage sync');

        // 成功レスポンス（管理画面のローカルストレージで使用）
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