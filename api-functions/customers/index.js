// シンプルな顧客データ取得API - Azure Static Web Apps用
module.exports = async function (context, req) {
    context.log('Customers API called');

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
        // ダミーの顧客データを返す（開発用）
        const customers = [
            {
                id: 'customer-1',
                email: 'test@hospital.com',
                organization: 'テスト総合病院',
                name: 'テスト太郎',
                phoneNumber: '03-1234-5678',
                postalCode: '100-0001',
                address: '東京都千代田区丸の内1-1-1',
                facilityType: 'hospital',
                plan: 'plus',
                accountCount: 4,
                paymentMethod: 'card',
                status: 'active',
                registeredAt: new Date('2024-01-01').toISOString(),
                createdAt: new Date('2024-01-01').toISOString(),
                chatGptAccounts: [
                    {
                        id: 'gpt-1',
                        email: 'test1@chatgpt.com',
                        isActive: true,
                        createdAt: new Date('2024-01-01')
                    }
                ]
            }
        ];

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: customers
        };

    } catch (error) {
        context.log.error('Error fetching customers:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: error.message,
                message: "顧客データの取得に失敗しました"
            }
        };
    }
};