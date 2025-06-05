export interface ChatGptAccount {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  startDate?: Date;
  productId?: string;
  expiresAt?: Date;
  subscriptionMonths?: number;
  status?: 'active' | 'suspended' | 'expired';
}

export interface Customer {
  id: string;
  email: string;
  organization: string;
  name: string;
  chatGptAccounts: ChatGptAccount[];
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  plan: 'basic' | 'plus' | 'enterprise';
  productId?: string;
  paymentMethod: 'card' | 'invoice';
  registeredAt: Date;
  subscriptionMonths: number;
  expiresAt: Date;
  lastActivityAt: Date;
  stripeCustomerId?: string;
}

export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  activeAccounts: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export interface AccountLinking {
  customerId: string;
  customerEmail: string;
  chatGptEmail: string;
  linkedAt: Date;
  linkedBy: string;
}

export interface InvoiceRequest {
  customerId: string;
  companyName: string;
  billingAddress: string;
  taxId?: string;
  contactPerson: string;
  contactEmail: string;
  plan: string;
  notes?: string;
}

export interface UsageData {
  accountId: string;
  date: Date;
  messagesCount: number;
  tokensUsed: number;
  cost: number;
}

export interface CompanyInfo {
  id: string;
  companyName: string;
  representativeName: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  taxId?: string;
  bankInfo: {
    bankName: string;
    branchName: string;
    accountType: 'savings' | 'checking';
    accountNumber: string;
    accountHolder: string;
  };
  products: ProductInfo[];
  invoiceSettings: {
    invoicePrefix: string;
    paymentTermDays: number;
    notes?: string;
  };
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number;
  isActive: boolean;
}