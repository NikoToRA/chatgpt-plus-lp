const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
    // CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // SendGrid API Key の設定
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            context.res = {
                ...context.res,
                status: 500,
                body: { error: 'SendGrid API key not configured' }
            };
            return;
        }

        sgMail.setApiKey(apiKey);

        // リクエストボディから必要な情報を取得
        const { to, subject, text, attachments } = req.body;

        if (!to || !subject || !text) {
            context.res = {
                ...context.res,
                status: 400,
                body: { error: 'Missing required fields: to, subject, text' }
            };
            return;
        }

        // 送信者メールアドレス（環境変数から取得）
        const fromEmail = process.env.FROM_EMAIL || 'noreply@wonderdrill.com';
        const fromName = process.env.FROM_NAME || '株式会社WonderDrill';

        // メールオブジェクトを作成
        const msg = {
            to: to,
            from: {
                email: fromEmail,
                name: fromName
            },
            subject: subject,
            text: text,
            html: `<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`
        };

        // 添付ファイルがある場合は追加
        if (attachments && attachments.length > 0) {
            msg.attachments = attachments.map(attachment => ({
                content: attachment.content,
                filename: attachment.filename,
                type: attachment.type || 'text/plain',
                disposition: attachment.disposition || 'attachment'
            }));
        }

        // メール送信
        await sgMail.send(msg);

        context.log(`Email sent successfully to ${to}`);
        
        context.res = {
            ...context.res,
            status: 200,
            body: {
                success: true,
                message: 'Email sent successfully',
                to: to,
                subject: subject
            }
        };

    } catch (error) {
        context.log.error('SendGrid Error:', error);
        
        // SendGridのエラーレスポンスを詳細にログ出力
        if (error.response) {
            context.log.error('SendGrid Error Response:', error.response.body);
        }

        context.res = {
            ...context.res,
            status: 500,
            body: {
                error: 'Failed to send email',
                details: error.message,
                sendgridError: error.response?.body || null
            }
        };
    }
};