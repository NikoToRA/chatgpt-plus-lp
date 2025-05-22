// Netlify Function to handle form submissions
const { Client } = require('@notionhq/client');
const PDFDocument = require('pdfkit');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Function to create PDF quote
const generatePDF = (formData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer to store PDF data
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to PDF
      doc.fontSize(25).text('ChatGPT Plus 医療法人向け見積書', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`医療機関名: ${formData.organization}`);
      doc.moveDown();
      doc.text(`ご担当者名: ${formData.name}`);
      doc.moveDown();
      doc.text(`メールアドレス: ${formData.email}`);
      doc.moveDown();
      doc.text(`希望アカウント数: ${formData.accounts}`);
      doc.moveDown();
      
      // Add pricing table
      doc.moveDown();
      doc.fontSize(16).text('料金プラン', { underline: true });
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
      
      // Add footer
      doc.fontSize(10).text('※ 本見積書の有効期限は発行日より30日間です。', { align: 'center' });
      doc.moveDown();
      doc.text('※ お問い合わせ: support@wonder-drill.com', { align: 'center' });
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Function to save data to Notion
const saveToNotion = async (formData) => {
  try {
    const response = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        '医療機関名': {
          title: [
            {
              text: {
                content: formData.organization,
              },
            },
          ],
        },
        '担当者名': {
          rich_text: [
            {
              text: {
                content: formData.name,
              },
            },
          ],
        },
        'メールアドレス': {
          email: formData.email,
        },
        'アカウント数': {
          select: {
            name: formData.accounts,
          },
        },
        '問い合わせ内容': {
          rich_text: [
            {
              text: {
                content: formData.message || '',
              },
            },
          ],
        },
        '送信日時': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error saving to Notion:', error);
    throw error;
  }
};


// Main handler function
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    
    // Validate required fields
    if (!formData.organization || !formData.name || !formData.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }
    
    // Process form submission in parallel (removed email sending)
    const [pdfBuffer, notionResponse] = await Promise.all([
      generatePDF(formData),
      saveToNotion(formData),
    ]);
    
    // Return success with PDF data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=chatgpt-plus-quote.pdf',
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
