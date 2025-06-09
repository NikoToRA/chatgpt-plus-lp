// Gmail SMTP を使用した確実なメール送信 API
const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    context.log('Gmail Send API called');

    // CORS設定
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers: corsHeaders };
        return;
    }

    try {
        // Gmail SMTP設定
        const gmailUser = process.env.COMPANY_EMAIL || process.env.GMAIL_USER;
        const gmailPassword = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;

        if (!gmailUser || !gmailPassword) {
            context.res = {
                status: 500,
                headers: corsHeaders,
                body: { 
                    success: false, 
                    error: 'Gmail credentials not configured',
                    message: 'COMPANY_EMAIL と GMAIL_APP_PASSWORD を設定してください' 
                }
            };
            return;
        }

        // nodemailer transporter 作成
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPassword
            }
        });

        const { to, subject, html, text, type = 'general', customerData, invoiceData } = req.body;

        if (!to || !subject) {
            context.res = {
                status: 400,
                headers: corsHeaders,
                body: { success: false, message: "必須フィールド（to, subject）が不足しています" }
            };
            return;
        }

        // メールテンプレート
        const getEmailContent = (type, data = {}) => {
            switch (type) {
                case 'invoice':
                    return {
                        subject: `【Wonder Drill】ChatGPT Plus サービス ご請求書 - ${data.organization || ''}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px;">
                                    <h1 style="color: #1976d2; margin: 0;">Wonder Drill株式会社</h1>
                                    <p style="color: #666; margin: 5px 0 0 0;">ChatGPT医療機関向け運用代行サービス</p>
                                </div>
                                
                                <h2 style="color: #333;">ご請求書のお送り</h2>
                                
                                <p>${data.organization || ''} 様</p>
                                
                                <p>いつもお世話になっております。<br>
                                Wonder Drill株式会社です。</p>
                                
                                <p>ChatGPT Plus サービスのご請求書をお送りいたします。</p>
                                
                                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                    <h3 style="color: #1976d2; margin: 0 0 15px 0;">📋 請求内容</h3>
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 10px 0; font-weight: bold;">プラン:</td>
                                            <td style="padding: 10px 0;">${data.plan || 'ChatGPT Plus'}</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 10px 0; font-weight: bold;">アカウント数:</td>
                                            <td style="padding: 10px 0;">${data.accountCount || 1}アカウント</td>
                                        </tr>
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 10px 0; font-weight: bold;">月額料金:</td>
                                            <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #1976d2;">¥${(data.totalAmount || 3000).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0; font-weight: bold;">お支払い期限:</td>
                                            <td style="padding: 10px 0; color: #dc3545; font-weight: bold;">${data.dueDate || '請求書発行日から30日以内'}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                    <h3 style="color: #1976d2; margin: 0 0 15px 0;">🏦 お振込先</h3>
                                    <table style="width: 100%;">
                                        <tr><td style="padding: 3px 0; font-weight: bold; width: 100px;">銀行名:</td><td style="padding: 3px 0;">[銀行名をここに設定]</td></tr>
                                        <tr><td style="padding: 3px 0; font-weight: bold;">支店名:</td><td style="padding: 3px 0;">[支店名をここに設定]</td></tr>
                                        <tr><td style="padding: 3px 0; font-weight: bold;">口座種別:</td><td style="padding: 3px 0;">普通</td></tr>
                                        <tr><td style="padding: 3px 0; font-weight: bold;">口座番号:</td><td style="padding: 3px 0;">[口座番号をここに設定]</td></tr>
                                        <tr><td style="padding: 3px 0; font-weight: bold;">口座名義:</td><td style="padding: 3px 0;">Wonder Drill株式会社</td></tr>
                                    </table>
                                </div>
                                
                                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                                    <p style="margin: 0; color: #856404;">
                                        <strong>💡 お支払い確認後、ChatGPTアカウント情報をお送りいたします。</strong><br>
                                        通常1-2営業日でサービス開始となります。
                                    </p>
                                </div>
                                
                                <p>ご不明な点がございましたら、お気軽にお問い合わせください。<br>
                                今後ともよろしくお願いいたします。</p>
                                
                                <hr style="margin: 40px 0; border: none; border-top: 1px solid #e9ecef;">
                                <div style="color: #6c757d; font-size: 14px;">
                                    <p style="margin: 5px 0;"><strong>Wonder Drill株式会社</strong></p>
                                    <p style="margin: 5px 0;">ChatGPT医療機関向け運用代行サービス</p>
                                    <p style="margin: 5px 0;">Email: ${gmailUser}</p>
                                    <p style="margin: 5px 0;">お問い合わせ: ${gmailUser}</p>
                                </div>
                            </div>
                        `
                    };
                case 'welcome':
                    return {
                        subject: `【Wonder Drill】ChatGPT Plus サービスへようこそ - ${data.organization || ''}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #1976d2;">申し込みありがとうございます</h2>
                                <p>${data.organization || ''} 様</p>
                                <p>ChatGPT Plus サービスへのお申し込みを受け付けました。</p>
                                <p>担当者より1-2営業日以内にご連絡いたします。</p>
                            </div>
                        `
                    };
                default:
                    return {
                        subject: subject,
                        html: html || text?.replace(/\n/g, '<br>') || ''
                    };
            }
        };

        const emailContent = getEmailContent(type, { ...customerData, ...invoiceData });
        
        const mailOptions = {
            from: `"Wonder Drill株式会社" <${gmailUser}>`,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        // メール送信実行
        const info = await transporter.sendMail(mailOptions);
        
        context.log(`✅ Email sent successfully to ${to}:`, info.messageId);

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                message: `メールを ${to} に送信しました`,
                messageId: info.messageId,
                sentTo: to
            }
        };

    } catch (error) {
        context.log.error('❌ Gmail send error:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                error: error.message,
                message: "メール送信に失敗しました",
                details: error.code || 'unknown_error'
            }
        };
    }
};