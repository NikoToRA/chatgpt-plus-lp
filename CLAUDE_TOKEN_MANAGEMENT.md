# 🔐 Claude Token 管理ガイド

## 問題: GitHub ActionsでClaude OAuthトークンが期限切れになる

Claude OAuth トークンは**1-2時間で期限切れ**になるため、GitHub Actionsで使用する際に頻繁に更新が必要です。

## 🛠️ 解決策

### 方法1: 自動更新スクリプト（推奨）

**即座にトークンを更新:**
```bash
# Claudeにログイン済みであることを確認
claude
# /login でログイン（必要な場合）

# トークンを自動でGitHub Secretsに更新
./update_github_claude_tokens.sh
```

このスクリプトは:
- ✅ ローカルのClaude認証情報を取得
- ✅ GitHub Secretsを自動更新
- ✅ 有効期限を確認

### 方法2: 手動更新

```bash
# トークン情報を取得
./get_claude_tokens.sh

# 表示された値を GitHub Secrets に手動設定
# Settings > Secrets and variables > Actions
```

### 方法3: GitHub Actions定期チェック（実装済み）

`.github/workflows/refresh-claude-token.yml` が毎日実行され:
- 🕐 毎日午前9時（JST）にトークン期限をチェック
- ⚠️ 24時間以内に期限切れの場合、通知Issue作成
- 🔄 手動実行も可能

## 📋 トークン更新チェックリスト

1. **Claudeへのログイン確認**
   ```bash
   claude
   # ログイン状態を確認
   ```

2. **トークン更新実行**
   ```bash
   ./update_github_claude_tokens.sh
   ```

3. **動作確認**
   - GitHub Actions で `@claude` コメントをテスト
   - 正常に応答することを確認

## 🚨 トラブルシューティング

### エラー: "Token is expired"
```bash
# Claudeに再ログイン
claude
# /login を実行

# トークンを更新
./update_github_claude_tokens.sh
```

### エラー: "GitHub CLI not authenticated"
```bash
# GitHub CLIをインストール
brew install gh

# 認証
gh auth login
```

## 🔄 長期的な解決策の検討

1. **grll/claude-code-action の改善待ち**
   - リフレッシュトークン対応
   - 自動更新機能

2. **代替ソリューション**
   - Claude API（正式版待ち）
   - 他のAI統合ツール

## 📞 サポート

問題が解決しない場合:
- Issue作成: https://github.com/grll/claude-code-action/issues
- grll公式ドキュメント確認