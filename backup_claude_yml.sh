#!/bin/bash

echo "=== Claude Workflow ファイル管理 ==="

WORKFLOW_FILE=".github/workflows/claude.yml"
BACKUP_FILE=".github/workflows/claude.yml.backup"

case "$1" in
    "backup")
        if [ -f "$WORKFLOW_FILE" ]; then
            cp "$WORKFLOW_FILE" "$BACKUP_FILE"
            echo "✅ バックアップ作成: $BACKUP_FILE"
        else
            echo "❌ ワークフローファイルが見つかりません"
        fi
        ;;
    "restore")
        if [ -f "$BACKUP_FILE" ]; then
            cp "$BACKUP_FILE" "$WORKFLOW_FILE"
            echo "✅ バックアップから復元: $WORKFLOW_FILE"
        else
            echo "❌ バックアップファイルが見つかりません"
        fi
        ;;
    "status")
        echo "📁 ファイル状況:"
        ls -la "$WORKFLOW_FILE" 2>/dev/null || echo "ワークフローファイル: なし"
        ls -la "$BACKUP_FILE" 2>/dev/null || echo "バックアップファイル: なし"
        
        echo ""
        echo "🔒 Git保護状況:"
        if git ls-files --skip-worktree | grep -q "claude.yml"; then
            echo "✅ skip-worktree: 有効"
        else
            echo "❌ skip-worktree: 無効"
        fi
        ;;
    "protect")
        echo "🔒 ファイル保護を有効化中..."
        chmod 444 "$WORKFLOW_FILE"
        git update-index --skip-worktree "$WORKFLOW_FILE"
        echo "✅ 保護完了"
        ;;
    "unprotect")
        echo "🔓 ファイル保護を解除中..."
        chmod 644 "$WORKFLOW_FILE"
        git update-index --no-skip-worktree "$WORKFLOW_FILE"
        echo "✅ 保護解除完了"
        ;;
    *)
        echo "使用方法:"
        echo "  $0 backup    - 現在のファイルをバックアップ"
        echo "  $0 restore   - バックアップから復元"
        echo "  $0 status    - ファイル状況を表示"
        echo "  $0 protect   - ファイルを保護"
        echo "  $0 unprotect - ファイル保護を解除"
        ;;
esac 