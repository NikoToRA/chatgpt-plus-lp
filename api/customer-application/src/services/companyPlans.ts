// Company Plans Service
// Integrates with company-configured plans from admin dashboard

export interface CompanyPlan {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number;
  isActive: boolean;
  billingOptions: Array<'monthly' | 'yearly'>;
  maxAccounts?: number;
  features: string[];
}

// Company Settings API response interface
interface CompanySettingsResponse {
  success: boolean;
  data: {
    products: Array<{
      id: string;
      name: string;
      description: string;
      unitPrice: number;
      taxRate: number;
      isActive: boolean;
    }>;
  };
}

// Default plans matching company settings - TEMPORARY until Azure API is fixed
export const DEFAULT_COMPANY_PLANS: CompanyPlan[] = [
  {
    id: 'prod-1',
    name: 'ChatGPT Plus 医療機関向けプラン',
    description: '医療機関専用のChatGPT Plus代行サービス（チームプラン・アカウント共有）',
    unitPrice: 3000, // Updated price from admin dashboard test
    taxRate: 0.10,
    isActive: true,
    billingOptions: ['monthly', 'yearly'],
    maxAccounts: 10,
    features: [
      'ChatGPT Plus契約代行',
      'アカウント設定・管理',
      '請求書一元化',
      '技術サポート'
    ]
  },
  {
    id: 'prod-2',
    name: 'ChatGPT Plus 企業向けプラン',
    description: '企業向けのChatGPT Plus代行サービス（チームプラン・アカウント共有）',
    unitPrice: 2500, // Different pricing for enterprise
    taxRate: 0.10,
    isActive: true,
    billingOptions: ['monthly', 'yearly'],
    maxAccounts: 10,
    features: [
      'ChatGPT Plus契約代行',
      'アカウント設定・管理',
      '請求書一元化',
      'サポート対応'
    ]
  },
  {
    id: 'prod-1735632267392',
    name: 'ChatGPT Plus 医療機関プラン',
    description: '医療機関向け専用プラン',
    unitPrice: 3000, // Test product from admin dashboard
    taxRate: 0.10,
    isActive: true,
    billingOptions: ['monthly', 'yearly'],
    maxAccounts: 10,
    features: [
      'ChatGPT Plus契約代行',
      'アカウント設定・管理',
      '請求書一元化',
      '技術サポート'
    ]
  }
];

// Fetch company plans from Azure API or company settings
export const fetchCompanyPlans = async (): Promise<CompanyPlan[]> => {
  try {
    // First try to fetch from company settings API
    const response = await fetch('https://chatgpt-plus-api.azurewebsites.net/api/company-settings');
    
    if (response.ok) {
      const data: CompanySettingsResponse = await response.json();
      if (data.success && data.data && data.data.products) {
        // Convert company products to company plans format
        const companyPlans: CompanyPlan[] = data.data.products
          .filter(product => product.isActive)
          .map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            unitPrice: product.unitPrice,
            taxRate: product.taxRate,
            isActive: product.isActive,
            billingOptions: ['monthly', 'yearly'] as Array<'monthly' | 'yearly'>,
            maxAccounts: 10, // Default value
            features: [
              'ChatGPT Plus契約代行',
              'アカウント設定・管理',
              '請求書一元化',
              product.name.includes('医療') ? '技術サポート' : 'サポート対応'
            ]
          }));
        
        console.log('Company plans loaded from company settings:', companyPlans);
        return companyPlans;
      }
    }
    
    // Try fallback: company-plans API (if exists)
    try {
      const plansResponse = await fetch('https://chatgpt-plus-api.azurewebsites.net/api/company-plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success && plansData.plans) {
          return plansData.plans.filter((plan: CompanyPlan) => plan.isActive);
        }
      }
    } catch (plansError) {
      console.warn('Company plans API not available:', plansError);
    }
    
    // Try localStorage fallback
    try {
      const localCompanyInfo = localStorage.getItem('companyInfo');
      if (localCompanyInfo) {
        const companyInfo = JSON.parse(localCompanyInfo);
        if (companyInfo.products) {
          const localPlans: CompanyPlan[] = companyInfo.products
            .filter((product: any) => product.isActive)
            .map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              unitPrice: product.unitPrice,
              taxRate: product.taxRate,
              isActive: product.isActive,
              billingOptions: ['monthly', 'yearly'] as Array<'monthly' | 'yearly'>,
              maxAccounts: 10,
              features: [
                'ChatGPT Plus契約代行',
                'アカウント設定・管理',
                '請求書一元化',
                product.name.includes('医療') ? '技術サポート' : 'サポート対応'
              ]
            }));
          console.log('Company plans loaded from localStorage:', localPlans);
          return localPlans;
        }
      }
    } catch (localError) {
      console.warn('Failed to load from localStorage:', localError);
    }
    
    // Final fallback to default plans
    console.warn('Using default fallback plans');
    return DEFAULT_COMPANY_PLANS.filter(plan => plan.isActive);
  } catch (error) {
    console.error('Error fetching company plans:', error);
    // Return default plans as fallback
    return DEFAULT_COMPANY_PLANS.filter(plan => plan.isActive);
  }
};

// Calculate pricing for a plan
// Note: This is for ChatGPT Plus subscription management service, not per-account billing
export const calculatePlanPricing = (
  plan: CompanyPlan, 
  accountCount: number, 
  billingCycle: 'monthly' | 'yearly'
) => {
  // Fixed monthly service fee regardless of account count (service management fee)
  const basePrice = plan.unitPrice;
  const yearlyBasePrice = basePrice * 12;
  const subtotal = billingCycle === 'yearly' ? yearlyBasePrice * 0.9 : basePrice; // 10% discount for yearly
  const discountAmount = billingCycle === 'yearly' ? yearlyBasePrice * 0.1 : 0;
  const taxAmount = Math.floor(subtotal * plan.taxRate);
  const totalAmount = subtotal + taxAmount;

  return {
    basePrice: yearlyBasePrice,
    discountAmount,
    subtotal,
    taxAmount,
    totalAmount,
    billingCycle,
    accountCount,
    planId: plan.id
  };
};

// Check if account count is valid for plan
export const isValidAccountCount = (plan: CompanyPlan, accountCount: number): boolean => {
  if (!plan.maxAccounts) return true; // No limit
  return accountCount <= plan.maxAccounts;
};