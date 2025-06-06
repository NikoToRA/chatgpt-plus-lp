// 行動心理学最適化版申込フォーム型定義

export interface ServiceSelection {
  planId: string;
  requestedAccountCount: number;
  billingCycle: 'monthly' | 'yearly';
  startDate: Date;
}

export interface BasicInformation {
  // 医療機関情報
  organizationName: string;
  facilityType: 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'nursing_home' | 'other';
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  phoneNumber: string;
  
  // 担当者情報
  contactPerson: string;
  department?: string;
  email: string;
  contactPhone?: string;
}

export interface PaymentInformation {
  paymentMethod: 'card' | 'invoice';
  
  // カード決済用（将来のStripe連携）
  cardHolderName?: string;
  
  // 請求書払い用
  billingContact?: string;
  billingEmail?: string;
  
  // 利用規約・プライバシーポリシー同意
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface PricingCalculation {
  basePrice: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  billingCycle: 'monthly' | 'yearly';
  accountCount: number;
  planId?: string;
}

export interface OptimizedApplicationSubmission {
  serviceSelection: ServiceSelection;
  basicInformation: BasicInformation;
  paymentInformation: PaymentInformation;
  submittedAt: Date;
  applicationId?: string;
}

export type OptimizedFormStep = 1 | 2 | 3 | 4 | 5;

export interface FormStepInfo {
  step: OptimizedFormStep;
  title: string;
  description: string;
  icon?: string;
  estimatedTime: string;
}

export const FORM_STEPS: FormStepInfo[] = [
  {
    step: 1,
    title: 'サービス選択',
    description: 'ご希望のプランをお選びください',
    estimatedTime: '30秒'
  },
  {
    step: 2,
    title: '基本情報',
    description: '医療機関情報と担当者情報',
    estimatedTime: '2分'
  },
  {
    step: 3,
    title: 'お見積り',
    description: '料金とサービス内容の確認',
    estimatedTime: '1分'
  },
  {
    step: 4,
    title: 'お支払い方法',
    description: '決済方法の選択と規約同意',
    estimatedTime: '1分'
  },
  {
    step: 5,
    title: '申込完了',
    description: '契約書のダウンロードと開始準備',
    estimatedTime: '完了'
  }
];