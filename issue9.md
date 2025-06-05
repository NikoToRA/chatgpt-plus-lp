# Issue #9: 既存管理画面のAzure Static Web Appsデプロイ

## 📋 概要
現在ローカルで動作している管理画面（admin-dashboard）をAzure Static Web Appsにデプロイして本番環境で利用可能にする

## 🎯 目標
管理者がWebブラウザからどこでも管理画面にアクセスできる環境の構築

## 📦 現在の状況

### 既存の管理画面機能
- ✅ **ダッシュボード**: 売上推移グラフ、月次データ可視化
- ✅ **顧客管理**: 医療機関種別、住所、申込情報表示
- ✅ **請求書管理**: PDF生成・プレビュー・メール送信
- ✅ **会社設定**: SendGrid連携、テンプレート管理
- ⚠️ **データソース**: 現在ローカルストレージ使用

### 技術スタック
- React + TypeScript
- Material-UI
- ローカルストレージによるデータ管理

## 🔧 実装タスク

### 1. Azure Static Web Apps設定

#### リソース作成
```bash
# Azure CLI でStatic Web App作成
az staticwebapp create \
  --name chatgpt-plus-admin-dashboard \
  --resource-group Chatgpthospital \
  --source https://github.com/[YOUR_REPO] \
  --location japaneast \
  --branch main \
  --app-location "/admin-dashboard" \
  --output-location "build"
```

#### GitHub Actions設定
`.github/workflows/azure-static-web-apps-admin.yml`
```yaml
name: Azure Static Web Apps CI/CD - Admin Dashboard

on:
  push:
    branches:
      - main
    paths:
      - 'admin-dashboard/**'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main
    paths:
      - 'admin-dashboard/**'

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'admin-dashboard/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd admin-dashboard
          npm ci
      
      - name: Build application
        run: |
          cd admin-dashboard
          npm run build
        env:
          REACT_APP_API_BASE_URL: ${{ secrets.REACT_APP_API_BASE_URL }}
          REACT_APP_AZURE_FUNCTION_URL: ${{ secrets.REACT_APP_AZURE_FUNCTION_URL }}
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/admin-dashboard"
          output_location: "build"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN }}
          action: "close"
```

### 2. Azure Functions連携準備

#### 環境変数設定
`admin-dashboard/.env.production`
```bash
REACT_APP_API_BASE_URL=https://chatgpt-plus-functions.azurewebsites.net
REACT_APP_AZURE_FUNCTION_URL=https://chatgpt-plus-functions.azurewebsites.net/api
```

#### API サービス更新
`admin-dashboard/src/services/api.ts`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 顧客データ取得（本番環境ではAzure Functions経由）
  async getCustomers(): Promise<Customer[]> {
    if (process.env.NODE_ENV === 'production') {
      // 本番: Azure Functions API
      const response = await fetch(`${this.baseURL}/api/customers`);
      return response.json();
    } else {
      // 開発: ローカルストレージ
      const data = localStorage.getItem('customers');
      return data ? JSON.parse(data) : [];
    }
  }

  // 売上データ取得
  async getRevenueData(): Promise<RevenueData[]> {
    if (process.env.NODE_ENV === 'production') {
      const response = await fetch(`${this.baseURL}/api/dashboard/revenue`);
      return response.json();
    } else {
      // ローカルストレージからの取得
      const data = localStorage.getItem('revenueData');
      return data ? JSON.parse(data) : [];
    }
  }

  // 請求書データ取得
  async getInvoices(): Promise<Invoice[]> {
    if (process.env.NODE_ENV === 'production') {
      const response = await fetch(`${this.baseURL}/api/invoices`);
      return response.json();
    } else {
      const data = localStorage.getItem('invoices');
      return data ? JSON.parse(data) : [];
    }
  }
}

export const apiService = new ApiService();
```

### 3. 認証システム統合（Azure AD B2C）

#### Azure AD B2C設定
```typescript
// admin-dashboard/src/config/authConfig.ts
import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AAD_CLIENT_ID!,
    authority: `https://${process.env.REACT_APP_AAD_TENANT_NAME}.b2clogin.com/${process.env.REACT_APP_AAD_TENANT_NAME}.onmicrosoft.com/${process.env.REACT_APP_AAD_POLICY_NAME}`,
    knownAuthorities: [`${process.env.REACT_APP_AAD_TENANT_NAME}.b2clogin.com`],
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile'],
};
```

#### 認証プロバイダー
```typescript
// admin-dashboard/src/components/Auth/AuthProvider.tsx
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../../config/authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
};
```

### 4. 静的ファイル設定

#### staticwebapp.config.json
```json
{
  "routes": [
    {
      "route": "/login",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/login",
      "statusCode": 302
    }
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://chatgpt-plus-functions.azurewebsites.net https://login.microsoftonline.com"
  }
}
```

### 5. 環境別設定管理

#### 開発環境
```bash
# admin-dashboard/.env.development
REACT_APP_API_BASE_URL=http://localhost:7071
REACT_APP_AAD_CLIENT_ID=development-client-id
REACT_APP_AAD_TENANT_NAME=development-tenant
```

#### 本番環境
```bash
# GitHub Secrets設定
AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN=<Generated Token>
REACT_APP_API_BASE_URL=https://chatgpt-plus-functions.azurewebsites.net
REACT_APP_AAD_CLIENT_ID=<Production Client ID>
REACT_APP_AAD_TENANT_NAME=<Production Tenant>
```

## 📋 実装チェックリスト

### Azure設定
- [ ] Azure Static Web Apps リソース作成
- [ ] カスタムドメイン設定
- [ ] SSL証明書設定
- [ ] Azure AD B2C テナント作成

### GitHub Actions
- [ ] ワークフローファイル作成
- [ ] Secrets設定
- [ ] 自動デプロイ動作確認

### アプリケーション更新
- [ ] 環境変数設定
- [ ] API サービス更新（本番/開発切り替え）
- [ ] 認証システム統合
- [ ] ビルド設定最適化

### テスト
- [ ] ローカル環境での動作確認
- [ ] ステージング環境でのテスト
- [ ] 本番環境での動作確認
- [ ] 認証フロー確認

### セキュリティ
- [ ] HTTPS強制設定
- [ ] セキュリティヘッダー設定
- [ ] CORS設定
- [ ] 認証保護確認

## 🚀 デプロイ手順

### Step 1: Azure リソース準備
1. Azure Static Web Apps作成
2. Azure AD B2C設定
3. カスタムドメイン設定

### Step 2: GitHub設定
1. Secrets追加
2. ワークフローファイル追加
3. 初回デプロイ実行

### Step 3: 動作確認
1. 管理画面アクセス確認
2. 認証フロー確認
3. API連携確認

### Step 4: DNS設定
1. カスタムドメイン追加
2. SSL証明書設定
3. 最終動作確認

## ✅ 完了条件

### 機能要件
- [ ] 管理画面の全機能が本番環境で動作
- [ ] 認証システムが正常に機能
- [ ] Azure Functions APIとの連携が動作
- [ ] レスポンシブデザインが適用

### 非機能要件
- [ ] HTTPS でのアクセス
- [ ] 99.9% の可用性
- [ ] 2秒以内の初期ロード時間
- [ ] セキュリティベストプラクティス適用

## 🔗 関連リソース

- **Azure Static Web Apps**: https://docs.microsoft.com/azure/static-web-apps/
- **Azure AD B2C**: https://docs.microsoft.com/azure/active-directory-b2c/
- **GitHub Actions**: https://docs.github.com/actions

---

**担当者**: GitHub Actions / 自動化ワークフロー  
**期限**: 3-5日  
**関連Issue**: #8 (顧客申込フォーム), #10 (Azure Functions API)  
**Dependencies**: Azure SQL Database（完了済み）