const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
  context.log('Invoice email sending function triggered');

  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // OPTIONS リクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers
    };
    return;
  }

  try {
    const { invoice, customer, companyInfo } = req.body;

    if (!invoice || !customer || !companyInfo) {
      context.res = {
        status: 400,
        headers,
        body: { error: 'Missing required parameters: invoice, customer, companyInfo' }
      };
      return;
    }

    // SendGrid APIキーの設定
    const apiKey = process.env.SENDGRID_API_KEY || companyInfo.emailSettings?.sendgridApiKey;
    if (!apiKey) {
      context.res = {
        status: 400,
        headers,
        body: { error: 'SendGrid API key not configured' }
      };
      return;
    }

    sgMail.setApiKey(apiKey);

    // メール内容を生成
    const emailContent = generateEmailContent(invoice, customer, companyInfo);
    
    // PDFの準備（invoice.pdfUrlまたはpdfBase64から）
    let attachments = [];
    if (invoice.pdfUrl && invoice.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const pdfBase64 = invoice.pdfUrl.replace('data:application/pdf;base64,', '');
      attachments = [{
        content: pdfBase64,
        filename: `請求書_${customer.name}_${invoice.invoiceNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }];
    }

    // メール送信
    const msg = {
      to: customer.email,
      from: {
        email: companyInfo.emailSettings?.fromEmail || process.env.FROM_EMAIL,
        name: companyInfo.emailSettings?.fromName || process.env.FROM_NAME
      },
      subject: emailContent.subject,
      text: emailContent.body,
      html: emailContent.body.replace(/\n/g, '<br>'),
      attachments: attachments
    };

    await sgMail.send(msg);
    
    context.log(`Invoice email sent successfully to ${customer.email}`);

    context.res = {
      status: 200,
      headers,
      body: {
        success: true,
        message: 'Invoice email sent successfully',
        messageId: Date.now().toString()
      }
    };

  } catch (error) {
    context.log.error('Invoice email sending error:', error);
    
    let errorMessage = 'Failed to send invoice email';
    let statusCode = 500;

    if (error.code === 403) {
      errorMessage = 'SendGrid authentication failed. Check API key and sender verification.';
      statusCode = 403;
    } else if (error.code === 400) {
      errorMessage = 'Invalid email parameters. Check sender email verification.';
      statusCode = 400;
    }

    context.res = {
      status: statusCode,
      headers,
      body: { 
        error: errorMessage,
        details: error.message 
      }
    };
  }
};

function generateEmailContent(invoice, customer, companyInfo) {
  // メール件名を生成
  const subjectTemplate = companyInfo.invoiceTemplate?.emailSubjectTemplate || 
    '【{{companyName}}】{{billingType}}請求書のご送付 - {{invoiceNumber}}';
  
  const subject = subjectTemplate
    .replace(/\{\{companyName\}\}/g, companyInfo.companyName)
    .replace(/\{\{billingType\}\}/g, invoice.billingType === 'monthly' ? '月払い' : '年払い')
    .replace(/\{\{invoiceNumber\}\}/g, invoice.invoiceNumber);

  // メール本文を生成
  let bodyTemplate = companyInfo.invoiceTemplate?.emailBodyTemplate;
  
  if (!bodyTemplate) {
    // デフォルトテンプレート
    bodyTemplate = `{{customerOrganization}}
{{#if customerAddress}}〒{{customerPostalCode}}
{{customerAddress}}{{/if}}
{{customerName}} 様

いつもお世話になっております。
{{companyName}}の{{representativeName}}です。

{{billingType}}の請求書をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【請求内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

請求書番号: {{invoiceNumber}}
請求金額: ¥{{totalAmount}}
お支払い期限: {{dueDate}}

【サービス内容】
ChatGPT Plus 医療機関向けプラン（チームプラン・アカウント共有）
アクティブアカウント数: {{activeAccountCount}}アカウント
月額料金: ¥{{monthlyFee}}
{{billingPeriodDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お振込先】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

銀行名: {{bankName}}
支店名: {{branchName}}
口座種別: {{accountType}}
口座番号: {{accountNumber}}
口座名義: {{accountHolder}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

添付ファイルに詳細な請求書を添付いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{companyName}}
{{representativeName}}
〒{{postalCode}} {{address}}
TEL: {{phoneNumber}}
Email: {{email}}
Website: {{website}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // 変数置換
  let body = bodyTemplate
    .replace(/\{\{customerOrganization\}\}/g, customer.organization)
    .replace(/\{\{customerName\}\}/g, customer.name)
    .replace(/\{\{customerPostalCode\}\}/g, customer.postalCode || '')
    .replace(/\{\{customerAddress\}\}/g, customer.address || '')
    .replace(/\{\{companyName\}\}/g, companyInfo.companyName)
    .replace(/\{\{representativeName\}\}/g, companyInfo.representativeName)
    .replace(/\{\{billingType\}\}/g, invoice.billingType === 'monthly' ? '月払い' : '年払い')
    .replace(/\{\{invoiceNumber\}\}/g, invoice.invoiceNumber)
    .replace(/\{\{totalAmount\}\}/g, invoice.totalAmount.toLocaleString())
    .replace(/\{\{dueDate\}\}/g, new Date(invoice.dueDate).toLocaleDateString('ja-JP'))
    .replace(/\{\{activeAccountCount\}\}/g, customer.chatGptAccounts.filter(acc => acc.isActive || acc.status === 'active').length.toString())
    .replace(/\{\{monthlyFee\}\}/g, invoice.monthlyFee.toLocaleString())
    .replace(/\{\{billingPeriodDescription\}\}/g, invoice.billingType === 'yearly' ? '年払い（12ヶ月分）' : '月払い（1ヶ月分）')
    .replace(/\{\{bankName\}\}/g, companyInfo.bankInfo.bankName)
    .replace(/\{\{branchName\}\}/g, companyInfo.bankInfo.branchName)
    .replace(/\{\{accountType\}\}/g, companyInfo.bankInfo.accountType === 'checking' ? '普通' : '当座')
    .replace(/\{\{accountNumber\}\}/g, companyInfo.bankInfo.accountNumber)
    .replace(/\{\{accountHolder\}\}/g, companyInfo.bankInfo.accountHolder)
    .replace(/\{\{postalCode\}\}/g, companyInfo.postalCode)
    .replace(/\{\{address\}\}/g, companyInfo.address)
    .replace(/\{\{phoneNumber\}\}/g, companyInfo.phoneNumber)
    .replace(/\{\{email\}\}/g, companyInfo.email)
    .replace(/\{\{website\}\}/g, companyInfo.website || '');

  // 簡易的な条件分岐処理（住所がある場合のみ表示）
  if (customer.postalCode && customer.address) {
    body = body.replace(/\{\{#if customerAddress\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    // 住所がない場合は条件ブロックを削除
    body = body.replace(/\{\{#if customerAddress\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  return { subject, body };
}