#!/bin/bash

echo "=== Claude OAuth認証情報をJSON形式で取得 ==="
echo ""

# 認証情報の取得と整形
echo "📝 認証情報の取得中..."
AUTH_JSON=$(security find-generic-password -s "Claude Code-credentials" -a "HirayamaSuguru2" -w 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$AUTH_JSON" ]; then
    echo "✅ 認証情報が見つかりました"
    echo ""
    
    # JSON形式で整形して表示
    echo "🔑 認証情報 (JSON形式):"
    echo "$AUTH_JSON" | python3 -m json.tool
    echo ""
    
    # 個別の値を抽出して表示
    echo "📋 GitHub Actions用の個別値:"
    echo "================================"
    
    ACCESS_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['accessToken'])")
    REFRESH_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['refreshToken'])")
    EXPIRES_AT=$(echo "$AUTH_JSON" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data['claudeAiOauth']['expiresAt'])")
    
    echo "CLAUDE_ACCESS_TOKEN="
    echo "$ACCESS_TOKEN"
    echo ""
    
    echo "CLAUDE_REFRESH_TOKEN="
    echo "$REFRESH_TOKEN"
    echo ""
    
    echo "CLAUDE_EXPIRES_AT="
    echo "$EXPIRES_AT"
    echo ""
    
    # 有効期限の確認
    CURRENT_TIME=$(date +%s)
    EXPIRES_AT_SEC=$((EXPIRES_AT / 1000))  # ミリ秒を秒に変換
    
    if [ $CURRENT_TIME -lt $EXPIRES_AT_SEC ]; then
        echo "✅ トークンは有効です (期限: $(date -r $EXPIRES_AT_SEC '+%Y-%m-%d %H:%M:%S'))"
    else
        echo "⚠️  トークンが期限切れです (期限: $(date -r $EXPIRES_AT_SEC '+%Y-%m-%d %H:%M:%S'))"
        echo "新しいログインが必要です: claude コマンドで /login を実行してください"
    fi
    
else
    echo "❌ 認証情報が見つかりませんでした"
    echo ""
    echo "対処法:"
    echo "1. 'claude' コマンドを実行"
    echo "2. '/login' でClaude Maxアカウントにログイン"
    echo "3. このスクリプトを再実行"
fi

echo ""
echo "🔧 使用方法:"
echo "上記の値をGitHub Repository Settings > Secrets and variables > Actions に追加してください" 