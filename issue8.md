# Issue #8: 顧客申込フォーム開発（React SPA）

## 📋 概要
医療機関向けChatGPT Plus申込システムの顧客向けフロントエンド開発

## 🎯 目標
医療機関が簡単にChatGPT Plusサービスを申し込めるWebアプリケーションの作成

## 📦 成果物
- React TypeScript SPA
- レスポンシブデザイン対応
- Azure Static Web Appsデプロイ対応

## 🔧 技術要件

### フレームワーク・ライブラリ
```bash
npx create-react-app customer-application --template typescript
cd customer-application
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install react-hook-form yup @hookform/resolvers
npm install axios
```

### ディレクトリ構成
```
customer-application/
├── src/
│   ├── components/
│   │   ├── ApplicationForm/
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── OrganizationInfo.tsx
│   │   │   ├── ContactInfo.tsx
│   │   │   ├── ServiceSelection.tsx
│   │   │   ├── EstimateCalculator.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── Common/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorMessage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── application.ts
│   ├── hooks/
│   │   └── useApplication.ts
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
```

## 📝 機能要件

### 1. 申込フォーム（マルチステップ）

#### Step 1: 医療機関情報
```typescript
interface OrganizationInfo {
  organizationName: string;        // 医療機関名
  facilityType: 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'nursing_home' | 'other';
  postalCode: string;              // 郵便番号（7桁）
  address: string;                 // 住所
  representativeName: string;      // 代表者名
}
```

#### Step 2: 担当者情報
```typescript
interface ContactInfo {
  contactPerson: string;           // 担当者名
  email: string;                   // メールアドレス
  phoneNumber: string;             // 電話番号
  department?: string;             // 部署名（任意）
}
```

#### Step 3: サービス選択
```typescript
interface ServiceSelection {
  requestedAccountCount: number;   // 必要アカウント数（1-100）
  billingCycle: 'monthly' | 'yearly'; // 月額/年額
  startDate: Date;                 // 利用開始希望日
}
```

#### Step 4: 見積確認
- 料金自動計算表示
- 税込み総額表示
- 割引適用（年額プランの場合）

#### Step 5: 決済方法選択
```typescript
interface PaymentMethod {
  paymentType: 'card' | 'invoice';
  agreementAccepted: boolean;      // 利用規約同意
  privacyPolicyAccepted: boolean;  // プライバシーポリシー同意
}
```

#### Step 6: 申込確認・送信
- 入力内容の最終確認
- 申込送信処理
- 完了画面表示

### 2. バリデーション

#### フォームバリデーション（Yup使用）
```typescript
const organizationSchema = yup.object({
  organizationName: yup.string()
    .required('医療機関名は必須です')
    .max(200, '医療機関名は200文字以内で入力してください'),
  facilityType: yup.string()
    .required('施設種別を選択してください'),
  postalCode: yup.string()
    .required('郵便番号は必須です')
    .matches(/^\d{7}$/, '郵便番号は7桁の数字で入力してください'),
  address: yup.string()
    .required('住所は必須です')
    .max(500, '住所は500文字以内で入力してください'),
  email: yup.string()
    .required('メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください'),
  phoneNumber: yup.string()
    .required('電話番号は必須です')
    .matches(/^[\d-]+$/, '電話番号は数字とハイフンで入力してください')
});
```

### 3. 料金計算ロジック

```typescript
interface PricingCalculation {
  basePrice: number;               // 基本料金（アカウント数 × 単価）
  discountAmount: number;          // 割引額
  subtotal: number;                // 小計
  taxAmount: number;               // 消費税額
  totalAmount: number;             // 総額
}

const calculatePricing = (
  accountCount: number,
  billingCycle: 'monthly' | 'yearly'
): PricingCalculation => {
  const MONTHLY_PRICE = 3000;
  const YEARLY_DISCOUNT_RATE = 0.167; // 2ヶ月分割引
  const TAX_RATE = 0.10;

  let basePrice: number;
  let discountAmount = 0;

  if (billingCycle === 'monthly') {
    basePrice = accountCount * MONTHLY_PRICE;
  } else {
    const yearlyBase = accountCount * MONTHLY_PRICE * 12;
    discountAmount = yearlyBase * YEARLY_DISCOUNT_RATE;
    basePrice = yearlyBase - discountAmount;
  }

  const subtotal = basePrice;
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  return {
    basePrice,
    discountAmount,
    subtotal,
    taxAmount,
    totalAmount
  };
};
```

## 🎨 デザイン要件

### Material-UI テーマ設定
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});
```

### レスポンシブ対応
- デスクトップ: 1200px以上
- タブレット: 768px - 1199px  
- モバイル: 767px以下

### アクセシビリティ
- ARIA属性の適切な設定
- キーボードナビゲーション対応
- 色のコントラスト比4.5:1以上

## 🔌 API連携

### 申込送信API
```typescript
interface ApplicationSubmission {
  organizationInfo: OrganizationInfo;
  contactInfo: ContactInfo;
  serviceSelection: ServiceSelection;
  paymentMethod: PaymentMethod;
}

const submitApplication = async (data: ApplicationSubmission): Promise<{
  success: boolean;
  customerId?: string;
  message: string;
}> => {
  try {
    const response = await axios.post('/api/customer-application', data);
    return response.data;
  } catch (error) {
    throw new Error('申込送信に失敗しました');
  }
};
```

### 郵便番号→住所自動入力
```typescript
const fetchAddressFromPostalCode = async (postalCode: string): Promise<string> => {
  const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
  if (response.data.results) {
    const result = response.data.results[0];
    return `${result.address1}${result.address2}${result.address3}`;
  }
  return '';
};
```

## ✅ 完了条件

### 機能テスト
- [ ] 全ステップの入力・遷移動作確認
- [ ] バリデーションエラー表示確認
- [ ] 料金計算の正確性確認
- [ ] レスポンシブデザイン確認
- [ ] 申込送信処理確認

### パフォーマンス
- [ ] First Contentful Paint < 2秒
- [ ] Largest Contentful Paint < 4秒
- [ ] Cumulative Layout Shift < 0.1

### デプロイ
- [ ] Azure Static Web Apps設定
- [ ] カスタムドメイン設定
- [ ] HTTPS有効化

## 🚀 デプロイ設定

### Azure Static Web Apps設定
```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
    paths:
      - 'customer-application/**'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main
    paths:
      - 'customer-application/**'

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/customer-application"
          output_location: "build"
```

## 📋 実装チェックリスト

### セットアップ
- [ ] React TypeScript プロジェクト作成
- [ ] 必要パッケージインストール
- [ ] フォルダ構成作成
- [ ] Material-UI テーマ設定

### コンポーネント開発
- [ ] Layout/Header/Footer
- [ ] StepIndicator（進捗表示）
- [ ] OrganizationInfo（医療機関情報）
- [ ] ContactInfo（担当者情報）
- [ ] ServiceSelection（サービス選択）
- [ ] EstimateCalculator（見積計算）
- [ ] PaymentMethodSelector（決済方法）
- [ ] ConfirmationScreen（確認画面）

### ユーティリティ
- [ ] フォームバリデーション
- [ ] 料金計算ロジック
- [ ] API通信サービス
- [ ] エラーハンドリング

### テスト
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] E2Eテスト
- [ ] アクセシビリティテスト

### デプロイ
- [ ] Azure Static Web Apps設定
- [ ] GitHub Actions設定
- [ ] 環境変数設定
- [ ] 本番動作確認

## 🎯 優先度

**High Priority:**
- 基本フォーム機能（Step 1-6）
- バリデーション
- 料金計算
- レスポンシブデザイン

**Medium Priority:**
- 郵便番号自動入力
- アニメーション効果
- 詳細なエラーメッセージ

**Low Priority:**
- 高度なアクセシビリティ機能
- パフォーマンス最適化
- A/Bテスト対応

---

**担当者**: GitHub Actions / 自動化ワークフロー  
**期限**: 1-2週間  
**関連Issue**: #7 (Azure Functions API), #9 (管理画面デプロイ)  
**Dependencies**: Azure SQL Database（完了済み）