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

// 顧客情報をTable Storageに保存
const saveCustomerToStorage = async (customerData) => {
  const tableClient = getTableClient('Customers');
  if (!tableClient) {
    throw new Error('Table Storage is not configured');
  }

  try {
    await tableClient.createTable();
  } catch (error) {
    if (error.statusCode !== 409) { // 409 = Already Exists
      throw error;
    }
  }

  const entity = {
    partitionKey: 'Customer',
    rowKey: customerData.customerId,
    organizationName: customerData.organizationName,
    email: customerData.email,
    stripeCustomerId: customerData.stripeCustomerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: customerData.status || 'active'
  };

  return await tableClient.upsertEntity(entity);
};

// 顧客作成
const createCustomer = async (context, req) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      status: 500,
      body: { error: 'Payment service not configured' }
    };
  }

  const { organizationName, email, contactName, phone } = req.body;

  if (!organizationName || !email) {
    return {
      status: 400,
      body: { error: 'organizationName and email are required' }
    };
  }

  try {
    // Stripeで顧客を作成
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: organizationName,
      metadata: {
        organization_name: organizationName,
        contact_name: contactName || '',
        phone: phone || ''
      }
    });

    // Table Storageに保存
    const customerData = {
      customerId: `CUST_${Date.now()}`,
      organizationName,
      email,
      stripeCustomerId: stripeCustomer.id,
      contactName,
      phone
    };

    await saveCustomerToStorage(customerData);

    return {
      status: 201,
      body: {
        success: true,
        customerId: customerData.customerId,
        stripeCustomerId: stripeCustomer.id,
        message: '顧客アカウントが作成されました'
      }
    };
  } catch (error) {
    context.log.error('Failed to create customer:', error);
    return {
      status: 500,
      body: { error: 'Failed to create customer', details: error.message }
    };
  }
};

// 顧客情報取得
const getCustomer = async (context, req) => {
  const customerId = req.query.customerId;
  if (!customerId) {
    return {
      status: 400,
      body: { error: 'customerId is required' }
    };
  }

  const tableClient = getTableClient('Customers');
  if (!tableClient) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    const entity = await tableClient.getEntity('Customer', customerId);
    
    // Stripeから最新の情報を取得
    const stripe = getStripeClient();
    let stripeCustomer = null;
    if (stripe && entity.stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(entity.stripeCustomerId);
      } catch (stripeError) {
        context.log.warn('Failed to retrieve Stripe customer:', stripeError);
      }
    }

    return {
      status: 200,
      body: {
        customerId: entity.rowKey,
        organizationName: entity.organizationName,
        email: entity.email,
        stripeCustomerId: entity.stripeCustomerId,
        status: entity.status,
        createdAt: entity.createdAt,
        stripeDetails: stripeCustomer
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Customer not found' }
      };
    }
    context.log.error('Failed to get customer:', error);
    return {
      status: 500,
      body: { error: 'Failed to retrieve customer' }
    };
  }
};

// 顧客情報更新
const updateCustomer = async (context, req) => {
  const customerId = req.query.customerId;
  if (!customerId) {
    return {
      status: 400,
      body: { error: 'customerId is required' }
    };
  }

  const { organizationName, email, contactName, phone } = req.body;

  const tableClient = getTableClient('Customers');
  if (!tableClient) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    // 既存の顧客情報を取得
    const existingEntity = await tableClient.getEntity('Customer', customerId);
    
    // Stripeの顧客情報を更新
    const stripe = getStripeClient();
    if (stripe && existingEntity.stripeCustomerId) {
      await stripe.customers.update(existingEntity.stripeCustomerId, {
        email: email || existingEntity.email,
        name: organizationName || existingEntity.organizationName,
        metadata: {
          organization_name: organizationName || existingEntity.organizationName,
          contact_name: contactName || '',
          phone: phone || ''
        }
      });
    }

    // Table Storageを更新
    const updatedEntity = {
      ...existingEntity,
      organizationName: organizationName || existingEntity.organizationName,
      email: email || existingEntity.email,
      contactName: contactName || existingEntity.contactName,
      phone: phone || existingEntity.phone,
      updatedAt: new Date().toISOString()
    };

    await tableClient.updateEntity(updatedEntity);

    return {
      status: 200,
      body: {
        success: true,
        customerId: customerId,
        message: '顧客情報が更新されました'
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Customer not found' }
      };
    }
    context.log.error('Failed to update customer:', error);
    return {
      status: 500,
      body: { error: 'Failed to update customer' }
    };
  }
};

// 顧客削除（非アクティブ化）
const deleteCustomer = async (context, req) => {
  const customerId = req.query.customerId;
  if (!customerId) {
    return {
      status: 400,
      body: { error: 'customerId is required' }
    };
  }

  const tableClient = getTableClient('Customers');
  if (!tableClient) {
    return {
      status: 500,
      body: { error: 'Storage service not configured' }
    };
  }

  try {
    // 既存の顧客情報を取得
    const existingEntity = await tableClient.getEntity('Customer', customerId);
    
    // Stripeの顧客を削除（非アクティブ化）
    const stripe = getStripeClient();
    if (stripe && existingEntity.stripeCustomerId) {
      await stripe.customers.del(existingEntity.stripeCustomerId);
    }

    // Table Storageでステータスを更新
    const updatedEntity = {
      ...existingEntity,
      status: 'inactive',
      updatedAt: new Date().toISOString()
    };

    await tableClient.updateEntity(updatedEntity);

    return {
      status: 200,
      body: {
        success: true,
        customerId: customerId,
        message: '顧客アカウントが非アクティブ化されました'
      }
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        body: { error: 'Customer not found' }
      };
    }
    context.log.error('Failed to delete customer:', error);
    return {
      status: 500,
      body: { error: 'Failed to delete customer' }
    };
  }
};

module.exports = async function (context, req) {
  context.log('Customer Management API - Processing request');

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
        response = await createCustomer(context, req);
        break;
      case 'GET':
        response = await getCustomer(context, req);
        break;
      case 'PUT':
        response = await updateCustomer(context, req);
        break;
      case 'DELETE':
        response = await deleteCustomer(context, req);
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
    context.log.error('Unexpected error in customer management:', error);
    context.res = {
      status: 500,
      headers: headers,
      body: { error: 'Internal server error' }
    };
  }
};