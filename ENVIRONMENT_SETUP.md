# 環境変数設定手順

## Azure Storage Account接続設定

### 1. Azure Portalから接続文字列を取得
1. Azure Portal → Storage Account
2. 「アクセスキー」をクリック
3. 「接続文字列」をコピー

### 2. ローカル環境設定（開発用）
`api/local.settings.json`を編集：
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=YOUR_STORAGE_ACCOUNT_NAME;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
  }
}
```

### 3. Azure Static Web Apps設定（本番用）
1. Azure Portal → Static Web Apps → あなたのアプリ
2. 「設定」→「構成」
3. 「アプリケーション設定」→「+ 新しいアプリケーション設定」
4. 以下を追加：
   - 名前: `AZURE_STORAGE_CONNECTION_STRING`
   - 値: コピーした接続文字列

### 4. Table Storage準備
Azure Storage Explorerまたはポータルで：
1. テーブル作成: `FormSubmissions`
2. パーティションキー: `FormSubmission`
3. ローキー: タイムスタンプベース（自動生成）

### 5. 動作確認
1. ローカルでAzure Functions起動:
   ```bash
   cd api
   npm install
   func start
   ```
2. ブラウザでサイトを開く
3. フォーム送信してTable Storageに保存されることを確認

## セキュリティ注意事項
- `local.settings.json`は`.gitignore`に含まれています
- 接続文字列を誤ってコミットしないよう注意
- 本番環境では必ずAzure Portal経由で環境変数を設定