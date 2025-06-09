// SendGrid を使用したメール送信 API
const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
    context.log('Send Email API called');

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
        // SendGrid API キーの設定
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SendGrid API key not configured');
        }
        
        sgMail.setApiKey(apiKey);

        const { to, subject, text, html, type = 'general' } = req.body;

        if (!to || !subject) {
            context.res = {
                status: 400,
                headers: corsHeaders,
                body: {
                    success: false,
                    message: "必須フィールド（to, subject）が不足しています"
                }
            };
            return;
        }

        // メールテンプレート
        const getEmailTemplate = (type, data = {}) => {
            switch (type) {
                case 'welcome':
                    return {
                        subject: 'ChatGPT Plus サービスへようこそ',
                        html: `
                            <h2>申し込みありがとうございます</h2>
                            <p>${data.organizationName} 様</p>
                            <p>ChatGPT Plus サービスへのお申し込みを受け付けました。</p>
                            <p><strong>申し込み内容：</strong></p>
                            <ul>
                                <li>プラン: ${data.plan}</li>
                                <li>アカウント数: ${data.accountCount}</li>
                                <li>支払い方法: ${data.paymentMethod}</li>
                            </ul>
                            <p>担当者より1-2営業日以内にご連絡いたします。</p>
                        `
                    };
                case 'admin_notification':
                    return {
                        subject: '新規申し込み通知',
                        html: `
                            <h2>新規申し込みがありました</h2>
                            <p><strong>組織名:</strong> ${data.organizationName}</p>
                            <p><strong>担当者:</strong> ${data.contactPerson}</p>
                            <p><strong>メール:</strong> ${data.email}</p>
                            <p><strong>プラン:</strong> ${data.plan}</p>
                            <p><strong>アカウント数:</strong> ${data.accountCount}</p>
                            <p>管理画面で詳細を確認してください。</p>
                        `
                    };
                default:
                    return {
                        subject: subject,
                        html: html || text
                    };
            }
        };

        const template = getEmailTemplate(type, req.body.data);
        
        const msg = {
            to: to,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@chatgpt-plus.com',
            subject: template.subject,
            html: template.html
        };

        await sgMail.send(msg);

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                message: "メールを送信しました"
            }
        };

    } catch (error) {
        context.log.error('SendGrid email error:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                error: error.message,
                message: "メール送信に失敗しました"
            }
        };
    }
};