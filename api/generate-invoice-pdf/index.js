const PDFDocument = require('pdfkit');

module.exports = async function (context, req) {
  context.log('PDF generation function triggered');

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
    const { customer, companyInfo, billingType } = req.body;

    if (!customer || !companyInfo || !billingType) {
      context.res = {
        status: 400,
        headers,
        body: { error: 'Missing required parameters: customer, companyInfo, billingType' }
      };
      return;
    }

    // 請求書データを生成
    const invoiceData = generateInvoiceData(customer, companyInfo, billingType);
    
    // PDFを生成
    const pdfBuffer = await generatePDFBuffer(invoiceData, customer, companyInfo);
    
    // Base64エンコード
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // レスポンス
    context.res = {
      status: 200,
      headers,
      body: {
        invoiceId: `inv-${Date.now()}`,
        invoiceNumber: invoiceData.invoiceNumber,
        totalAmount: invoiceData.totalAmount,
        monthlyFee: invoiceData.monthlyFee,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
        pdfBase64: pdfBase64
      }
    };

  } catch (error) {
    context.log.error('PDF generation error:', error);
    context.res = {
      status: 500,
      headers,
      body: { 
        error: 'PDF generation failed',
        details: error.message 
      }
    };
  }
};

function generateInvoiceData(customer, companyInfo, billingType) {
  // アクティブなアカウントの月額料金を計算
  const monthlyFee = customer.chatGptAccounts
    .filter(acc => acc.isActive || acc.status === 'active')
    .reduce((total, acc) => {
      const product = companyInfo.products.find(p => p.id === acc.productId) ||
                     companyInfo.products.find(p => p.id === customer.productId) ||
                     companyInfo.products.find(p => p.isActive);
      return total + (product?.unitPrice || 20000);
    }, 0);

  // 請求タイプに応じて計算
  const billingMonths = billingType === 'monthly' ? 1 : 12;
  const totalAmount = monthlyFee * billingMonths;

  const now = new Date();
  const dueDate = new Date(now.getTime() + (companyInfo.invoiceSettings?.paymentTermDays || 30) * 24 * 60 * 60 * 1000);

  return {
    invoiceNumber: `${companyInfo.invoiceSettings?.invoicePrefix || 'INV'}-${Date.now()}`,
    customerName: customer.name,
    organization: customer.organization,
    email: customer.email,
    totalAmount,
    monthlyFee,
    billingMonths,
    billingType,
    issueDate: now.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    accounts: customer.chatGptAccounts.filter(acc => acc.isActive || acc.status === 'active'),
    companyInfo
  };
}

async function generatePDFBuffer(invoiceData, customer, companyInfo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // 日本語フォント対応（PDFKitのデフォルトフォントを使用）
      doc.fontSize(16);

      // ヘッダー
      doc.text('請求書', 50, 50, { align: 'center' });
      doc.fontSize(12);
      doc.text(`請求書番号: ${invoiceData.invoiceNumber}`, 50, 100);
      doc.text(`発行日: ${invoiceData.issueDate}`, 50, 120);
      doc.text(`支払期限: ${invoiceData.dueDate}`, 50, 140);

      // 請求先情報
      doc.fontSize(14);
      doc.text('請求先', 50, 180);
      doc.fontSize(12);
      doc.text(`${invoiceData.organization}`, 50, 200);
      if (customer.postalCode && customer.address) {
        doc.text(`〒${customer.postalCode}`, 50, 220);
        doc.text(`${customer.address}`, 50, 240);
        doc.text(`${invoiceData.customerName} 様`, 50, 260);
      } else {
        doc.text(`${invoiceData.customerName} 様`, 50, 220);
      }

      // 請求元情報
      doc.fontSize(14);
      doc.text('請求元', 350, 180);
      doc.fontSize(12);
      doc.text(`${companyInfo.companyName}`, 350, 200);
      doc.text(`${companyInfo.representativeName}`, 350, 220);
      doc.text(`〒${companyInfo.postalCode}`, 350, 240);
      doc.text(`${companyInfo.address}`, 350, 260);
      doc.text(`TEL: ${companyInfo.phoneNumber}`, 350, 280);
      doc.text(`Email: ${companyInfo.email}`, 350, 300);

      // 請求内容
      let currentY = customer.postalCode && customer.address ? 370 : 350;
      doc.fontSize(14);
      doc.text('請求内容', 50, currentY);
      currentY += 30;

      doc.fontSize(12);
      doc.text('ChatGPT Plus 医療機関向けプラン（チームプラン・アカウント共有）', 50, currentY);
      currentY += 20;
      doc.text(`月額料金: ¥${invoiceData.monthlyFee.toLocaleString()}`, 50, currentY);
      currentY += 20;
      doc.text(`請求期間: ${invoiceData.billingMonths}ヶ月`, 50, currentY);
      currentY += 30;

      // 金額詳細
      doc.fontSize(14);
      doc.text('合計金額', 50, currentY);
      currentY += 20;

      doc.fontSize(12);
      doc.text(`小計: ¥${invoiceData.totalAmount.toLocaleString()}`, 50, currentY);
      currentY += 20;
      const tax = Math.floor(invoiceData.totalAmount * 0.1);
      doc.text(`消費税(10%): ¥${tax.toLocaleString()}`, 50, currentY);
      currentY += 20;
      const total = invoiceData.totalAmount + tax;
      doc.fontSize(14);
      doc.text(`合計: ¥${total.toLocaleString()}`, 50, currentY);
      currentY += 40;

      // 振込先情報
      doc.fontSize(14);
      doc.text('振込先', 50, currentY);
      currentY += 20;

      doc.fontSize(12);
      doc.text(`銀行名: ${companyInfo.bankInfo.bankName}`, 50, currentY);
      currentY += 20;
      doc.text(`支店名: ${companyInfo.bankInfo.branchName}`, 50, currentY);
      currentY += 20;
      doc.text(`口座種別: ${companyInfo.bankInfo.accountType === 'checking' ? '普通' : '当座'}`, 50, currentY);
      currentY += 20;
      doc.text(`口座番号: ${companyInfo.bankInfo.accountNumber}`, 50, currentY);
      currentY += 20;
      doc.text(`口座名義: ${companyInfo.bankInfo.accountHolder}`, 50, currentY);
      currentY += 40;

      // ChatGPTアカウント一覧
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(14);
      doc.text('ChatGPTアカウント一覧', 50, currentY);
      currentY += 20;

      doc.fontSize(10);
      invoiceData.accounts.forEach((account, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(`${index + 1}. ${account.email} (${account.isActive ? 'アクティブ' : '停止中'})`, 50, currentY);
        currentY += 15;
      });

      // 備考
      currentY += 20;
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(12);
      doc.text('備考', 50, currentY);
      currentY += 20;
      doc.fontSize(10);
      const notes = companyInfo.invoiceSettings?.notes || 'お支払いは請求書発行日より30日以内にお願いいたします。';
      doc.text(notes, 50, currentY);
      currentY += 30;

      const footerNotes = companyInfo.invoiceTemplate?.invoiceFooterNotes || 
        '※チームプラン・アカウント共有サービスのため、使用量による追加料金は発生いたしません。';
      doc.text(footerNotes, 50, currentY);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}