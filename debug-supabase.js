// Supabase接続診断スクリプト
// ブラウザのコンソールで実行してください

const SUPABASE_URL = 'https://xyztpwuoptomidmpasxy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enRwd3VvcHRvbWlkbXBhc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzk1MjUsImV4cCI6MjA1OTIxNTUyNX0.tvRP0zLfgNz0mnlBjClI-4B8nsstAXbs7_NDhz3VEzg';

console.log('🔍 Supabase診断開始');
console.log('URL:', SUPABASE_URL);
console.log('Key (最初の20文字):', SUPABASE_KEY.substring(0, 20) + '...');

// 1. 基本接続テスト
async function test1_connection() {
    console.log('\n=== 1. 基本接続テスト ===');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('ステータス:', response.status);
        console.log('ヘッダー:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            console.log('✅ 基本接続: 成功');
        } else {
            console.log('❌ 基本接続: 失敗');
            const text = await response.text();
            console.log('エラー内容:', text);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ 接続エラー:', error);
        return false;
    }
}

// 2. テーブル存在確認
async function test2_table() {
    console.log('\n=== 2. テーブル存在確認 ===');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/form_submissions?limit=0`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('ステータス:', response.status);
        const text = await response.text();
        console.log('レスポンス:', text);
        
        if (response.ok) {
            console.log('✅ テーブル存在: 確認済み');
        } else {
            console.log('❌ テーブルアクセス: 失敗');
        }
        return response.ok;
    } catch (error) {
        console.error('❌ テーブル確認エラー:', error);
        return false;
    }
}

// 3. データ投稿テスト
async function test3_insert() {
    console.log('\n=== 3. データ投稿テスト ===');
    try {
        const testData = {
            organization: 'テスト病院',
            name: '診断テスト',
            email: 'debug@test.com',
            purpose: '資料請求',
            accounts: 1,
            message: '診断用テストデータ',
            user_agent: navigator.userAgent,
            ip_address: null
        };
        
        console.log('投稿データ:', testData);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/form_submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('ステータス:', response.status);
        const text = await response.text();
        console.log('レスポンス:', text);
        
        if (response.ok) {
            console.log('✅ データ投稿: 成功');
            const data = JSON.parse(text);
            console.log('作成されたレコード:', data);
        } else {
            console.log('❌ データ投稿: 失敗');
        }
        return response.ok;
    } catch (error) {
        console.error('❌ 投稿エラー:', error);
        return false;
    }
}

// 全テスト実行
async function runAllTests() {
    console.log('🚀 全テスト実行開始\n');
    
    const result1 = await test1_connection();
    const result2 = await test2_table();
    const result3 = await test3_insert();
    
    console.log('\n📊 テスト結果サマリー');
    console.log('基本接続:', result1 ? '✅' : '❌');
    console.log('テーブル:', result2 ? '✅' : '❌');
    console.log('データ投稿:', result3 ? '✅' : '❌');
    
    if (result1 && result2 && result3) {
        console.log('\n🎉 全テスト成功！Supabase連携は正常です。');
    } else {
        console.log('\n⚠️ 問題が検出されました。上記のエラー内容を確認してください。');
    }
}

// 実行
console.log('診断を開始するには runAllTests() を実行してください');
console.log('個別テストの場合:');
console.log('- test1_connection() : 基本接続');
console.log('- test2_table() : テーブル確認');
console.log('- test3_insert() : データ投稿');

// 自動実行
runAllTests();