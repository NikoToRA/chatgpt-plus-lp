const { TableServiceClient, TableClient } = require('@azure/data-tables');

// local.settings.jsonから環境変数を読み込み
const path = require('path');
const fs = require('fs');
const settingsPath = path.join(__dirname, 'local.settings.json');
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  Object.entries(settings.Values).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

async function testConnection() {
  try {
    console.log('Testing Azure Table Storage connection...');
    console.log('Connection string:', connectionString ? 'Found' : 'Not found');
    console.log('Connection string preview:', connectionString ? connectionString.substring(0, 50) + '...' : 'undefined');
    
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING not found');
    }
    
    // 直接TableClientを使用
    const tableClient = TableClient.fromConnectionString(connectionString, 'FormSubmissions');
    
    // テーブルを作成または既存のテーブルを確認
    try {
      await tableClient.createTable();
      console.log('✅ Table created or already exists');
    } catch (error) {
      if (error.statusCode === 409) {
        console.log('✅ Table already exists');
      } else {
        throw error;
      }
    }
    
    // テストデータを挿入
    const testEntity = {
      partitionKey: 'Test',
      rowKey: `test_${Date.now()}`,
      testField: 'Connection test successful',
      timestamp: new Date()
    };
    
    await tableClient.createEntity(testEntity);
    console.log('✅ Test entity created successfully');
    
    // データを取得して確認
    const entity = await tableClient.getEntity('Test', testEntity.rowKey);
    console.log('✅ Test entity retrieved:', entity);
    
    console.log('\n🎉 Connection test successful! Azure Table Storage is working.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

testConnection();