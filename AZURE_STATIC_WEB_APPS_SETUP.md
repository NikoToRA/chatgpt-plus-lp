# Azure Static Web Apps 設定手順書

## Issue #7 の実施内容

現在のNetlifyとAzure Functionsに分散しているデプロイを、Azure Static Web Appsに統合します。

## 1. Azure Portal でのリソース作成

### 1-1. Azure Portal にアクセス
1. [Azure Portal](https://portal.azure.com) にログイン
2. 「リソースの作成」をクリック
3. 「Static Web Apps」を検索・選択

### 1-2. Basic 設定
- **サブスクリプション**: 適切なサブスクリプションを選択
- **リソースグループ**: 新規作成または既存のものを選択
- **名前**: `chatgpt-plus-lp-static`
- **プランタイプ**: Free (無料プラン)
- **リージョン**: East Asia または Japan East

### 1-3. GitHub 統合設定
- **GitHub アカウント**: 認証済みアカウントを選択
- **組織**: `NikoToRA`
- **リポジトリ**: `chatgpt-plus-lp`
- **ブランチ**: `main`

### 1-4. ビルド設定
- **ビルドプリセット**: Custom
- **アプリの場所**: `/docs`
- **API の場所**: `/api`
- **出力場所**: `/docs`

## 2. GitHub Actions ワークフロー確認

リソース作成後、以下のファイルが自動生成されることを確認：
- `.github/workflows/azure-static-web-apps-xxx.yml`

既に作成済みの設定ファイル：
- ✅ `.github/workflows/azure-static-web-apps.yml`
- ✅ `staticwebapp.config.json`

## 3. 環境変数の設定

### 3-1. 現在のAzure Functions設定
```json
{
  "AzureWebJobsStorage": "UseDevelopmentStorage=true",
  "FUNCTIONS_WORKER_RUNTIME": "node"
}
```

### 3-2. Static Web Apps での設定
Azure Portal > Static Web Apps リソース > 設定 > アプリケーション設定 で以下を追加：
- `AzureWebJobsStorage`: Azure Storage接続文字列
- `FUNCTIONS_WORKER_RUNTIME`: `node`

## 4. 機能確認項目

### 4-1. フロントエンド
- ✅ ランディングページの表示
- ✅ レスポンシブデザイン
- ✅ 画像・CSS・JSの読み込み

### 4-2. API機能
- ✅ `/api/submit-form` エンドポイント
- ✅ フォーム送信機能
- ✅ PDF生成・ダウンロード
- ✅ Azure Table Storageへの保存

### 4-3. セキュリティ
- ✅ CORS設定
- ✅ Content Security Policy
- ✅ HTTPSリダイレクト

## 5. 現在のファイル構成

```
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml  # ✅ 作成済み
├── api/
│   ├── submit-form/
│   │   ├── index.js                   # Azure Functions実装
│   │   └── function.json              # 関数設定
│   ├── package.json
│   └── host.json
├── docs/                              # フロントエンド
│   ├── index.html
│   ├── js/
│   │   └── azure-form-handler.js
│   └── images/
├── staticwebapp.config.json           # ✅ 作成済み
└── netlify.toml                       # 移行後は不要
```

## 6. 移行後の作業

1. **DNS設定**: カスタムドメインの設定
2. **Netlify停止**: 古いデプロイの停止
3. **動作テスト**: 本番環境での動作確認
4. **モニタリング**: Azure Application Insightsの設定

## 完了の定義

- ✅ Azure Static Web Apps でのLPの正常表示
- ✅ お問い合わせフォームの正常動作
- ✅ PDF生成・ダウンロード機能の動作
- ✅ Azure Table Storageへのデータ保存

## 次のステップ

この設定が完了したら、以下のIssueに進みます：
- Issue #14: Stripe決済フロー実装
- Issue #15: SendGrid自動メール配信システム
- Issue #16: アカウント管理・配布システム
- Issue #17: 顧客管理ダッシュボード 