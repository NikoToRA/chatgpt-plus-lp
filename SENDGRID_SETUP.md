# SendGrid セットアップガイド

## 1. SendGrid アカウント作成

1. [SendGrid公式サイト](https://sendgrid.com/)にアクセス
2. 「Get Started for Free」をクリック
3. 無料アカウントを作成
   - **無料プラン**: 月100通まで永続無料
   - クレジットカード不要

## 2. APIキー取得

1. SendGridダッシュボードにログイン
2. 左メニューの「Settings」→「API Keys」をクリック
3. 「Create API Key」をクリック
4. **API Key Name**: `chatgpt-plus-invoice-system`
5. **Permissions**: 「Full Access」を選択（推奨）
6. 「Create & View」をクリック
7. **APIキーをコピーして安全に保存**（二度と表示されません）

## 3. 送信者認証設定

### Single Sender Verification（推奨）
1. 左メニューの「Settings」→「Sender Authentication」をクリック
2. 「Single Sender Verification」の「Get Started」をクリック
3. 会社情報を入力：
   - **From Name**: `株式会社WonderDrill`
   - **From Email**: `info@wonderdrill.com`（実際のメールアドレス）
   - **Reply To**: 同じメールアドレス
   - その他の会社情報を入力
4. 「Create」をクリック
5. **入力したメールアドレスに確認メールが送信される**
6. 確認メールのリンクをクリックして認証完了

### ドメイン認証（上級者向け）
- 独自ドメインを使用する場合
- DNS設定が必要

## 4. 環境変数設定

### ローカル開発環境
```bash
cd api
cp local.settings.json.template local.settings.json
```

`local.settings.json`を編集：
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SENDGRID_API_KEY": "SG.xxxxxxxxxxxxxxxx",
    "FROM_EMAIL": "info@wonderdrill.com",
    "FROM_NAME": "株式会社WonderDrill"
  },
  "Host": {
    "CORS": "*"
  }
}
```

### Azure本番環境
Azure Portalで以下の環境変数を設定：
- `SENDGRID_API_KEY`: SendGridのAPIキー
- `FROM_EMAIL`: 認証済みの送信者メールアドレス
- `FROM_NAME`: 送信者名

## 5. テスト

### APIテスト
```bash
cd api
npm install
npm start
```

### メール送信テスト
```bash
curl -X POST http://localhost:7071/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "テストメール",
    "text": "これはテストメールです。",
    "attachments": []
  }'
```

## 6. 料金プラン

| プラン | 月間送信数 | 料金 |
|--------|------------|------|
| **無料** | 100通 | ¥0 |
| Essentials | 50,000通 | $19.95 |
| Pro | 100,000通 | $89.95 |

## 7. トラブルシューティング

### よくあるエラー

1. **401 Unauthorized**
   - APIキーが正しくない
   - APIキーの権限が不足

2. **403 Forbidden**
   - 送信者メールアドレスが認証されていない
   - Single Sender Verificationを完了させる

3. **400 Bad Request**
   - メールアドレスの形式が正しくない
   - 必須フィールドが不足

### デバッグ方法
- Azure Functions のログを確認
- SendGridのActivity Feedを確認
- APIレスポンスの詳細を確認

## 8. セキュリティ

- APIキーは絶対に公開しない
- GitHubにコミットしない
- 本番環境では環境変数で管理
- 定期的にAPIキーをローテーション

## 9. 次のステップ

実装が完了したら：
1. SendGridダッシュボードでメール送信状況を監視
2. 配信率やエラー率を確認
3. 必要に応じてプランをアップグレード