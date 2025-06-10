import { Customer, DashboardStats, AccountLinking, InvoiceRequest, FormSubmission } from '../types';
import { supabase } from './supabase';

// Customer APIs
export const customerApi = {
  getAll: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
    
    // Supabaseデータをフロントエンド形式に変換
    return (data || []).map(customer => ({
      id: customer.id,
      email: customer.email,
      organization: customer.organization,
      name: customer.name,
      phoneNumber: customer.phone_number,
      postalCode: customer.postal_code,
      address: customer.address,
      facilityType: customer.facility_type,
      requestedAccountCount: customer.account_count,
      account_count: customer.account_count,
      status: customer.status,
      plan: customer.plan,
      paymentMethod: customer.payment_method,
      registeredAt: new Date(customer.created_at),
      subscriptionMonths: customer.subscription_months,
      expiresAt: new Date(customer.expires_at),
      lastActivityAt: new Date(customer.last_activity_at),
      stripeCustomerId: customer.stripe_customer_id,
      notes: customer.notes,
      sourceSubmissionId: customer.source_submission_id,
      created_at: new Date(customer.created_at),
      updated_at: new Date(customer.updated_at),
      chatGptAccounts: []
    }));
  },

  getById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
    
    return data;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    // Supabaseスキーマに合わせてデータを変換
    const supabaseData = {
      email: data.email,
      organization: data.organization,
      name: data.name,
      phone_number: data.phoneNumber,
      postal_code: data.postalCode,
      address: data.address,
      facility_type: data.facilityType || 'other',
      account_count: data.requestedAccountCount || 1,
      status: data.status || 'trial',
      plan: data.plan || 'plus',
      payment_method: data.paymentMethod || 'card',
      subscription_months: data.subscriptionMonths || 12,
      expires_at: data.expiresAt,
      last_activity_at: data.lastActivityAt || new Date(),
      stripe_customer_id: data.stripeCustomerId,
      notes: data.notes,
      source_submission_id: data.sourceSubmissionId
    };

    const { data: customer, error } = await supabase
      .from('customers')
      .insert(supabaseData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    // レスポンスデータをフロントエンド形式に変換
    return {
      id: customer.id,
      email: customer.email,
      organization: customer.organization,
      name: customer.name,
      phoneNumber: customer.phone_number,
      postalCode: customer.postal_code,
      address: customer.address,
      facilityType: customer.facility_type,
      requestedAccountCount: customer.account_count,
      account_count: customer.account_count,
      status: customer.status,
      plan: customer.plan,
      paymentMethod: customer.payment_method,
      registeredAt: new Date(customer.created_at),
      subscriptionMonths: customer.subscription_months,
      expiresAt: new Date(customer.expires_at),
      lastActivityAt: new Date(customer.last_activity_at),
      stripeCustomerId: customer.stripe_customer_id,
      notes: customer.notes,
      sourceSubmissionId: customer.source_submission_id,
      created_at: new Date(customer.created_at),
      updated_at: new Date(customer.updated_at),
      chatGptAccounts: []
    };
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const { data: customer, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update customer: ${error.message}`);
    }
    
    return customer;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  },

  linkAccount: async (linking: AccountLinking): Promise<void> => {
    // TODO: Implement account linking logic
  },
};

// Dashboard APIs
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('status, plan, account_count');
    
    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
    
    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
    
    // Calculate revenue based on plan and account count
    const monthlyRevenue = customers?.reduce((total, customer) => {
      const basePrice = customer.plan === 'plus' ? 6000 : 3000;
      return total + (basePrice * (customer.account_count || 1));
    }, 0) || 0;
    
    return {
      totalCustomers,
      activeCustomers,
      totalRevenue: monthlyRevenue * 12,
      monthlyRevenue,
    };
  },

  getRecentApplications: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw new Error(`Failed to fetch recent applications: ${error.message}`);
    }
    
    return data || [];
  },
};

// Invoice APIs
export const invoiceApi = {
  request: async (data: InvoiceRequest): Promise<{ invoiceNumber: string }> => {
    // TODO: Implement invoice generation
    const invoiceNumber = `INV-${Date.now()}`;
    return { invoiceNumber };
  },
};

// Account APIs
export const accountApi = {
  provision: async (customerId: string): Promise<void> => {
    // TODO: Implement account provisioning
  },

  getUsage: async (accountId: string): Promise<any> => {
    // TODO: Implement usage tracking
    return {};
  },
};

// Form Submission APIs
export const formSubmissionApi = {
  getAll: async (): Promise<FormSubmission[]> => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch form submissions: ${error.message}`);
    }
    
    return data || [];
  },

  getById: async (id: string): Promise<FormSubmission> => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch form submission: ${error.message}`);
    }
    
    return data;
  },

  updateStatus: async (id: string, status: FormSubmission['status']): Promise<FormSubmission> => {
    const { data, error } = await supabase
      .from('form_submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update form submission status: ${error.message}`);
    }
    
    return data;
  },

  getStats: async () => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('purpose, status, created_at');
    
    if (error) {
      throw new Error(`Failed to fetch form submission stats: ${error.message}`);
    }
    
    const total = data?.length || 0;
    const newSubmissions = data?.filter(s => s.status === 'new').length || 0;
    const applicationSubmissions = data?.filter(s => s.purpose === 'お申し込み').length || 0;
    const resourceRequests = data?.filter(s => s.purpose === '資料請求').length || 0;
    
    return {
      total,
      newSubmissions,
      applicationSubmissions,
      resourceRequests,
    };
  },
};