const fetch = require('node-fetch');

async function testEmailAPI() {
    const apiUrl = 'http://localhost:7071/api/send-email';
    
    const testData = {
        to: 'test@example.com', // 実際のテスト用メールアドレスに変更
        subject: '【テスト】請求書メール送信テスト',
        text: `株式会社テスト
テスト 太郎 様

いつもお世話になっております。
株式会社WonderDrillの山田太郎です。

年払いの請求書をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【請求内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

請求書番号: INV-1234567890
請求金額: ¥280,000
お支払い期限: 2025/7/5

【サービス内容】
ChatGPT Plus 医療機関向けプラン（チームプラン・アカウント共有）
アクティブアカウント数: 4アカウント
月額料金: ¥23,500
年払い（12ヶ月分）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お振込先】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

銀行名: 三菱UFJ銀行
支店名: 丸の内支店
口座種別: 普通
口座番号: 1234567
口座名義: カ）ワンダードリル

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

添付ファイルに詳細な請求書を添付いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
株式会社WonderDrill
山田太郎
〒100-0001 東京都千代田区丸の内1-1-1
TEL: 03-1234-5678
Email: info@wonderdrill.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        attachments: [
            {
                content: Buffer.from('テスト請求書の内容\n\nこれはテスト用の添付ファイルです。').toString('base64'),
                filename: 'test-invoice.txt',
                type: 'text/plain',
                disposition: 'attachment'
            }
        ]
    };

    try {
        console.log('📧 メール送信APIテスト開始...');
        console.log(`🌐 API URL: ${apiUrl}`);
        console.log(`📨 宛先: ${testData.to}`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ メール送信成功!');
            console.log('📋 レスポンス:', result);
        } else {
            console.log('❌ メール送信失敗');
            console.log('📋 エラー:', result);
            console.log(`🔍 ステータス: ${response.status}`);
        }
        
    } catch (error) {
        console.log('💥 APIリクエストエラー:', error.message);
        console.log('💡 Azure Functionsが起動していることを確認してください');
        console.log('   cd api && npm start');
    }
}

// テスト実行
testEmailAPI();