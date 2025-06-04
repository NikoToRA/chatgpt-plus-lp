#!/bin/bash

# ChatGPT Plus ローカル開発環境セットアップスクリプト

echo "ChatGPT Plus ローカル開発環境をセットアップします..."

# プロジェクトルートディレクトリを設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 色付きメッセージ用の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Node.js バージョンチェック
echo -e "${YELLOW}Node.js バージョンをチェックしています...${NC}"
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}エラー: Node.js がインストールされていません。${NC}"
    echo "Node.js v16以上をインストールしてください。"
    exit 1
fi
echo -e "${GREEN}Node.js バージョン: $NODE_VERSION${NC}"

# Azure Functions Core Tools チェック
echo -e "${YELLOW}Azure Functions Core Tools をチェックしています...${NC}"
FUNC_VERSION=$(func --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}Azure Functions Core Tools がインストールされていません。${NC}"
    echo "インストールしますか？ (y/n)"
    read -r INSTALL_FUNC
    if [ "$INSTALL_FUNC" = "y" ]; then
        npm install -g azure-functions-core-tools@4 --unsafe-perm true
    else
        echo "Azure Functions Core Tools なしで続行します。"
    fi
else
    echo -e "${GREEN}Azure Functions Core Tools バージョン: $FUNC_VERSION${NC}"
fi

# API セットアップ
echo -e "${YELLOW}API (Azure Functions) をセットアップしています...${NC}"
cd "$PROJECT_ROOT/api"

# 依存関係をインストール
echo "API の依存関係をインストールしています..."
npm install

# local.settings.json を作成
if [ ! -f local.settings.json ]; then
    echo "local.settings.json を作成しています..."
    cat > local.settings.json <<EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
    "SENDGRID_API_KEY": "your-sendgrid-api-key-here",
    "STRIPE_SECRET_KEY": "sk_test_xxx",
    "ADMIN_EMAIL": "admin@example.com"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
EOF
    echo -e "${GREEN}local.settings.json を作成しました。${NC}"
else
    echo -e "${YELLOW}local.settings.json は既に存在します。${NC}"
fi

# 管理画面セットアップ
echo -e "${YELLOW}管理画面 (React) をセットアップしています...${NC}"
cd "$PROJECT_ROOT/admin-dashboard"

# 依存関係をインストール
echo "管理画面の依存関係をインストールしています..."
npm install

# .env.local を作成
if [ ! -f .env.local ]; then
    echo ".env.local を作成しています..."
    cp .env.local.example .env.local
    # 開発用のデフォルト値を設定
    sed -i.bak 's/your-azure-ad-b2c-client-id/development-client-id/g' .env.local
    sed -i.bak 's/your-tenant-name/development-tenant/g' .env.local
    rm .env.local.bak
    echo -e "${GREEN}.env.local を作成しました。${NC}"
else
    echo -e "${YELLOW}.env.local は既に存在します。${NC}"
fi

echo -e "${GREEN}セットアップが完了しました！${NC}"
echo ""
echo "次のコマンドで開発サーバーを起動できます："
echo ""
echo "1. APIサーバーを起動 (ターミナル1):"
echo "   cd $PROJECT_ROOT/api && npm start"
echo ""
echo "2. 管理画面を起動 (ターミナル2):"
echo "   cd $PROJECT_ROOT/admin-dashboard && npm start"
echo ""
echo "管理画面は http://localhost:3000 でアクセスできます。"
echo "ログイン画面で「開発用ログイン」ボタンをクリックしてください。"