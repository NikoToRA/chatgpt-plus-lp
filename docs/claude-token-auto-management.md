# 🔐 Claude Token 自動管理システム実装ガイド

## 概要

Claude OAuth トークンの自動管理システムを実装し、トークンの期限切れ問題を解決します。

## 現在の問題点

1. **短い有効期限**: Claude OAuthトークンは1-2時間で期限切れ
2. **手動更新の手間**: 定期的に手動でトークンを更新する必要がある
3. **作業の中断**: トークン期限切れにより自動化処理が中断される

## 解決策の実装

### 1. GitHub Actions Secrets の自動更新（実装済み）

`update_github_claude_tokens.sh` スクリプトが以下を自動化：
- ローカルのClaude認証情報を取得
- GitHub Secretsを自動更新
- 有効期限の確認と警告

### 2. 定期チェックワークフロー（実装済み）

`.github/workflows/refresh-claude-token.yml` が以下を実行：
- 毎日午前9時（JST）に自動実行
- トークン期限の24時間前に通知
- 手動実行オプション付き

### 3. 推奨：トークン自動リフレッシュ機能の追加

以下のワークフローを追加することで、トークンの自動リフレッシュを実現：

```yaml
# .github/workflows/auto-refresh-claude-token.yml
name: 🔄 Auto Refresh Claude Token

on:
  schedule:
    # 2時間ごとに実行
    - cron: '0 */2 * * *'
  workflow_dispatch:

jobs:
  refresh-token:
    runs-on: ubuntu-latest
    steps:
      - name: 🔄 Refresh Claude Token
        uses: actions/github-script@v7
        with:
          script: |
            const refreshToken = process.env.CLAUDE_REFRESH_TOKEN;
            const currentExpiry = parseInt(process.env.CLAUDE_EXPIRES_AT);
            const now = Date.now();
            
            // 30分以内に期限切れの場合のみリフレッシュ
            if (now > currentExpiry - 30 * 60 * 1000) {
              // ここでClaude OAuth APIを呼び出してトークンを更新
              // 注: 実際のAPIエンドポイントとフォーマットは要確認
              console.log('Token refresh needed');
              
              // GitHub Secretsを更新
              // この部分は実際のAPIレスポンスに基づいて実装
            }
        env:
          CLAUDE_REFRESH_TOKEN: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
          CLAUDE_EXPIRES_AT: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

## 短期的な対処法

### 1. ローカルスクリプトの定期実行

```bash
# cronジョブとして設定（1時間ごと）
crontab -e
# 追加:
0 * * * * /path/to/chatgpt-plus-lp/update_github_claude_tokens.sh
```

### 2. GitHub Actions実行前の手動更新

```bash
# 大規模な作業前に実行
./update_github_claude_tokens.sh
```

### 3. トークン有効期限の監視

```bash
# 現在のトークン有効期限を確認
./get_claude_tokens.sh | grep "有効期限"
```

## 長期的な解決策

### 1. Claude API正式版の利用

Claude APIが正式リリースされた場合：
- APIキーベースの認証に移行
- OAuth依存から脱却

### 2. プロキシサーバーの構築

中間サーバーを設置して：
- トークンの自動リフレッシュ
- リクエストのプロキシ
- 安定したAPI接続の提供

### 3. GitHub Action の改善提案

`grll/claude-code-action` へのフィードバック：
- リフレッシュトークンの自動使用
- トークン期限切れ時の自動再試行
- より長い有効期限のサポート

## トラブルシューティング

### エラー: "Token is expired"
```bash
# 即座に解決
claude  # Claudeアプリを起動
# /login でログイン
./update_github_claude_tokens.sh  # トークン更新
```

### エラー: "Failed to refresh token"
- Claude Webアプリケーションで再ログイン
- ブラウザのキャッシュをクリア
- 新しいセッションでトークンを取得

### 自動化の失敗
- GitHub Secrets の権限を確認
- ワークフローの実行履歴を確認
- 手動でトークンを更新してリトライ

## 実装状況

- ✅ ローカルトークン更新スクリプト
- ✅ 定期チェックワークフロー
- ✅ 手動更新ドキュメント
- ⏳ 自動リフレッシュ機能（要API仕様確認）
- ⏳ プロキシサーバー（将来的な実装）

## 次のステップ

1. このドキュメントに基づいて自動更新システムを運用
2. Claude OAuth APIの仕様を調査
3. 完全自動化の実装を検討