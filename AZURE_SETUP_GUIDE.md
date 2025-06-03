# Azure環境設定手順

## Azure Static Web AppsでのTable Storage設定

### 1. Azure Portalでの設定
1. Azure Portal → Static Web Apps → あなたのアプリ
2. 「設定」→「構成」
3. 「アプリケーション設定」タブ
4. 「+ 新しいアプリケーション設定」をクリック

### 2. 必要な環境変数
```
名前: AZURE_STORAGE_CONNECTION_STRING
値: DefaultEndpointsProtocol=https;AccountName=YOUR_STORAGE_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
```

### 3. Storage Accountの作成
1. Azure Portal → 「リソースの作成」
2. 「Storage account」を選択
3. 基本設定：
   - リソースグループ：Static Web Appsと同じ
   - ストレージアカウント名：任意（例：wonderdrillstorage）
   - 地域：Japan East
   - パフォーマンス：Standard
   - 冗長性：LRS（ローカル冗長ストレージ）

### 4. Table Storageの準備
1. Storage Account → 「データストレージ」→「テーブル」
2. 「+ テーブル」で新規作成
3. テーブル名：`FormSubmissions`

### 5. 接続文字列の取得
1. Storage Account → 「アクセスキー」
2. 「接続文字列」をコピー
3. Static Web Appsの環境変数に設定

## ローカルテスト用設定
`api/local.settings.json`に以下を追加：
```json
{
  "IsEncrypted": false,
  "Values": {
    "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string-here"
  }
}
```

## 動作確認
1. フォームに必要事項を入力
2. 「お問い合わせ・資料ダウンロード」をクリック
3. 以下が確認できれば成功：
   - PDFが新しいタブで開く
   - データがAzure Table Storageに保存される
   - 成功メッセージが表示される