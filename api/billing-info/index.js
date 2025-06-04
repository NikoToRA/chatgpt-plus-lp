const Stripe = require('stripe');
const { TableClient } = require('@azure/data-tables');

// Stripe設定
const getStripeClient = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return null;
  }
  return new Stripe(stripeKey);
};

// Azure Table Storage設定
const getTableClient = (tableName) => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    console.error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    return null;
  }
  return TableClient.fromConnectionString(connectionString, tableName);
};

// 請求履歴を取得
const getBillingHistory = async (context, customerId, limit = 10) => {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error('Payment service not configured');
  }

  // 顧客情報を取得
  const customerTable = getTableClient('Customers');
  const customerEntity = await customerTable.getEntity('Customer', customerId);
  
  if (!customerEntity.stripeCustomerId) {
    throw new Error('Customer does not have a Stripe ID');
  }

  // Stripeから請求書を取得
  const invoices = await stripe.invoices.list({
    customer: customerEntity.stripeCustomerId,
    limit: limit
  });

  return invoices.data.map(invoice => ({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    date: new Date(invoice.created * 1000).toISOString(),
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    paid: invoice.paid,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdf: invoice.invoice_pdf,
    items: invoice.lines.data.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unit_amount,
      amount: item.amount
    }))
  }));
};

// 支払い方法を取得
const getPaymentMethods = async (context, customerId) => {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error('Payment service not configured');
  }

  // 顧客情報を取得
  const customerTable = getTableClient('Customers');
  const customerEntity = await customerTable.getEntity('Customer', customerId);
  
  if (!customerEntity.stripeCustomerId) {
    throw new Error('Customer does not have a Stripe ID');
  }

  // Stripeから支払い方法を取得
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerEntity.stripeCustomerId,
    type: 'card'
  });

  // 銀行振込情報も追加（日本向け）
  const bankTransferInfo = {
    type: 'bank_transfer',
    enabled: true,
    bankName: '三菱UFJ銀行',
    branchName: '東京営業部',
    accountType: '普通',
    accountNumber: '1234567',
    accountName: 'カ）ワンダードリル'
  };

  return {
    cards: paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expMonth: method.card.exp_month,
      expYear: method.card.exp_year,
      isDefault: method.id === customerEntity.defaultPaymentMethodId
    })),
    bankTransfer: bankTransferInfo
  };
};

// 現在の利用状況を取得
const getCurrentUsage = async (context, customerId) => {
  // サブスクリプション情報を取得
  const subscriptionTable = getTableClient('Subscriptions');
  const query = subscriptionTable.listEntities({
    queryOptions: {
      filter: `customerId eq '${customerId}' and status eq 'active'`
    }
  });

  let activeSubscriptions = [];
  for await (const entity of query) {
    activeSubscriptions.push({
      subscriptionId: entity.rowKey,
      planId: entity.planId,
      accountCount: entity.accountCount,
      billingCycle: entity.billingCycle,
      totalPrice: entity.totalPrice,
      nextBillingDate: entity.nextBillingDate || null
    });
  }

  // 今月の利用料金を計算
  const currentMonthCharges = activeSubscriptions.reduce((total, sub) => {
    const monthlyCharge = sub.billingCycle === 'yearly' 
      ? Math.floor(sub.totalPrice / 12)
      : sub.totalPrice;
    return total + monthlyCharge;
  }, 0);

  return {
    activeSubscriptions: activeSubscriptions,
    currentMonthCharges: currentMonthCharges,
    totalActiveAccounts: activeSubscriptions.reduce((total, sub) => total + sub.accountCount, 0)
  };
};

// 請求サマリーを取得
const getBillingSummary = async (context, customerId) => {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error('Payment service not configured');
  }

  // 顧客情報を取得
  const customerTable = getTableClient('Customers');
  const customerEntity = await customerTable.getEntity('Customer', customerId);
  
  if (!customerEntity.stripeCustomerId) {
    throw new Error('Customer does not have a Stripe ID');
  }

  // Stripe顧客情報を取得
  const stripeCustomer = await stripe.customers.retrieve(customerEntity.stripeCustomerId);

  // 未払い残高を取得
  const balance = stripeCustomer.balance;

  // 次回請求予定を取得
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: customerEntity.stripeCustomerId
  }).catch(() => null);

  return {
    customerBalance: balance,
    creditBalance: stripeCustomer.credit_balance || {},
    upcomingInvoice: upcomingInvoice ? {
      amount: upcomingInvoice.amount_due,
      currency: upcomingInvoice.currency,
      periodStart: new Date(upcomingInvoice.period_start * 1000).toISOString(),
      periodEnd: new Date(upcomingInvoice.period_end * 1000).toISOString()
    } : null
  };
};

module.exports = async function (context, req) {
  context.log('Billing Info API - Processing request');

  // CORSヘッダーを設定
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: headers
    };
    return;
  }

  const customerId = req.query.customerId;
  const infoType = req.query.type || 'all'; // all, history, methods, usage, summary

  if (!customerId) {
    context.res = {
      status: 400,
      headers: headers,
      body: { error: 'customerId is required' }
    };
    return;
  }

  try {
    let response = {};

    // リクエストされた情報タイプに基づいて処理
    if (infoType === 'all' || infoType === 'history') {
      try {
        response.billingHistory = await getBillingHistory(context, customerId);
      } catch (error) {
        context.log.warn('Failed to get billing history:', error);
        response.billingHistory = { error: error.message };
      }
    }

    if (infoType === 'all' || infoType === 'methods') {
      try {
        response.paymentMethods = await getPaymentMethods(context, customerId);
      } catch (error) {
        context.log.warn('Failed to get payment methods:', error);
        response.paymentMethods = { error: error.message };
      }
    }

    if (infoType === 'all' || infoType === 'usage') {
      try {
        response.currentUsage = await getCurrentUsage(context, customerId);
      } catch (error) {
        context.log.warn('Failed to get current usage:', error);
        response.currentUsage = { error: error.message };
      }
    }

    if (infoType === 'all' || infoType === 'summary') {
      try {
        response.billingSummary = await getBillingSummary(context, customerId);
      } catch (error) {
        context.log.warn('Failed to get billing summary:', error);
        response.billingSummary = { error: error.message };
      }
    }

    context.res = {
      status: 200,
      headers: headers,
      body: {
        customerId: customerId,
        requestedType: infoType,
        data: response
      }
    };
  } catch (error) {
    context.log.error('Failed to get billing info:', error);
    context.res = {
      status: 500,
      headers: headers,
      body: { error: 'Failed to retrieve billing information', details: error.message }
    };
  }
};