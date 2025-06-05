# ChatGPT Plus LP Backend API

医療機関向けChatGPT Plus代理購入サービスのバックエンドAPI

## 🚀 ローカル開発環境のセットアップ

### 1. 依存関係のインストール

```bash
cd api
npm install
```

### 2. ローカルサーバーの起動

```bash
# Express開発サーバーを起動（推奨）
npm run dev

# または、Node.jsで直接実行
node local-server.js
```

### 3. アクセスURL

サーバーが起動すると、以下のURLでアクセスできます：

**http://localhost:7071**

## 📌 APIエンドポイント

### フォーム送信
```
POST /api/submit-form
Content-Type: application/json

{
  "organization": "医療機関名",
  "name": "担当者名",
  "email": "email@example.com",
  "purpose": "research",
  "accounts": "1-3",
  "message": "お問い合わせ内容"
}
```

### 顧客管理
```
# 一覧取得
GET /api/customers

# 詳細取得
GET /api/customers/{id}

# 更新
PUT /api/customers/{id}

# アカウント紐付け
POST /api/customers/link
{
  "customerId": "CUST001",
  "chatGptEmail": "example@chatgpt-proxy.jp",
  "linkedBy": "admin@example.com"
}
```

### ダッシュボード
```
# 統計情報
GET /api/dashboard/stats

# 最近の申込み
GET /api/dashboard/recent
```

## 🔧 設定

### モックデータモード（デフォルト）

`local.settings.json`:
```json
{
  "Values": {
    "USE_MOCK_DATA": "true"
  }
}
```

### Azure Storage接続モード

`local.settings.json`:
```json
{
  "Values": {
    "USE_MOCK_DATA": "false",
    "AZURE_STORAGE_CONNECTION_STRING": "your-azure-connection-string"
  }
}
```

## 📊 モックデータ

モックデータには以下が含まれています：

- **FormSubmissions**: 2件のサンプル申込み
- **Customers**: 3件のサンプル顧客（active, trial, pending）
- **AccountMapping**: 2件のアカウント紐付け情報

## 🧪 テスト方法

### cURLを使用したテスト

```bash
# フォーム送信テスト
curl -X POST http://localhost:7071/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "テスト病院",
    "name": "テスト太郎",
    "email": "test@example.com",
    "purpose": "clinical",
    "accounts": "4-10"
  }'

# 顧客一覧取得
curl http://localhost:7071/api/customers

# 統計情報取得
curl http://localhost:7071/api/dashboard/stats
```

### Postmanコレクション

`api-tests.postman_collection.json`をPostmanにインポートして使用できます。

## 🚨 トラブルシューティング

### ポート7071が使用中の場合

`local-server.js`の`port`変数を変更してください：

```javascript
const port = 8080; // 別のポートに変更
```

### CORSエラーが発生する場合

フロントエンドからアクセスする際は、`cors`設定が有効になっていることを確認してください。

### モックデータが表示されない場合

1. `USE_MOCK_DATA`が`"true"`に設定されているか確認
2. `storage-service.js`が正しく読み込まれているか確認

## 📝 Azure Functions Core Toolsでの実行（オプション）

Azure Functions Core Toolsがインストールされている場合：

```bash
func start
```

ただし、Express開発サーバー（`local-server.js`）の方が開発には便利です。