# ChatGPT Plus 管理画面 - ローカル実装完了

管理画面のローカル実装が完了しました。以下の機能がローカルで利用可能です。

## 実装された機能

### 1. ダッシュボード
- 申込総数、アクティブアカウント数の表示
- 月間売上高と成約率の表示
- 最新申込一覧の表示

### 2. 顧客管理
- 顧客一覧の表示（検索・フィルタ機能付き）
- 顧客詳細情報の閲覧・編集
- ステータスとプランの管理

### 3. アカウント紐付け
- ChatGPTアカウントとの紐付け管理
- 紐付け履歴の記録

### 4. 認証
- 開発環境用の認証バイパス機能
- 本番環境ではAzure AD B2C対応

## セットアップ方法

### 方法1：自動セットアップ（推奨）

```bash
./setup-local.sh
```

このスクリプトが以下を自動的に実行します：
- 依存関係のインストール
- 設定ファイルの作成
- 開発用の環境変数設定

### 方法2：手動セットアップ

#### API (Azure Functions)
```bash
cd api
npm install
# local.settings.json を作成（上記スクリプト参照）
npm start
```

#### 管理画面 (React)
```bash
cd admin-dashboard
npm install
cp .env.local.example .env.local
# .env.local を編集
npm start
```

## アクセス方法

1. http://localhost:3000 を開く
2. 「開発用ログイン」ボタンをクリック
3. 管理画面が表示されます

## モックデータ

開発環境では以下のモックデータが利用可能です：

- 5件の顧客データ（様々なステータス）
- ダッシュボード統計情報
- 最新申込データ

モックデータは `api/local-data/mockData.js` で定義されています。

## ファイル構成

```
├── api/
│   ├── customers/         # 顧客管理API
│   ├── dashboard/         # ダッシュボードAPI
│   ├── local-data/        # モックデータ
│   └── utils/             # ローカル開発用ヘルパー
├── admin-dashboard/
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   ├── services/      # APIサービス
│   │   └── types/         # TypeScript型定義
│   └── .env.development   # 開発環境設定
├── setup-local.sh         # セットアップスクリプト
├── LOCAL_SETUP.md         # 詳細セットアップガイド
└── QUICK_START_LOCAL.md   # クイックスタートガイド
```

## 次のステップ

1. **本番データ接続**: Azure Table Storageとの接続設定
2. **認証実装**: Azure AD B2Cの設定
3. **支払い機能**: Stripe統合の実装
4. **デプロイ**: Azure Static Web Appsへのデプロイ

## トラブルシューティング

問題が発生した場合は、以下を確認してください：

1. Node.js v16以上がインストールされているか
2. ポート7071（API）と3000（Frontend）が空いているか
3. Azure Functions Core Toolsがインストールされているか

詳細は `LOCAL_SETUP.md` を参照してください。