// Azure Table Storage から顧客データを取得するAPI
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Customers API called');

    // CORS設定
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
    };

    // OPTIONSリクエスト（CORS preflight）の処理
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders
        };
        return;
    }

    try {
        // Azure Table Storage から顧客データを取得（Azure Static Web Apps対応）
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
            process.env.STORAGE_CONNECTION_STRING || 
            "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

        const customerTableClient = new TableClient(connectionString, "Customers");
        
        const customers = [];
        
        try {
            context.log('Attempting to read from Customers table...');
            
            // CustomersテーブルからすべてのデータToAcquisition
            const entities = customerTableClient.listEntities({
                queryOptions: { filter: "PartitionKey eq 'Customer'" }
            });
            
            context.log('Successfully created listEntities query');
            let entityCount = 0;
            
            for await (const entity of entities) {
                entityCount++;
                context.log(`Processing entity ${entityCount}:`, {
                    id: entity.id || entity.rowKey,
                    email: entity.email,
                    organization: entity.organization,
                    isNewApplication: entity.isNewApplication,
                    timestamp: entity.timestamp
                });
                const customer = {
                    id: entity.id || entity.rowKey,
                    email: entity.email,
                    organization: entity.organization,
                    name: entity.name,
                    phoneNumber: entity.phoneNumber || '',
                    postalCode: entity.postalCode || '',
                    address: entity.address || '',
                    facilityType: entity.facilityType || '',
                    plan: entity.plan || 'plus',
                    accountCount: entity.accountCount || entity.requestedAccountCount || 1,
                    requestedAccountCount: entity.requestedAccountCount || 1,
                    paymentMethod: entity.paymentMethod || 'card',
                    status: entity.status || 'trial',
                    
                    // タイムスタンプ
                    registeredAt: entity.registeredAt || entity.createdAt || entity.timestamp,
                    createdAt: entity.createdAt || entity.timestamp,
                    submittedAt: entity.submittedAt || entity.createdAt,
                    
                    // 申し込み関連
                    applicationId: entity.applicationId || '',
                    isNewApplication: entity.isNewApplication || false,
                    
                    // ChatGPTアカウント
                    chatGptAccounts: entity.chatGptAccounts ? JSON.parse(entity.chatGptAccounts) : [],
                    
                    // 追加フィールド
                    billingCycle: entity.billingCycle || 'monthly',
                    startDate: entity.startDate || '',
                    department: entity.department || '',
                    contactPhone: entity.contactPhone || '',
                    prefecture: entity.prefecture || '',
                    city: entity.city || '',
                    expiresAt: entity.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                    subscriptionMonths: entity.subscriptionMonths || 1,
                    lastActivityAt: entity.lastActivityAt || entity.createdAt || entity.timestamp,
                    stripeCustomerId: entity.stripeCustomerId || null,
                    productId: entity.productId || ''
                };
                
                customers.push(customer);
            }
            
            context.log(`Successfully processed ${entityCount} entities`);
            context.log(`Retrieved ${customers.length} customers from Azure Table Storage`);
            context.log('Sample customer data:', customers.slice(0, 2));
            
        } catch (tableError) {
            context.log('Could not read from Azure Table Storage:', tableError.message);
            
            // Azure Table Storageから取得できない場合、ダミーデータを返す
            const dummyCustomer = {
                id: 'customer-1',
                email: 'test@hospital.com',
                organization: 'テスト総合病院',
                name: 'テスト太郎',
                phoneNumber: '03-1234-5678',
                postalCode: '100-0001',
                address: '東京都千代田区丸の内1-1-1',
                facilityType: 'hospital',
                plan: 'plus',
                accountCount: 4,
                requestedAccountCount: 4,
                paymentMethod: 'card',
                status: 'active',
                registeredAt: new Date('2024-01-01').toISOString(),
                createdAt: new Date('2024-01-01').toISOString(),
                chatGptAccounts: [{
                    id: 'gpt-1',
                    email: 'test1@chatgpt.com',
                    isActive: true,
                    createdAt: new Date('2024-01-01')
                }],
                isNewApplication: false,
                applicationId: '',
                billingCycle: 'monthly',
                startDate: '',
                department: '',
                contactPhone: '',
                prefecture: '東京都',
                city: '千代田区',
                expiresAt: new Date('2025-01-01').toISOString(),
                subscriptionMonths: 12,
                lastActivityAt: new Date().toISOString(),
                stripeCustomerId: null,
                productId: ''
            };
            
            customers.push(dummyCustomer);
            context.log('Using dummy data due to table storage error');
        }

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: customers
        };

    } catch (error) {
        context.log.error('Error fetching customers:', error);
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: error.message,
                message: "顧客データの取得に失敗しました"
            }
        };
    }
};