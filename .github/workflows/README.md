# GitHub Actions ワークフロー設定

## 🎯 現在のアクティブワークフロー

### ✅ Azure Static Web Apps CI/CD
- **ファイル**: `azure-static-web-apps-wonderful-flower-0f6517b00.yml`
- **目的**: メインのウェブサイトデプロイ
- **デプロイ先**: Azure Static Web Apps
- **トリガー**: main ブランチへのpush、PR

### 🤖 Claude PR Assistant
- **ファイル**: `claude.yml`
- **目的**: PR や Issue の自動レビュー・アシスタント
- **トリガー**: `@claude` メンション時

## 🚫 無効化されたワークフロー

競合とリソースの重複を避けるため、以下のワークフローを無効化しました：

- `azure-static-web-apps.yml.disabled` - Azure Static Web Apps の重複設定
- `deploy.yml.disabled` - GitHub Pages デプロイ（Azure Static Web Apps で代替）
- `azure-deploy.yml.disabled` - Azure Functions デプロイ（統合済み）

## 📊 デプロイ戦略

**単一デプロイ先**: Azure Static Web Apps
- 静的サイト: `./docs` フォルダ
- API (将来): `./api` フォルダ
- ドメイン: Azure Static Web Apps の提供ドメイン

## 🔧 設定情報

### 必要なシークレット
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WONDERFUL_FLOWER_0F6517B00`
- `GITHUB_TOKEN` (自動設定)
- `CLAUDE_ACCESS_TOKEN` (Claude PR Assistant用)
- `CLAUDE_REFRESH_TOKEN` (Claude PR Assistant用)
- `CLAUDE_EXPIRES_AT` (Claude PR Assistant用)

### アプリケーション設定
- **アプリ場所**: `./docs`
- **API場所**: `./api` (オプション)
- **出力場所**: `.` (ビルド不要)

---
*最終更新: 2025年6月1日 - ワークフロー競合解消* 