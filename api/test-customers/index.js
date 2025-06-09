const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

const tableClient = TableClient.fromConnectionString(connectionString, "Customers");

module.exports = async function (context, req) {
    context.log('Test customers function processed a request.');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
            }
        };
        return;
    }

    try {
        if (req.method === 'POST') {
            // テストデータを作成
            const testCustomer = {
                partitionKey: "Customer",
                rowKey: `test_${Date.now()}`,
                id: `test_${Date.now()}`,
                email: "test@example.com",
                organization: "テスト医療機関",
                name: "テスト太郎",
                phoneNumber: "03-1234-5678",
                postalCode: "100-0001",
                address: "東京都千代田区千代田1-1",
                facilityType: "clinic",
                plan: "plus",
                accountCount: 3,
                status: "active",
                paymentMethod: "invoice",
                createdAt: new Date().toISOString(),
                registeredAt: new Date().toISOString(),
                lastActivityAt: new Date().toISOString(),
                termsAccepted: true,
                privacyAccepted: true
            };

            await tableClient.createEntity(testCustomer);
            
            context.res = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: { 
                    success: true, 
                    message: "Test customer created",
                    customer: testCustomer 
                }
            };
        } else {
            // テーブル情報を取得
            const customers = [];
            const entities = tableClient.listEntities();
            
            for await (const entity of entities) {
                customers.push({
                    partitionKey: entity.partitionKey,
                    rowKey: entity.rowKey,
                    id: entity.id,
                    organization: entity.organization,
                    email: entity.email,
                    createdAt: entity.createdAt
                });
            }

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    count: customers.length,
                    customers: customers,
                    connectionString: connectionString ? connectionString.substring(0, 50) + '...' : 'NOT SET'
                }
            };
        }
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { 
                error: error.message,
                stack: error.stack 
            }
        };
    }
};