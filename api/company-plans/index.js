// Company Plans API - Returns company-configured plans for customer application form
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Company Plans API function processed a request.');

    try {
        // Try to get company plans from Azure Table Storage
        const connectionString = process.env.AzureWebJobsStorage || "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VM2FzAPdX8d0GunlQX0SfXe17OQrNqDbc/5oAPBGoSs7TBNG4dt/2FiATk9Caibir6uSAPSUlIN2+AStPvEsYg==;EndpointSuffix=core.windows.net";
        const tableClient = new TableClient(connectionString, "CompanySettings");
        
        let companyPlans = [];
        
        try {
            // Try to get company settings from Azure Table Storage
            const entities = tableClient.listEntities();
            for await (const entity of entities) {
                if (entity.partitionKey === "CompanyInfo" && entity.products) {
                    // Parse stored products and convert to plan format
                    const products = JSON.parse(entity.products);
                    companyPlans = products.map(product => ({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        unitPrice: product.unitPrice,
                        taxRate: product.taxRate / 100, // Convert percentage to decimal
                        isActive: product.isActive,
                        billingOptions: ['monthly', 'yearly'],
                        maxAccounts: 10,
                        features: [
                            'ChatGPT Plus契約代行',
                            'アカウント設定・管理',
                            '請求書一元化',
                            'サポート対応'
                        ]
                    }));
                    break;
                }
            }
        } catch (dbError) {
            context.log.warn('Could not fetch from Azure Table Storage:', dbError.message);
        }
        
        // Fallback to default plans if no data found in database
        const defaultPlans = [
            {
                id: 'prod-1',
                name: 'ChatGPT Plus 医療機関向けプラン',
                description: '医療機関専用のChatGPT Plus代行サービス（チームプラン・アカウント共有）',
                unitPrice: 20000, // Monthly price matching admin dashboard
                taxRate: 0.10,
                isActive: true,
                billingOptions: ['monthly', 'yearly'],
                maxAccounts: 10,
                features: [
                    'ChatGPT Plus契約・管理代行',
                    'チームプラン設定済み',
                    'アカウント共有対応',
                    '医療機関向けサポート',
                    '請求書一元化',
                    'セキュリティ設定代行',
                    '24時間緊急サポート'
                ]
            },
            {
                id: 'prod-2',
                name: 'ChatGPT Plus 企業向けプラン',
                description: '企業向けのChatGPT Plus代行サービス（チームプラン・アカウント共有）',
                unitPrice: 15000, // Monthly price matching admin dashboard
                taxRate: 0.10,
                isActive: true,
                billingOptions: ['monthly', 'yearly'],
                maxAccounts: 10,
                features: [
                    'ChatGPT Plus契約・管理代行',
                    'チームプラン設定済み',
                    'アカウント共有対応',
                    '企業向けサポート',
                    '請求書一元化',
                    'セキュリティ設定代行',
                    '平日サポート'
                ]
            }
        ];

        // Use Azure DB data if available, otherwise use defaults
        const plansToReturn = companyPlans.length > 0 ? companyPlans : defaultPlans;
        const dataSource = companyPlans.length > 0 ? "Azure Table Storage" : "Default configuration";
        
        context.log(`Returning plans from: ${dataSource}`);
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: {
                success: true,
                plans: plansToReturn.filter(plan => plan.isActive),
                dataSource: dataSource,
                message: `Company plans retrieved successfully from ${dataSource}`
            }
        };

    } catch (error) {
        context.log.error('Error in company plans API:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message,
                message: "Failed to retrieve company plans"
            }
        };
    }
};