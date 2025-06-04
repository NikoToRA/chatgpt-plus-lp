# ChatGPT Plus 管理画面

## 概要

ChatGPT Plus LP プロジェクトの管理画面です。顧客管理、アカウント紐付け、ダッシュボード機能を提供します。

## 機能

- **ダッシュボード**: 申込数、アクティブアカウント数、売上などの統計情報を表示
- **顧客管理**: 顧客情報の閲覧・編集、ステータスやプランの変更
- **アカウント紐付け**: 顧客とChatGPTアカウントの紐付け管理
- **認証**: Azure AD B2Cによる管理者認証（実装予定）

## セットアップ

### 1. 環境変数の設定

`.env.local.example`をコピーして`.env.local`を作成し、必要な値を設定してください。

```bash
cp .env.local.example .env.local
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm start
```

ブラウザで http://localhost:3000 にアクセスしてください。

## 開発環境での認証

開発環境では、ログイン画面の「開発用ログイン」ボタンを使用して認証をバイパスできます。

## APIエンドポイント

管理画面は以下のAPIエンドポイントを使用します：

- `GET /api/customers` - 顧客一覧の取得
- `GET /api/customers/:id` - 顧客詳細の取得
- `PUT /api/customers/:id` - 顧客情報の更新
- `POST /api/customers/:id/link` - アカウント紐付け
- `GET /api/dashboard/stats` - ダッシュボード統計
- `GET /api/dashboard/recent` - 最新申込一覧

## ビルド

本番環境用のビルドを作成：

```bash
npm run build
```

ビルドされたファイルは`build`ディレクトリに出力されます。

## デプロイ

Azure Static Web Appsへのデプロイは、メインプロジェクトと統合されています。
`admin-dashboard`ディレクトリのファイルは、`/admin`パスでアクセス可能になります。