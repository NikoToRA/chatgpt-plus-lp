# ChatGPT Plus ローカル開発環境セットアップガイド

このガイドでは、ChatGPT Plus 管理画面をローカル環境で実行する方法を説明します。

## 前提条件

- Node.js (v16以上)
- npm または yarn
- Azure Functions Core Tools (API実行用)

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/NikoToRA/chatgpt-plus-lp.git
cd chatgpt-plus-lp
```

### 2. API (Azure Functions) のセットアップ

#### 2.1 依存関係のインストール

```bash
cd api
npm install
```

#### 2.2 ローカル設定ファイルの作成

`api/local.settings.json` を作成し、以下の内容を設定します：

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
    "SENDGRID_API_KEY": "your-sendgrid-api-key-here",
    "STRIPE_SECRET_KEY": "sk_test_xxx",
    "ADMIN_EMAIL": "admin@example.com"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
```

#### 2.3 APIサーバーの起動

```bash
npm start
```

APIは http://localhost:7071 で起動します。

### 3. 管理画面 (React) のセットアップ

#### 3.1 依存関係のインストール

新しいターミナルウィンドウを開いて：

```bash
cd admin-dashboard
npm install
```

#### 3.2 環境変数の設定

`.env.local` ファイルを作成します：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集し、以下のように設定します：

```env
REACT_APP_API_URL=http://localhost:7071/api
REACT_APP_AZURE_CLIENT_ID=development-client-id
REACT_APP_AZURE_TENANT_NAME=development-tenant
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxx
```

#### 3.3 開発サーバーの起動

```bash
npm start
```

管理画面は http://localhost:3000 で起動します。

## 開発環境での使用方法

1. ブラウザで http://localhost:3000 にアクセス
2. ログイン画面が表示されたら、「開発用ログイン」ボタンをクリック
3. 管理画面のダッシュボードが表示されます

## トラブルシューティング

### APIが起動しない場合

- Azure Functions Core Tools がインストールされているか確認
  ```bash
  func --version
  ```
- インストールされていない場合：
  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```

### CORSエラーが発生する場合

`api/local.settings.json` の `Host.CORS` が `"*"` に設定されているか確認してください。

### データが表示されない場合

開発環境ではモックデータを使用します。実際のAzure Table Storageを使用する場合は、`AZURE_STORAGE_CONNECTION_STRING` を実際の接続文字列に設定してください。

## 開発のヒント

- フロントエンドとAPIの両方を同時に起動する必要があります
- 開発環境では認証がバイパスされるため、本番環境とは動作が異なります
- APIのエンドポイントは `http://localhost:7071/api/` 配下にあります

## 次のステップ

- Azure Table Storage エミュレーターをセットアップして、実際のデータストレージをシミュレート
- 本番環境の認証フローをテストする場合は、Azure AD B2Cの設定が必要です