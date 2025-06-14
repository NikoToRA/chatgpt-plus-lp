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
  phoneNumber?: string;
  postalCode?: string;
  address?: string;
  facilityType?: 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'nursing_home' | 'other';
  requestedAccountCount?: number;
  account_count?: number;
  applicationDate?: Date;
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
  notes?: string;
  sourceSubmissionId?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
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
  emailSettings: {
    sendgridApiKey: string;
    fromEmail: string;
    fromName: string;
    isConfigured: boolean;
  };
  invoiceTemplate: {
    emailSubjectTemplate: string;
    emailBodyTemplate: string;
    invoiceFooterNotes: string;
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

export interface InvoicePDF {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  billingType: 'monthly' | 'yearly';
  totalAmount: number;
  monthlyFee: number;
  billingMonths: number;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSubmission {
  id: string;
  organization: string;
  name: string;
  email: string;
  purpose: '資料請求' | 'お申し込み' | 'その他';
  accounts: number;
  message?: string;
  user_agent?: string;
  ip_address?: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  created_at: Date;
  updated_at: Date;
}