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

// 料金プランの定義
const PRICING_PLANS = {
  'small': {
    id: 'small',
    name: '小規模プラン（1-3アカウント）',
    monthlyPricePerAccount: 6000,
    yearlyPricePerAccount: 66000,
    minAccounts: 1,
    maxAccounts: 3
  },
  'medium': {
    id: 'medium',
    name: '中規模プラン（4-10アカウント）',
    monthlyPricePerAccount: 5500,
    yearlyPricePerAccount: 60500,
    minAccounts: 4,
    maxAccounts: 10
  },
  'large': {
    id: 'large',
    name: '大規模プラン（11アカウント以上）',
    monthlyPricePerAccount: 5000,
    yearlyPricePerAccount: 55000,
    minAccounts: 11,
    maxAccounts: null
  }
};

// プランに基づいて価格を計算
const calculatePrice = (planId, accountCount, billingCycle) => {
  const plan = PRICING_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  if (accountCount < plan.minAccounts || (plan.maxAccounts && accountCount > plan.maxAccounts)) {
    throw new Error('Account count is out of range for this plan');
  }

  const pricePerAccount = billingCycle === 'yearly' 
    ? plan.yearlyPricePerAccount 
    : plan.monthlyPricePerAccount;

  return {
    planId: plan.id,
    planName: plan.name,
    accountCount: accountCount,
    pricePerAccount: pricePerAccount,
    totalPrice: pricePerAccount * accountCount,
    billingCycle: billingCycle
  };
};

// サブスクリプション作成
const createSubscription = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const { 
    customerId, 
    planId, 
    accountCount, 
    billingCycle = 'monthly',
    paymentMethodId 
  } = req.body;

  if (!customerId || !planId || !accountCount) {
    return {
      status: 400,
      body: { error: 'customerId, planId, and accountCount are required' }
    };
  }

  try {
    // 顧客情報を取得
    const customerTable = getTableClient('Customers');
    const customerEntity = await customerTable.getEntity('Customer', customerId);
    
    if (!customerEntity.stripeCustomerId) {
      return {
        status: 400,
        body: { error: 'Customer does not have a Stripe ID' }
      };
    }

    // 価格を計算
    const pricing = calculatePrice(planId, accountCount, billingCycle);

    // Stripeで商品を作成（存在しない場合）
    const productId = `chatgpt_plus_${planId}`;
    let product;
    try {
      product = await stripe.products.retrieve(productId);
    } catch (error) {
      product = await stripe.products.create({
        id: productId,
        name: pricing.planName,
        description: `ChatGPT Plus医療機関向け${pricing.planName}`
      });
    }

    // Stripeで価格を作成
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pricing.totalPrice,
      currency: 'jpy',
      recurring: {
        interval: billingCycle === 'yearly' ? 'year' : 'month'
      }
    });

    // 支払い方法を設定
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerEntity.stripeCustomerId
      });
      await stripe.customers.update(customerEntity.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // サブスクリプションを作成
    const subscription = await stripe.subscriptions.create({
      customer: customerEntity.stripeCustomerId,
      items: [{ price: price.id }],
      metadata: {
        customerId: customerId,
        planId: planId,
        accountCount: accountCount.toString()
      }
    });

    // Table Storageに保存
    const subscriptionTable = getTableClient('Subscriptions');
    await subscriptionTable.createTable().catch(e => {});
    
    const subscriptionEntity = {
      partitionKey: 'Subscription',
      rowKey: `SUB_${Date.now()}`,
      customerId: customerId,
      stripeSubscriptionId: subscription.id,
      planId: planId,
      accountCount: accountCount,
      billingCycle: billingCycle,
      status: subscription.status,
      totalPrice: pricing.totalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await subscriptionTable.createEntity(subscriptionEntity);

    return {
      status: 201,
      body: {
        success: true,
        subscriptionId: subscriptionEntity.rowKey,
        stripeSubscriptionId: subscription.id,
        pricing: pricing,
        message: 'サブスクリプションが作成されました'
      }
    };
  } catch (error) {
    context.log.error('Failed to create subscription:', error);
    return {
      status: 500,
      body: { error: 'Failed to create subscription', details: error.message }
    };
  }
};

// サブスクリプション情報取得
const getSubscription = async (context, req) => {
  const customerId = req.query.customerId;
  const subscriptionId = req.query.subscriptionId;

  if (!customerId && !subscriptionId) {
    return {
      status: 400,
      body: { error: 'Either customerId or subscriptionId is required' }
    };
  }

  const subscriptionTable = getTableClient('Subscriptions');
  if (!subscriptionTable) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    let subscriptions = [];
    
    if (subscriptionId) {
      // 特定のサブスクリプションを取得
      const entity = await subscriptionTable.getEntity('Subscription', subscriptionId);
      
      // Stripeから最新情報を取得
      const stripe = getStripeClient();
      let stripeSubscription = null;
      if (stripe && entity.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(entity.stripeSubscriptionId);
        } catch (stripeError) {
          context.log.warn('Failed to retrieve Stripe subscription:', stripeError);
        }
      }
      
      subscriptions.push({
        subscriptionId: entity.rowKey,
        customerId: entity.customerId,
        planId: entity.planId,
        accountCount: entity.accountCount,
        billingCycle: entity.billingCycle,
        status: stripeSubscription ? stripeSubscription.status : entity.status,
        totalPrice: entity.totalPrice,
        createdAt: entity.createdAt,
        stripeDetails: stripeSubscription
      });
    } else {
      // 顧客のすべてのサブスクリプションを取得
      const query = subscriptionTable.listEntities({
        queryOptions: {
          filter: `customerId eq '${customerId}'`
        }
      });

      for await (const entity of query) {
        subscriptions.push({
          subscriptionId: entity.rowKey,
          customerId: entity.customerId,
          planId: entity.planId,
          accountCount: entity.accountCount,
          billingCycle: entity.billingCycle,
          status: entity.status,
          totalPrice: entity.totalPrice,
          createdAt: entity.createdAt
        });
      }
    }

    return {
      status: 200,
      body: {
        subscriptions: subscriptions,
        count: subscriptions.length
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Subscription not found' }
      };
    }
    context.log.error('Failed to get subscription:', error);
    return {
      status: 500,
      body: { error: 'Failed to retrieve subscription' }
    };
  }
};

// サブスクリプション更新
const updateSubscription = async (context, req) => {
  const subscriptionId = req.query.subscriptionId;
  if (!subscriptionId) {
    return {
      status: 400,
      body: { error: 'subscriptionId is required' }
    };
  }

  const { planId, accountCount, billingCycle } = req.body;

  const subscriptionTable = getTableClient('Subscriptions');
  if (!subscriptionTable) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    // 既存のサブスクリプション情報を取得
    const existingEntity = await subscriptionTable.getEntity('Subscription', subscriptionId);
    
    const stripe = getStripeClient();
    if (!stripe || !existingEntity.stripeSubscriptionId) {
      return {
        status: 500,
        body: { error: 'Cannot update subscription without Stripe' }
      };
    }

    // 新しい価格を計算
    const newPlanId = planId || existingEntity.planId;
    const newAccountCount = accountCount || existingEntity.accountCount;
    const newBillingCycle = billingCycle || existingEntity.billingCycle;
    const pricing = calculatePrice(newPlanId, newAccountCount, newBillingCycle);

    // Stripeサブスクリプションを取得
    const stripeSubscription = await stripe.subscriptions.retrieve(existingEntity.stripeSubscriptionId);

    // 新しい価格を作成
    const product = await stripe.products.retrieve(`chatgpt_plus_${newPlanId}`);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pricing.totalPrice,
      currency: 'jpy',
      recurring: {
        interval: newBillingCycle === 'yearly' ? 'year' : 'month'
      }
    });

    // サブスクリプションを更新
    const updatedSubscription = await stripe.subscriptions.update(
      existingEntity.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: price.id
        }],
        metadata: {
          customerId: existingEntity.customerId,
          planId: newPlanId,
          accountCount: newAccountCount.toString()
        }
      }
    );

    // Table Storageを更新
    const updatedEntity = {
      ...existingEntity,
      planId: newPlanId,
      accountCount: newAccountCount,
      billingCycle: newBillingCycle,
      totalPrice: pricing.totalPrice,
      status: updatedSubscription.status,
      updatedAt: new Date().toISOString()
    };

    await subscriptionTable.updateEntity(updatedEntity);

    return {
      status: 200,
      body: {
        success: true,
        subscriptionId: subscriptionId,
        pricing: pricing,
        message: 'サブスクリプションが更新されました'
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Subscription not found' }
      };
    }
    context.log.error('Failed to update subscription:', error);
    return {
      status: 500,
      body: { error: 'Failed to update subscription', details: error.message }
    };
  }
};

// サブスクリプションキャンセル
const cancelSubscription = async (context, req) => {
  const subscriptionId = req.query.subscriptionId;
  if (!subscriptionId) {
    return {
      status: 400,
      body: { error: 'subscriptionId is required' }
    };
  }

  const subscriptionTable = getTableClient('Subscriptions');
  if (!subscriptionTable) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    // 既存のサブスクリプション情報を取得
    const existingEntity = await subscriptionTable.getEntity('Subscription', subscriptionId);
    
    // Stripeでサブスクリプションをキャンセル
    const stripe = getStripeClient();
    if (stripe && existingEntity.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(existingEntity.stripeSubscriptionId);
    }

    // Table Storageでステータスを更新
    const updatedEntity = {
      ...existingEntity,
      status: 'canceled',
      updatedAt: new Date().toISOString()
    };

    await subscriptionTable.updateEntity(updatedEntity);

    return {
      status: 200,
      body: {
        success: true,
        subscriptionId: subscriptionId,
        message: 'サブスクリプションがキャンセルされました'
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Subscription not found' }
      };
    }
    context.log.error('Failed to cancel subscription:', error);
    return {
      status: 500,
      body: { error: 'Failed to cancel subscription' }
    };
  }
};

module.exports = async function (context, req) {
  context.log('Subscription Management API - Processing request');

  // CORSヘッダーを設定
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  try {
    let response;

    switch (req.method) {
      case 'POST':
        response = await createSubscription(context, req);
        break;
      case 'GET':
        response = await getSubscription(context, req);
        break;
      case 'PUT':
        response = await updateSubscription(context, req);
        break;
      case 'DELETE':
        response = await cancelSubscription(context, req);
        break;
      default:
        response = {
          status: 405,
          body: { error: 'Method not allowed' }
        };
    }

    context.res = {
      ...response,
      headers: {
        ...headers,
        ...response.headers
      }
    };
  } catch (error) {
    context.log.error('Unexpected error in subscription management:', error);
    context.res = {
      status: 500,
      headers: headers,
      body: { error: 'Internal server error' }
    };
  }
};