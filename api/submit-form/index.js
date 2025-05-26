const PDFDocument = require('pdfkit');

const generatePDF = (formData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      doc.fontSize(25).text('ChatGPT Plus 医療機関向けサービス資料', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`医療機関名: ${formData.organization}`);
      doc.moveDown();
      doc.text(`ご担当者名: ${formData.name}`);
      doc.moveDown();
      doc.text(`メールアドレス: ${formData.email}`);
      doc.moveDown();
      doc.text(`希望アカウント数: ${formData.accounts}`);
      doc.moveDown();
      
      doc.moveDown();
      doc.fontSize(16).text('サービス概要', { underline: true });
      doc.moveDown();
      
      doc.fontSize(14).text('• アカウント取得代行サービス');
      doc.moveDown();
      doc.text('• 初期セットアップ・導入支援');
      doc.moveDown();
      doc.text('• 一括請求・料金管理');
      doc.moveDown();
      doc.text('• 医療機関専用サポート窓口');
      doc.moveDown();
      doc.text('• セキュリティ対策・運用支援');
      doc.moveDown();
      doc.moveDown();
      
      doc.fontSize(16).text('料金プラン（参考）', { underline: true });
      doc.moveDown();
      
      let accountCount = 1;
      let monthlyPrice = 6000;
      let yearlyPrice = 66000;
      
      switch(formData.accounts) {
        case '1-3':
          accountCount = 3;
          break;
        case '4-10':
          accountCount = 10;
          monthlyPrice = 5500; // 10% discount for 4-10 accounts
          yearlyPrice = 60500;
          break;
        case '11+':
          accountCount = 15;
          monthlyPrice = 5000; // 20% discount for 11+ accounts
          yearlyPrice = 55000;
          break;
      }
      
      doc.fontSize(14).text(`月額プラン: ${accountCount}アカウント × ${monthlyPrice}円 = ${accountCount * monthlyPrice}円/月`);
      doc.moveDown();
      doc.text(`年額プラン: ${accountCount}アカウント × ${yearlyPrice}円 = ${accountCount * yearlyPrice}円/年`);
      doc.moveDown();
      doc.moveDown();
      
      doc.fontSize(10).text('※ 詳細な料金やプランについては、お気軽にお問い合わせください。', { align: 'center' });
      doc.moveDown();
      doc.text('※ お問い合わせ: support@wonder-drill.com', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const saveToAzureTable = (formData, context) => {
  try {
    const entity = {
      PartitionKey: "FormSubmission",
      RowKey: new Date().getTime().toString(),
      organization: formData.organization,
      name: formData.name,
      email: formData.email,
      purpose: formData.purpose || '',
      accounts: formData.accounts,
      message: formData.message || '',
      submissionDate: new Date().toISOString()
    };
    
    context.bindings.outputTable = entity;
    
    return entity;
  } catch (error) {
    context.log.error('Error saving to Azure Table:', error);
    // テーブル保存に失敗してもPDF生成は続行
    return null;
  }
};

module.exports = async function (context, req) {
  context.log('Processing form submission request');
  
  try {
    const formData = req.body;
    
    if (!formData.organization || !formData.name || !formData.email || !formData.purpose) {
      context.res = {
        status: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
      return;
    }
    
    const pdfBuffer = await generatePDF(formData);
    const tableEntity = saveToAzureTable(formData, context);
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=chatgpt-plus-service-guide.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    context.log.error('Error processing form submission:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};
