# 推奨される新規Issue構成

## 概要
既存のIssue #1-#7を整理し、より体系的で実装しやすい形に再構成した新しいIssue案を提案します。

## 新規Issue一覧

### 🔴 優先度: 最高（基盤構築）

#### New Issue #1: Azure Static Web Apps環境構築と本番デプロイ
**タイトル**: Azure Static Web Apps環境構築と本番デプロイ
**ラベル**: infrastructure, high-priority
**内容**:
```markdown
## 目的
現在のローカル開発環境からAzure Static Web Appsへの本番デプロイを実現する

## 受け入れ基準
- [ ] Azure Static Web Appsリソースが作成されている
- [ ] GitHub Actionsワークフローが設定されている
- [ ] mainブランチへのプッシュで自動デプロイが実行される
- [ ] 本番URLでサイトにアクセスできる
- [ ] カスタムドメインの設定（オプション）

## 技術仕様
- リソース名: chatgpt-plus-lp-static
- リージョン: Japan East
- プラン: Free tier
- API location: /api
- App location: /docs

## 参考資料
- /AZURE_STATIC_WEB_APPS_SETUP.md
```

#### New Issue #2: データベース基盤構築とフォームデータ永続化
**タイトル**: Azure SQL Database構築とフォームデータ保存機能実装
**ラベル**: backend, database, high-priority
**内容**:
```markdown
## 目的
お問い合わせフォームのデータをデータベースに保存し、データの永続化を実現する

## 受け入れ基準
- [ ] Azure SQL Databaseが作成されている
- [ ] FormSubmissionsテーブルが作成されている
- [ ] Azure FunctionsからDBに接続できる
- [ ] フォーム送信時にデータが保存される
- [ ] 保存されたデータを確認できる

## データベーススキーマ
\`\`\`sql
CREATE TABLE FormSubmissions (
    id INT PRIMARY KEY IDENTITY(1,1),
    organization_name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    purpose NVARCHAR(50),
    account_count NVARCHAR(20),
    message NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2
);
\`\`\`

## セキュリティ要件
- 接続文字列はKey Vaultに保存
- SQLインジェクション対策実装
- 個人情報の暗号化
```

### 🟡 優先度: 高（コア機能）

#### New Issue #3: 自動メール通知システムの実装
**タイトル**: SendGridを使用した自動メール通知機能の実装
**ラベル**: feature, backend, communication
**内容**:
```markdown
## 目的
フォーム送信時に管理者と送信者へ自動でメール通知を送る

## 受け入れ基準
- [ ] SendGrid APIキーが設定されている
- [ ] 管理者向け通知メールが送信される
- [ ] 送信者向け確認メールが送信される
- [ ] メールテンプレートが作成されている
- [ ] エラー時のリトライ機能がある

## メールテンプレート
1. 管理者向け：新規問い合わせ通知
2. 送信者向け：お問い合わせ受付確認

## 技術仕様
- メールサービス: SendGrid
- テンプレートエンジン: Handlebars
- 送信元アドレス: noreply@wonder-drill.com
```

#### New Issue #4: 管理画面の開発（フェーズ1）
**タイトル**: 顧客データ閲覧用管理画面の開発
**ラベル**: feature, frontend, admin
**内容**:
```markdown
## 目的
お問い合わせデータを閲覧・管理できる管理画面を作成する

## 受け入れ基準
- [ ] 管理者ログイン機能（Azure AD B2C）
- [ ] お問い合わせ一覧表示
- [ ] 詳細表示機能
- [ ] 検索・フィルター機能
- [ ] CSVエクスポート機能

## 技術スタック
- フロントエンド: React
- UI: Material-UI
- 認証: Azure AD B2C
- API: Azure Functions

## 画面構成
1. ログイン画面
2. ダッシュボード
3. お問い合わせ一覧
4. お問い合わせ詳細
```

### 🟢 優先度: 中（拡張機能）

#### New Issue #5: 顧客ポータルの開発
**タイトル**: 顧客向けマイページ機能の開発
**ラベル**: feature, frontend, customer-facing
**内容**:
```markdown
## 目的
顧客が自分の契約情報や履歴を確認できるポータルを提供する

## 受け入れ基準
- [ ] 顧客ログイン機能
- [ ] 契約情報表示
- [ ] お問い合わせ履歴表示
- [ ] 資料ダウンロード機能
- [ ] プロフィール編集機能

## 将来的な拡張
- 請求書確認
- 契約変更申請
- サポートチケット機能
```

#### New Issue #6: 予約システムの実装
**タイトル**: Calendly連携による予約システムの実装
**ラベル**: feature, integration, scheduling
**内容**:
```markdown
## 目的
無料相談や導入説明会の予約を簡単に行えるシステムを実装する

## 受け入れ基準
- [ ] Calendly埋め込みウィジェット実装
- [ ] 予約完了時のDB保存
- [ ] 予約確認メール送信
- [ ] 管理画面での予約確認機能

## 統合方法
- Calendly Embed API使用
- Webhook経由でデータ取得
- Azure Functionsで処理
```

### 🔵 優先度: 低（将来機能）

#### New Issue #7: Stripe決済システム統合
**タイトル**: Stripe決済システムの統合と請求管理機能
**ラベル**: feature, payment, integration
**内容**:
```markdown
## 目的
オンライン決済と自動請求管理を実現する

## 受け入れ基準
- [ ] Stripe Checkout統合
- [ ] サブスクリプション管理
- [ ] 請求書自動発行
- [ ] 支払い履歴管理
- [ ] 決済Webhook処理

## セキュリティ要件
- PCI DSS準拠
- 3Dセキュア対応
- 不正検知機能
```

#### New Issue #8: 監視・アラートシステムの構築
**タイトル**: Application InsightsとAzure Monitorによる監視システム構築
**ラベル**: monitoring, infrastructure, operations
**内容**:
```markdown
## 目的
システムの安定稼働を確保するための監視とアラート体制を構築する

## 受け入れ基準
- [ ] Application Insights設定
- [ ] エラーアラート設定
- [ ] パフォーマンス監視
- [ ] カスタムメトリクス定義
- [ ] ダッシュボード作成

## アラート条件
- API応答時間 > 3秒
- エラー率 > 5%
- データベース接続エラー
- メール送信失敗
```

#### New Issue #9: セキュリティ強化とコンプライアンス対応
**タイトル**: セキュリティ強化と個人情報保護対応
**ラベル**: security, compliance, high-priority
**内容**:
```markdown
## 目的
個人情報保護法に準拠し、セキュリティを強化する

## 受け入れ基準
- [ ] SSL/TLS証明書設定
- [ ] WAF（Web Application Firewall）設定
- [ ] データ暗号化実装
- [ ] アクセスログ記録
- [ ] プライバシーポリシー更新
- [ ] Cookie同意機能

## コンプライアンス要件
- 個人情報保護法準拠
- GDPR対応（将来的）
- 医療情報取り扱いガイドライン準拠
```

## 実装順序の推奨

### Phase 1（2週間）
1. New Issue #1: Azure環境構築
2. New Issue #2: データベース構築

### Phase 2（3週間）
3. New Issue #3: メール通知
4. New Issue #4: 管理画面（基本機能）
5. New Issue #9: セキュリティ基本対応

### Phase 3（4週間）
6. New Issue #5: 顧客ポータル
7. New Issue #6: 予約システム
8. New Issue #8: 監視システム

### Phase 4（4週間）
9. New Issue #7: 決済システム
10. New Issue #9: セキュリティ完全対応

## まとめ
この新しいIssue構成により、より体系的で実装しやすいプロジェクト管理が可能になります。各Issueは明確な受け入れ基準を持ち、相互の依存関係も整理されています。