const PDFDocument = require('pdfkit');
const { TableClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Azure Table Storage設定
const getTableClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING connection string is not configured');
  }
  return new TableClient(connectionString, 'FormSubmissions');
};

// Table Storageにデータを保存
const saveToTableStorage = async (formData) => {
  try {
    const tableClient = getTableClient();
    
    // テーブルが存在しない場合は作成
    await tableClient.createTable();
    
    // エンティティを作成
    const entity = {
      partitionKey: 'FormSubmission',
      rowKey: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization: formData.organization,
      name: formData.name,
      email: formData.email,
      purpose: formData.purpose,
      accounts: formData.accounts,
      message: formData.message || '',
      submittedAt: new Date().toISOString(),
      timestamp: new Date()
    };
    
    // エンティティを挿入
    const result = await tableClient.createEntity(entity);
    return result;
  } catch (error) {
    console.error('Error saving to Table Storage:', error);
    throw error;
  }
};

// DB接続テスト関数
const testDatabaseConnection = async (context) => {
  try {
    context.log('Testing database connection...');
    
    // 環境変数チェック
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    context.log('Connection string exists:', !!connectionString);
    context.log('Connection string preview:', connectionString ? connectionString.substring(0, 50) + '...' : 'NOT SET');
    
    if (!connectionString) {
      return { success: false, error: 'AZURE_STORAGE_CONNECTION_STRING not configured' };
    }
    
    // Table Client作成テスト
    const tableClient = getTableClient();
    context.log('Table client created successfully');
    
    // テーブル作成テスト
    await tableClient.createTable();
    context.log('Table creation/verification successful');
    
    // テストエンティティ作成
    const testEntity = {
      partitionKey: 'Test',
      rowKey: `test_${Date.now()}`,
      testField: 'DB connection test',
      timestamp: new Date()
    };
    
    // テストデータ挿入
    const result = await tableClient.createEntity(testEntity);
    context.log('Test entity created successfully:', result);
    
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    context.log.error('Database connection test failed:', error);
    return { success: false, error: error.message };
  }
};

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
      doc.text(`お問い合わせ目的: ${formData.purpose}`);
      doc.moveDown();
      doc.text(`希望アカウント数: ${formData.accounts}`);
      doc.moveDown();
      
      if (formData.message) {
        doc.text(`お問い合わせ内容: ${formData.message}`);
        doc.moveDown();
      }
      
      doc.moveDown();
      doc.fontSize(16).text('サービス概要', { underline: true });
      doc.moveDown();
      
      doc.fontSize(14).text('• アカウント取得代行サービス');
      doc.moveDown();
      doc.text('• 初期セットアップ・導入支援');
      doc.moveDown();
      doc.text('• 一括請求料金管理の代行');
      doc.moveDown();
      doc.text('  複数アカウントもまとめて管理。当社でまとめてお支払い。');
      doc.moveDown();
      doc.text('  請求書でもクレジットカードでも選べます');
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
          monthlyPrice = 5500;
          yearlyPrice = 60500;
          break;
        case '11+':
          accountCount = 15;
          monthlyPrice = 5000;
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

module.exports = async function (context, req) {
  context.log('Processing form submission request - v2');
  
  try {
    // DB接続テストを実行（デバッグ用）
    const dbTest = await testDatabaseConnection(context);
    context.log('Database test result:', dbTest);
    
    // リクエストボディの処理
    let formData;
    
    if (typeof req.body === 'string') {
      try {
        formData = JSON.parse(req.body);
      } catch (parseError) {
        context.log('JSON parse error:', parseError);
        formData = req.body;
      }
    } else {
      formData = req.body;
    }
    
    context.log('Received form data:', JSON.stringify(formData));
    
    // バリデーション
    if (!formData || !formData.organization || !formData.name || !formData.email || !formData.purpose) {
      context.log('Validation failed - missing required fields');
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Missing required fields',
          received: formData,
          dbTest: dbTest
        })
      };
      return;
    }
    
    // Table Storageにデータを保存
    context.log('Saving data to Table Storage...');
    let saveResult = null;
    let saveError = null;
    
    try {
      saveResult = await saveToTableStorage(formData);
      context.log('Data saved to Table Storage successfully:', saveResult);
    } catch (error) {
      saveError = error;
      context.log.error('Failed to save to Table Storage:', error);
      // Table Storage保存に失敗してもPDF生成は続行
    }
    
    // 静的PDFのURLを返す
    context.log('Returning static PDF URL...');
    
    // レスポンス（静的PDFへのリダイレクト）
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-DB-Test': JSON.stringify(dbTest),
        'X-Save-Result': saveResult ? 'SUCCESS' : 'FAILED',
        'X-Save-Error': saveError ? saveError.message : 'NONE'
      },
      body: JSON.stringify({
        success: true,
        pdfUrl: '/PDF_DL.pdf',
        message: 'お申し込みありがとうございます。資料をダウンロードしてください。'
      })
    };
    
    context.log('Response sent successfully with debug headers');
  } catch (error) {
    context.log.error('Error processing form submission:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message 
      })
    };
  }
};
