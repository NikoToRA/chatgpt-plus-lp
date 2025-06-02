#!/bin/bash

echo "=== Claude OAuth認証情報の取得 ==="

# キーチェーンからClaude関連の認証情報を検索
echo "1. キーチェーンを検索中..."
security find-generic-password -s "claude" -w 2>/dev/null || echo "キーチェーンにclaude項目が見つかりません"

# Claude設定ディレクトリを確認
echo "2. Claude設定ディレクトリをチェック中..."
if [ -d ~/.claude ]; then
    echo "Claude設定ディレクトリが存在します:"
    ls -la ~/.claude/
    
    # 設定ファイルがあれば内容を表示（機密情報は表示しない）
    if [ -f ~/.claude/settings.local.json ]; then
        echo "設定ファイルが見つかりました"
    fi
else
    echo "Claude設定ディレクトリが見つかりません"
fi

# Claude CLIの状態確認
echo "3. Claude CLIの状態確認..."
if command -v claude &> /dev/null; then
    echo "Claude CLIが利用可能です"
    echo "手動で 'claude' コマンドを実行し、'/status' で認証状態を確認してください"
else
    echo "Claude CLIがインストールされていません"
fi

echo "=== 完了 ==="
echo ""
echo "GitHub Actionsで必要な認証情報:"
echo "- CLAUDE_ACCESS_TOKEN"
echo "- CLAUDE_REFRESH_TOKEN" 
echo "- CLAUDE_EXPIRES_AT"
echo ""
echo "これらの値は、キーチェーンアクセスアプリで 'claude' を検索して取得できます。"
echo "または、以下のコマンドを試してください:"
echo "security find-internet-password -s \"claude.ai\" -g" 