#!/bin/bash

echo "=== GitHub Claude Tokens 自動更新スクリプト ==="
echo ""

# GitHub CLIがインストールされているか確認
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) がインストールされていません"
    echo "インストール: brew install gh"
    exit 1
fi

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI が認証されていません"
    echo "実行: gh auth login"
    exit 1
fi

# リポジトリ情報取得
REPO_OWNER="NikoToRA"
REPO_NAME="chatgpt-plus-lp"

echo "📝 現在のClaude認証情報を取得中..."

# 認証情報の取得
AUTH_JSON=$(security find-generic-password -s "Claude Code-credentials" -a "HirayamaSuguru2" -w 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$AUTH_JSON" ]; then
    # トークン情報を抽出
    ACCESS_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['accessToken'])")
    REFRESH_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['refreshToken'])")
    EXPIRES_AT=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['expiresAt'])")
    
    # 有効期限確認
    CURRENT_TIME=$(date +%s)
    EXPIRES_AT_SEC=$((EXPIRES_AT / 1000))
    
    if [ $CURRENT_TIME -lt $EXPIRES_AT_SEC ]; then
        echo "✅ トークンは有効です (期限: $(date -r $EXPIRES_AT_SEC '+%Y-%m-%d %H:%M:%S'))"
    else
        echo "⚠️  トークンが期限切れです。先に '/login' でログインしてください"
        exit 1
    fi
    
    echo ""
    echo "🔄 GitHub Secretsを更新中..."
    
    # GitHub Secretsを更新
    echo -n "$ACCESS_TOKEN" | gh secret set CLAUDE_ACCESS_TOKEN -R "$REPO_OWNER/$REPO_NAME"
    echo "✅ CLAUDE_ACCESS_TOKEN を更新しました"
    
    echo -n "$REFRESH_TOKEN" | gh secret set CLAUDE_REFRESH_TOKEN -R "$REPO_OWNER/$REPO_NAME"
    echo "✅ CLAUDE_REFRESH_TOKEN を更新しました"
    
    echo -n "$EXPIRES_AT" | gh secret set CLAUDE_EXPIRES_AT -R "$REPO_OWNER/$REPO_NAME"
    echo "✅ CLAUDE_EXPIRES_AT を更新しました"
    
    echo ""
    echo "🎉 GitHub Secrets の更新が完了しました！"
    echo ""
    echo "📋 更新されたシークレット:"
    echo "- CLAUDE_ACCESS_TOKEN"
    echo "- CLAUDE_REFRESH_TOKEN"
    echo "- CLAUDE_EXPIRES_AT (有効期限: $(date -r $EXPIRES_AT_SEC '+%Y-%m-%d %H:%M:%S'))"
    
else
    echo "❌ Claude認証情報が見つかりませんでした"
    echo ""
    echo "対処法:"
    echo "1. 'claude' コマンドを実行"
    echo "2. '/login' でClaude Maxアカウントにログイン"
    echo "3. このスクリプトを再実行"
    exit 1
fi