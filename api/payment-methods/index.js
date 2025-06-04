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

// 支払い方法を追加
const addPaymentMethod = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const { customerId, paymentMethodId, setAsDefault = false } = req.body;

  if (!customerId || !paymentMethodId) {
    return {
      status: 400,
      body: { error: 'customerId and paymentMethodId are required' }
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

    // 支払い方法を顧客に紐付け
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerEntity.stripeCustomerId
    });

    // デフォルトに設定する場合
    if (setAsDefault) {
      await stripe.customers.update(customerEntity.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Table Storageも更新
      customerEntity.defaultPaymentMethodId = paymentMethodId;
      customerEntity.updatedAt = new Date().toISOString();
      await customerTable.updateEntity(customerEntity);
    }

    // 支払い方法の詳細を取得
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      status: 201,
      body: {
        success: true,
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        } : null,
        isDefault: setAsDefault,
        message: '支払い方法が追加されました'
      }
    };
  } catch (error) {
    context.log.error('Failed to add payment method:', error);
    return {
      status: 500,
      body: { error: 'Failed to add payment method', details: error.message }
    };
  }
};

// 支払い方法一覧を取得
const getPaymentMethods = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const customerId = req.query.customerId;
  if (!customerId) {
    return {
      status: 400,
      body: { error: 'customerId is required' }
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

    // Stripeから支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerEntity.stripeCustomerId,
      type: 'card'
    });

    // 顧客のデフォルト支払い方法を取得
    const stripeCustomer = await stripe.customers.retrieve(customerEntity.stripeCustomerId);
    const defaultPaymentMethodId = stripeCustomer.invoice_settings?.default_payment_method;

    return {
      status: 200,
      body: {
        paymentMethods: paymentMethods.data.map(method => ({
          id: method.id,
          type: method.type,
          card: {
            brand: method.card.brand,
            last4: method.card.last4,
            expMonth: method.card.exp_month,
            expYear: method.card.exp_year
          },
          isDefault: method.id === defaultPaymentMethodId,
          created: new Date(method.created * 1000).toISOString()
        })),
        count: paymentMethods.data.length
      }
    };
  } catch (error) {
    context.log.error('Failed to get payment methods:', error);
    return {
      status: 500,
      body: { error: 'Failed to retrieve payment methods', details: error.message }
    };
  }
};

// デフォルト支払い方法を更新
const updateDefaultPaymentMethod = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const { customerId, paymentMethodId } = req.body;

  if (!customerId || !paymentMethodId) {
    return {
      status: 400,
      body: { error: 'customerId and paymentMethodId are required' }
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

    // デフォルト支払い方法を更新
    await stripe.customers.update(customerEntity.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Table Storageも更新
    customerEntity.defaultPaymentMethodId = paymentMethodId;
    customerEntity.updatedAt = new Date().toISOString();
    await customerTable.updateEntity(customerEntity);

    return {
      status: 200,
      body: {
        success: true,
        paymentMethodId: paymentMethodId,
        message: 'デフォルト支払い方法が更新されました'
      }
    };
  } catch (error) {
    context.log.error('Failed to update default payment method:', error);
    return {
      status: 500,
      body: { error: 'Failed to update default payment method', details: error.message }
    };
  }
};

// 支払い方法を削除
const deletePaymentMethod = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const paymentMethodId = req.query.paymentMethodId;
  const customerId = req.query.customerId;

  if (!paymentMethodId || !customerId) {
    return {
      status: 400,
      body: { error: 'paymentMethodId and customerId are required' }
    };
  }

  try {
    // 顧客情報を取得
    const customerTable = getTableClient('Customers');
    const customerEntity = await customerTable.getEntity('Customer', customerId);
    
    // デフォルト支払い方法の確認
    if (customerEntity.defaultPaymentMethodId === paymentMethodId) {
      return {
        status: 400,
        body: { error: 'Cannot delete default payment method. Please set another payment method as default first.' }
      };
    }

    // 支払い方法を削除（顧客から切り離し）
    await stripe.paymentMethods.detach(paymentMethodId);

    return {
      status: 200,
      body: {
        success: true,
        message: '支払い方法が削除されました'
      }
    };
  } catch (error) {
    context.log.error('Failed to delete payment method:', error);
    return {
      status: 500,
      body: { error: 'Failed to delete payment method', details: error.message }
    };
  }
};

// 銀行振込情報を取得（日本向け）
const getBankTransferInfo = async (context, req) => {
  const customerId = req.query.customerId;
  if (!customerId) {
    return {
      status: 400,
      body: { error: 'customerId is required' }
    };
  }

  // 固定の銀行振込情報を返す
  // 実際の実装では、顧客ごとに振込先口座を管理することも可能
  return {
    status: 200,
    body: {
      bankTransfer: {
        enabled: true,
        bankName: '三菱UFJ銀行',
        bankNameEn: 'MUFG Bank',
        branchName: '東京営業部',
        branchCode: '001',
        accountType: '普通',
        accountNumber: '1234567',
        accountName: 'カ）ワンダードリル',
        accountNameEn: 'Wonder Drill Inc.',
        swiftCode: 'BOTKJPJT',
        notes: [
          '振込手数料はお客様負担となります',
          '振込人名義に請求書番号を含めてください',
          '振込確認後、1-2営業日で反映されます'
        ]
      }
    }
  };
};

module.exports = async function (context, req) {
  context.log('Payment Methods API - Processing request');

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

    // 特殊なエンドポイントの処理
    if (req.method === 'GET' && req.query.type === 'bank-transfer') {
      response = await getBankTransferInfo(context, req);
    } else {
      // 通常のCRUD操作
      switch (req.method) {
        case 'POST':
          response = await addPaymentMethod(context, req);
          break;
        case 'GET':
          response = await getPaymentMethods(context, req);
          break;
        case 'PUT':
          response = await updateDefaultPaymentMethod(context, req);
          break;
        case 'DELETE':
          response = await deletePaymentMethod(context, req);
          break;
        default:
          response = {
            status: 405,
            body: { error: 'Method not allowed' }
          };
      }
    }

    context.res = {
      ...response,
      headers: {
        ...headers,
        ...response.headers
      }
    };
  } catch (error) {
    context.log.error('Unexpected error in payment methods:', error);
    context.res = {
      status: 500,
      headers: headers,
      body: { error: 'Internal server error' }
    };
  }
};