# Claude プロジェクト情報

## Azure Static Web Apps デプロイ構成

このプロジェクトは1つの統合されたAzure Static Web Appsインスタンスで構成されています：

### 統合構成
- メインURL: https://wonderful-flower-0f6517b00.6.azurestaticapps.net
- Azureリソース名: Chatgpthospital
- ワークフロー: `.github/workflows/azure-static-web-apps-wonderful-flower-0f6517b00.yml`
- 構成:
  - `/` - メインのランディングページ
  - `/admin/` - 管理画面
  - `/application/` - 申し込みフォーム

### ディレクトリ構造
- LP: ルートディレクトリ（index.html）
- 管理画面: 
  - ソース: `admin-dashboard/`
  - ビルド先: `admin/`
- 申し込みフォーム:
  - ソース: `api/customer-application/`
  - ビルド先: `application/`

## 重要な注意事項

- **統合されたインスタンス**として動作しています
- すべてのアプリケーションが同じドメインでアクセス可能
- `/admin/` と `/application/` は正常にアクセス可能です

## ビルド・デプロイコマンド

### 管理画面のローカルビルド
```bash
cd admin-dashboard
npm install
npm run build
```

### 申し込みフォームのローカルビルド
```bash
cd api/customer-application
npm install
npm run build
```

## API エンドポイント
- API URL: https://chatgpt-plus-api.azurewebsites.net/api

## リンク構成

### LPから申し込みフォームへのリンク
- LPの申し込みボタンは全て申し込みフォームのURL（https://agreeable-desert-046254d00.6.azurestaticapps.net/）に直接リンクしています
- `/application/` への相対パスは使用しません（404エラーになるため）

## 更新日
2025-06-08