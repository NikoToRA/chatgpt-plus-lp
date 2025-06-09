// フォールバック用シンプルな申し込み処理API - ファイルベース
const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
    context.log('Fallback Customer Submit API called');

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

        // シンプルなファイルベース保存（テスト用）
        const customerData = {
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
        
        // ローカルファイルに保存（デバッグ用）
        try {
            const dataDir = '/tmp';
            const filePath = path.join(dataDir, `customer-${Date.now()}.json`);
            
            fs.writeFileSync(filePath, JSON.stringify(customerData, null, 2));
            context.log('✅ Customer data saved to file:', filePath);
        } catch (fileError) {
            context.log('File save error (non-critical):', fileError.message);
        }

        // 成功レスポンス
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                applicationId: applicationId,
                customerId: customerId,
                message: "申し込みを受け付けました（フォールバックモード）",
                data: {
                    applicationId: applicationId,
                    customerId: customerId,
                    status: 'saved_to_fallback_storage',
                    estimatedProcessingTime: submissionData.paymentInformation.paymentMethod === 'card' ? '当日中' : '1-3営業日',
                    note: 'フォールバック用APIを使用しました'
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
                message: "申し込み処理中にエラーが発生しました（フォールバック）"
            }
        };
    }
};