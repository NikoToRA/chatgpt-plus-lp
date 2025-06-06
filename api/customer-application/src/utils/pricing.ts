import { PricingCalculation } from '../types/optimizedApplication';
import { CompanyPlan } from '../services/companyPlans';

// Legacy constants for fallback
const MONTHLY_PRICE = 3000;
const YEARLY_DISCOUNT_RATE = 0.167; // 2ヶ月分割引
const TAX_RATE = 0.10;

// Updated pricing calculation that uses CompanyPlan data
export const calculatePricingFromPlan = (
  plan: CompanyPlan,
  accountCount: number,
  billingCycle: 'monthly' | 'yearly'
): PricingCalculation => {
  // Fixed service fee regardless of account count (service management fee)
  let basePrice: number;
  let discountAmount = 0;

  if (billingCycle === 'monthly') {
    basePrice = plan.unitPrice;
  } else {
    const yearlyBase = plan.unitPrice * 12;
    discountAmount = yearlyBase * 0.1; // 10% yearly discount
    basePrice = yearlyBase - discountAmount;
  }

  const subtotal = basePrice;
  const taxAmount = Math.floor(subtotal * (plan.taxRate / 100));
  const totalAmount = subtotal + taxAmount;

  return {
    basePrice: billingCycle === 'yearly' ? plan.unitPrice * 12 : plan.unitPrice,
    discountAmount,
    subtotal,
    taxAmount,
    totalAmount,
    billingCycle,
    accountCount,
    planId: plan.id
  };
};

// Legacy function for backwards compatibility
export const calculatePricing = (
  accountCount: number,
  billingCycle: 'monthly' | 'yearly'
): PricingCalculation => {
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
  const taxAmount = Math.floor(subtotal * TAX_RATE);
  const totalAmount = subtotal + taxAmount;

  return {
    basePrice,
    discountAmount,
    subtotal,
    taxAmount,
    totalAmount,
    billingCycle,
    accountCount
  };
};