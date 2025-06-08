// 申し込みデータ取得API - 管理画面用
module.exports = async function (context, req) {
    context.log('Customer Applications API called');

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
        // 簡単なストレージ（実際はAzure Table Storageやコンテキストから取得）
        // 今回はメモリベースのシンプルな実装
        const applications = context.applicationData || [];
        
        context.log('Retrieved applications:', applications.length);

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: applications
        };

    } catch (error) {
        context.log.error('Error fetching applications:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: error.message,
                message: "申し込みデータの取得に失敗しました"
            }
        };
    }
};