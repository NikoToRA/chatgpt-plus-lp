// Azure Functions のローカルテスト
const func = require('./submit-form/index.js');

// local.settings.jsonから環境変数を読み込み
const path = require('path');
const fs = require('fs');
const settingsPath = path.join(__dirname, 'local.settings.json');
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  Object.entries(settings.Values).forEach(([key, value]) => {
    process.env[key] = value;
  });
  console.log('Local settings loaded successfully');
} else {
  console.error('local.settings.json not found');
}

// モックコンテキストとリクエスト
const context = {
  log: console.log,
  log: Object.assign(console.log, { error: console.error }),
  res: null
};

const req = {
  body: {
    organization: "テスト病院",
    name: "テスト太郎",
    email: "test@example.com",
    purpose: "資料請求",
    accounts: "1-3",
    message: "テストメッセージ"
  }
};

// 関数を実行
async function test() {
  console.log('=== Azure Function Test Start ===');
  
  try {
    await func(context, req);
    console.log('\n=== Response ===');
    console.log('Status:', context.res.status);
    console.log('Headers:', context.res.headers);
    console.log('Body:', context.res.body);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();