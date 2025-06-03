const { TableClient } = require('@azure/data-tables');

// 接続文字列をテスト
// 注意: AccountKeyに実際のキーを設定してください
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=YOUR_ACTUAL_KEY_HERE;EndpointSuffix=core.windows.net";

async function testConnection() {
  try {
    console.log('Testing Azure Table Storage connection...');
    
    const tableClient = new TableClient(connectionString, 'FormSubmissions');
    
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