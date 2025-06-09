# Gmail アプリパスワード設定手順

## 🔐 **Gmail アプリパスワード取得方法**

### **手順1: 2段階認証を有効化**
1. [Google アカウント設定](https://myaccount.google.com/) にアクセス
2. 「セキュリティ」→「2段階認証プロセス」
3. 2段階認証を有効化（SMS認証など）

### **手順2: アプリパスワード生成**
1. 2段階認証有効化後、同じページで「アプリパスワード」をクリック
2. アプリを選択：「メール」
3. デバイスを選択：「その他（カスタム名）」→「ChatGPT管理システム」
4. **16文字のアプリパスワード**が生成される（例：`abcd efgh ijkl mnop`）

### **手順3: Azure 環境変数設定**
Azure Portal で以下を設定：

```
COMPANY_EMAIL = support@wonderdrill.com
GMAIL_APP_PASSWORD = abcdefghijklmnop
```

**注意**: アプリパスワードはスペースを除いて入力

## 🧪 **テスト方法**

### **1. メール送信テスト**
デプロイ完了後（約5分）、以下で動作確認：

```bash
curl -X POST https://wonderful-flower-0f6517b00.6.azurestaticapps.net/api/gmail-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@gmail.com",
    "subject": "テストメール",
    "text": "Gmail API テストです",
    "type": "general"
  }'
```

### **2. 請求書メールテスト**
```bash
curl -X POST https://wonderful-flower-0f6517b00.6.azurestaticapps.net/api/gmail-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@gmail.com",
    "type": "invoice",
    "customerData": {
      "organization": "テスト病院",
      "name": "テスト太郎"
    },
    "invoiceData": {
      "plan": "ChatGPT Plus",
      "accountCount": 2,
      "totalAmount": 6000,
      "dueDate": "2024年1月31日"
    }
  }'
```

## 📋 **管理画面での使用方法**

### **請求書送信ボタン機能**
1. 管理画面で顧客詳細を開く
2. 「請求書送信」ボタンをクリック
3. 自動で `/api/gmail-send` を呼び出し
4. 請求書メールが顧客に送信される

## 🔧 **トラブルシューティング**

### **よくあるエラー**

#### **"Gmail credentials not configured"**
- Azure Portal で環境変数が正しく設定されているか確認
- `COMPANY_EMAIL` と `GMAIL_APP_PASSWORD` の両方が必要

#### **"Invalid login"**
- アプリパスワードが正しいか確認
- 2段階認証が有効になっているか確認
- アプリパスワード生成時のスペースを除去

#### **"Less secure app access"**
- アプリパスワードを使用している場合は関係なし
- 通常のパスワードではなくアプリパスワードを使用

## 🎯 **利点まとめ**

### **SendGrid vs Gmail SMTP**
- ✅ **設定簡単**: アプリパスワードのみ
- ✅ **確実動作**: Google の信頼性
- ✅ **無料**: 送信制限が実質なし
- ✅ **会社アドレス**: Wonder Drill のメールから送信
- ✅ **トラブル少**: ログイン問題なし

**Gmail アプリパスワードを設定すれば、確実にメール送信できます！**