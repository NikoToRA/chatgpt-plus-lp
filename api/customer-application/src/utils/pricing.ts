import { PricingCalculation } from '../types/application';

const MONTHLY_PRICE = 3000;
const YEARLY_DISCOUNT_RATE = 0.167; // 2ヶ月分割引
const TAX_RATE = 0.10;

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
    totalAmount
  };
};