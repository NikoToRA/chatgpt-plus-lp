export interface Customer {
  id: string;
  email: string;
  organization: string;
  name: string;
  chatGptEmail?: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  plan: 'basic' | 'plus' | 'enterprise';
  paymentMethod: 'card' | 'invoice';
  createdAt: Date;
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