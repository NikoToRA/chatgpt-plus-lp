# アカウントおよびBilling管理機能 - 実装ドキュメント

## 概要

このドキュメントでは、ChatGPT Plus医療機関向けランディングページにおける決済・Billing管理機能の実装について説明します。Stripe APIを使用した決済処理とAzure Table Storageを使用したデータ管理を統合しています。

## アーキテクチャ

### 技術スタック
- **決済処理**: Stripe API
- **API基盤**: Azure Functions (Node.js)
- **データストレージ**: Azure Table Storage
- **認証**: Azure Functions認証レベル

### データフロー
```
ユーザー → Azure Functions API → Stripe API
                ↓
         Azure Table Storage
```

## API エンドポイント

### 1. 顧客管理 (Customer Management)
**パス**: `/api/customer-management`

#### 顧客作成 (POST)
```javascript
POST /api/customer-management
Body: {
  "organizationName": "医療法人○○会",
  "email": "admin@example.com",
  "contactName": "山田太郎",
  "phone": "03-1234-5678"
}

Response: {
  "success": true,
  "customerId": "CUST_1234567890",
  "stripeCustomerId": "cus_xxxxx",
  "message": "顧客アカウントが作成されました"
}
```

#### 顧客情報取得 (GET)
```javascript
GET /api/customer-management?customerId=CUST_1234567890

Response: {
  "customerId": "CUST_1234567890",
  "organizationName": "医療法人○○会",
  "email": "admin@example.com",
  "stripeCustomerId": "cus_xxxxx",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### 顧客情報更新 (PUT)
```javascript
PUT /api/customer-management?customerId=CUST_1234567890
Body: {
  "organizationName": "医療法人○○会（更新）",
  "email": "newadmin@example.com"
}
```

#### 顧客削除 (DELETE)
```javascript
DELETE /api/customer-management?customerId=CUST_1234567890
```

### 2. サブスクリプション管理 (Subscription Management)
**パス**: `/api/subscription-management`

#### 料金プラン
- **小規模プラン**: 1-3アカウント
  - 月額: 6,000円/アカウント
  - 年額: 66,000円/アカウント
- **中規模プラン**: 4-10アカウント
  - 月額: 5,500円/アカウント
  - 年額: 60,500円/アカウント
- **大規模プラン**: 11アカウント以上
  - 月額: 5,000円/アカウント
  - 年額: 55,000円/アカウント

#### サブスクリプション作成 (POST)
```javascript
POST /api/subscription-management
Body: {
  "customerId": "CUST_1234567890",
  "planId": "medium",
  "accountCount": 5,
  "billingCycle": "monthly",
  "paymentMethodId": "pm_xxxxx"
}

Response: {
  "success": true,
  "subscriptionId": "SUB_1234567890",
  "stripeSubscriptionId": "sub_xxxxx",
  "pricing": {
    "planName": "中規模プラン（4-10アカウント）",
    "totalPrice": 27500,
    "billingCycle": "monthly"
  }
}
```

#### サブスクリプション取得 (GET)
```javascript
GET /api/subscription-management?customerId=CUST_1234567890
```

#### サブスクリプション更新 (PUT)
```javascript
PUT /api/subscription-management?subscriptionId=SUB_1234567890
Body: {
  "accountCount": 8,
  "billingCycle": "yearly"
}
```

#### サブスクリプションキャンセル (DELETE)
```javascript
DELETE /api/subscription-management?subscriptionId=SUB_1234567890
```

### 3. 請求情報取得 (Billing Information)
**パス**: `/api/billing-info`

#### 全情報取得
```javascript
GET /api/billing-info?customerId=CUST_1234567890&type=all

Response: {
  "customerId": "CUST_1234567890",
  "data": {
    "billingHistory": [...],
    "paymentMethods": {...},
    "currentUsage": {...},
    "billingSummary": {...}
  }
}
```

#### 情報タイプ
- `history`: 請求履歴
- `methods`: 支払い方法
- `usage`: 現在の利用状況
- `summary`: 請求サマリー

### 4. 支払い方法管理 (Payment Methods)
**パス**: `/api/payment-methods`

#### 支払い方法追加 (POST)
```javascript
POST /api/payment-methods
Body: {
  "customerId": "CUST_1234567890",
  "paymentMethodId": "pm_xxxxx",
  "setAsDefault": true
}
```

#### 支払い方法一覧取得 (GET)
```javascript
GET /api/payment-methods?customerId=CUST_1234567890
```

#### デフォルト支払い方法更新 (PUT)
```javascript
PUT /api/payment-methods
Body: {
  "customerId": "CUST_1234567890",
  "paymentMethodId": "pm_xxxxx"
}
```

#### 支払い方法削除 (DELETE)
```javascript
DELETE /api/payment-methods?customerId=CUST_1234567890&paymentMethodId=pm_xxxxx
```

#### 銀行振込情報取得
```javascript
GET /api/payment-methods?customerId=CUST_1234567890&type=bank-transfer

Response: {
  "bankTransfer": {
    "enabled": true,
    "bankName": "三菱UFJ銀行",
    "branchName": "東京営業部",
    "accountType": "普通",
    "accountNumber": "1234567",
    "accountName": "カ）ワンダードリル"
  }
}
```

## セキュリティ考慮事項

### 1. API認証
- Azure Functions の認証レベル（function key）を使用
- 本番環境では追加の認証レイヤー（OAuth、JWT等）の実装を推奨

### 2. データ保護
- Stripe APIキーは環境変数として管理
- 顧客の機密情報はStripe側で管理
- Azure Table Storageには最小限の情報のみ保存

### 3. PCI DSS準拠
- カード情報は直接扱わず、Stripeのトークン化を使用
- Payment Method IDのみをやり取り

## 環境設定

### 必要な環境変数
```bash
# Azure Storage接続文字列
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Stripe APIキー
STRIPE_SECRET_KEY=sk_test_...

# Azure Functions設定
FUNCTIONS_WORKER_RUNTIME=node
```

### パッケージのインストール
```bash
cd api
npm install stripe @azure/data-tables
```

## 実装ステータス

### 完了した機能
- ✅ 顧客管理API（作成、取得、更新、削除）
- ✅ サブスクリプション管理API（作成、取得、更新、キャンセル）
- ✅ 請求情報取得API（履歴、支払い方法、利用状況、サマリー）
- ✅ 支払い方法管理API（追加、取得、更新、削除）
- ✅ 料金プラン定義（小規模、中規模、大規模）
- ✅ 銀行振込対応

### 今後の実装予定
- [ ] Webhook処理（Stripeイベント受信）
- [ ] 請求書PDF生成機能
- [ ] 管理画面UI
- [ ] レポート機能
- [ ] 自動請求処理
- [ ] 複数通貨対応

## テスト方法

### 1. ローカル環境でのテスト
```bash
# Azure Functions Core Toolsをインストール
npm install -g azure-functions-core-tools@4

# ローカル設定ファイルを作成
cp local.settings.json.example local.settings.json

# 環境変数を設定
# local.settings.jsonに必要な値を入力

# ローカルで実行
func start
```

### 2. Stripeテストカード
テスト環境では以下のカード番号を使用：
- 成功: `4242 4242 4242 4242`
- 失敗: `4000 0000 0000 0002`

## トラブルシューティング

### よくある問題
1. **STRIPE_SECRET_KEY not configured**
   - 環境変数が正しく設定されているか確認
   - Azure Portalで関数アプリの設定を確認

2. **Table Storage接続エラー**
   - 接続文字列が正しいか確認
   - ストレージアカウントのファイアウォール設定を確認

3. **CORS エラー**
   - Azure Functions のCORS設定を確認
   - 許可するオリジンを追加

## サポート

質問や問題がある場合は、以下にお問い合わせください：
- Email: support@wonder-drill.com
- GitHub Issues: [リポジトリのIssuesページ]

## 更新履歴

- 2025-06-04: 初期実装完了
  - 顧客管理、サブスクリプション管理、請求情報、支払い方法管理の各APIを実装
  - Stripe統合とAzure Table Storage連携を実装