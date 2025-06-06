// 申込フォーム用の型定義

export interface OrganizationInfo {
  organizationName: string;
  facilityType: 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'nursing_home' | 'other';
  postalCode: string;
  address: string;
  representativeName: string;
}

export interface ContactInfo {
  contactPerson: string;
  email: string;
  phoneNumber: string;
  department?: string;
}

export interface ServiceSelection {
  requestedAccountCount: number;
  billingCycle: 'monthly' | 'yearly';
  startDate: Date;
}

export interface PaymentMethod {
  paymentType: 'card' | 'invoice';
  agreementAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

export interface PricingCalculation {
  basePrice: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ApplicationSubmission {
  organizationInfo: OrganizationInfo;
  contactInfo: ContactInfo;
  serviceSelection: ServiceSelection;
  paymentMethod: PaymentMethod;
}

export type FormStep = 1 | 2 | 3 | 4 | 5 | 6;