# メール送信機能 統合テストガイド

## 前提条件

1. **SendGridアカウント作成済み**
2. **APIキー取得済み**
3. **送信者認証完了済み**

## テスト手順

### 1. SendGrid設定確認

`SENDGRID_SETUP.md` の手順に従って以下を完了させてください：
- SendGridアカウント作成
- APIキー取得
- Single Sender Verification

### 2. 環境変数設定

```bash
cd api
cp local.settings.json.template local.settings.json
```

`local.settings.json` を編集：
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SENDGRID_API_KEY": "SG.your-actual-api-key-here",
    "FROM_EMAIL": "your-verified-email@domain.com",
    "FROM_NAME": "株式会社WonderDrill"
  },
  "Host": {
    "CORS": "*"
  }
}
```

### 3. Azure Functions 起動

```bash
cd api
npm install
npm start
```

起動メッセージを確認：
```
Functions:
  send-email: [POST] http://localhost:7071/api/send-email
```

### 4. API単体テスト

別ターミナルで：
```bash
cd /Users/HirayamaSuguru2/Desktop/AI実験室/chatgpt-plus-lp
npm install node-fetch
node test-email-api.js
```

**期待される結果**：
- ✅ メール送信成功!
- 指定したメールアドレスにテストメールが届く

### 5. 管理画面 起動

```bash
cd admin-dashboard
npm start
```

ブラウザで http://localhost:3000 にアクセス

### 6. エンドツーエンドテスト

1. **顧客詳細ページへ移動**
   - 顧客管理 → 山田太郎をクリック

2. **請求書メール準備**
   - 「月払い請求書発行＋メール準備」ボタンをクリック
   - メール確認ダイアログが表示される

3. **メール内容確認・編集**
   - 宛先：顧客のメールアドレス
   - 件名：自動生成された件名
   - 本文：詳細な請求書メール文面
   - 添付ファイル：請求書ファイル

4. **メール送信**
   - 内容を確認・必要に応じて編集
   - 「メール送信」ボタンをクリック
   - 「メールを送信しました。」メッセージ表示

5. **結果確認**
   - 指定したメールアドレスに請求書メールが届く
   - 添付ファイルが正しく添付されている
   - ローカルに請求書ファイルがダウンロードされる

## トラブルシューティング

### エラー: "SendGrid API key not configured"
- `local.settings.json` のAPIキーを確認
- Azure Functionsを再起動

### エラー: "403 Forbidden"
- 送信者メールアドレスがSendGridで認証されているか確認
- Single Sender Verificationを完了させる

### エラー: "CORS error"
- Azure Functions の CORS 設定を確認
- ブラウザの開発者ツールでエラー詳細を確認

### メールが届かない
1. **SendGridダッシュボード確認**
   - Activity Feed でメール送信状況を確認
   - エラーがないかチェック

2. **迷惑メールフォルダ確認**
   - 初回送信時は迷惑メールに分類される可能性

3. **ログ確認**
   - Azure Functions のコンソールログを確認
   - エラーメッセージを詳細に確認

## 本番デプロイ前チェックリスト

- [ ] SendGrid APIキーが正しく設定されている
- [ ] 送信者メールアドレスが認証済み
- [ ] 月100通制限を把握している
- [ ] エラーハンドリングが適切
- [ ] ログ出力が適切
- [ ] セキュリティ設定（APIキーの管理）
- [ ] CORS設定が適切

## 月間送信数監視

SendGridダッシュボードで以下を定期的に確認：
- 月間送信数（無料プラン: 100通まで）
- 配信率
- エラー率
- 迷惑メール分類率

## 次のステップ

テストが成功したら：
1. **本番環境へのデプロイ**
2. **Azure環境変数の設定**
3. **独自ドメインでの送信者認証**（推奨）
4. **監視・アラート設定**