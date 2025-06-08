// シンプルな申し込み処理API - Azure Static Web Apps用
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