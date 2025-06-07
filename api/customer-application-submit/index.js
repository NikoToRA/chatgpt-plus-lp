// Customer Application Submit API - Handles customer application form submissions
const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('Customer Application Submit API function processed a request.');

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
        const submissionData = req.body;
        
        // Validate required fields
        if (!submissionData || !submissionData.serviceSelection || !submissionData.basicInformation) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: "Missing required fields in submission data"
                }
            };
            return;
        }

        // Generate application ID
        const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        
        // Initialize Azure Table Storage client
        const connectionString = process.env.AzureWebJobsStorage || "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VM2FzAPdX8d0GunlQX0SfXe17OQrNqDbc/5oAPBGoSs7TBNG4dt/2FiATk9Caibir6uSAPSUlIN2+AStPvEsYg==;EndpointSuffix=core.windows.net";
        
        // Store in CustomerApplications table
        const tableClient = new TableClient(connectionString, "CustomerApplications");
        await tableClient.createTable();

        const entity = {
            partitionKey: "CustomerApplication",
            rowKey: applicationId,
            applicationId: applicationId,
            
            // Service Selection
            planId: submissionData.serviceSelection.planId,
            requestedAccountCount: submissionData.serviceSelection.requestedAccountCount,
            billingCycle: submissionData.serviceSelection.billingCycle,
            startDate: submissionData.serviceSelection.startDate,
            
            // Basic Information
            organizationName: submissionData.basicInformation.organizationName,
            facilityType: submissionData.basicInformation.facilityType,
            postalCode: submissionData.basicInformation.postalCode,
            prefecture: submissionData.basicInformation.prefecture,
            city: submissionData.basicInformation.city,
            address: submissionData.basicInformation.address,
            phoneNumber: submissionData.basicInformation.phoneNumber,
            contactPerson: submissionData.basicInformation.contactPerson,
            department: submissionData.basicInformation.department || '',
            email: submissionData.basicInformation.email,
            contactPhone: submissionData.basicInformation.contactPhone || '',
            
            // Payment Information
            paymentMethod: submissionData.paymentInformation.paymentMethod,
            cardHolderName: submissionData.paymentInformation.cardHolderName || '',
            billingContact: submissionData.paymentInformation.billingContact || '',
            billingEmail: submissionData.paymentInformation.billingEmail || '',
            termsAccepted: submissionData.paymentInformation.termsAccepted,
            privacyAccepted: submissionData.paymentInformation.privacyAccepted,
            
            // Metadata
            submittedAt: new Date().toISOString(),
            status: 'pending_review',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await tableClient.createEntity(entity);
        
        // Also store a simplified entry in the Customers table for admin dashboard compatibility
        const customerTableClient = new TableClient(connectionString, "Customers");
        await customerTableClient.createTable();
        
        const customerEntity = {
            partitionKey: "Customer",
            rowKey: `customer-${Date.now()}`,
            // 管理画面のAPIが期待するフィールド名に合わせる
            email: submissionData.basicInformation.email,
            organization: submissionData.basicInformation.organizationName,
            name: submissionData.basicInformation.contactPerson,
            chatGptEmail: null, // 後でアカウント連携時に設定
            status: 'trial',
            plan: submissionData.serviceSelection.planId === 'prod-1' ? 'plus' : 'enterprise',
            paymentMethod: submissionData.paymentInformation.paymentMethod,
            stripeCustomerId: null, // 後で決済時に設定
            timestamp: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            // 追加のメタデータ
            phoneNumber: submissionData.basicInformation.phoneNumber,
            address: `${submissionData.basicInformation.prefecture} ${submissionData.basicInformation.city} ${submissionData.basicInformation.address}`,
            accountCount: submissionData.serviceSelection.requestedAccountCount,
            billingCycle: submissionData.serviceSelection.billingCycle,
            applicationId: applicationId
        };

        await customerTableClient.createEntity(customerEntity);

        context.log(`Successfully stored customer application: ${applicationId}`);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                applicationId: applicationId,
                message: "Customer application submitted successfully",
                data: {
                    applicationId: applicationId,
                    status: 'pending_review',
                    estimatedProcessingTime: submissionData.paymentInformation.paymentMethod === 'card' ? '当日中' : '1-3営業日'
                }
            }
        };

    } catch (error) {
        context.log.error('Error processing customer application:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message,
                message: "Failed to process customer application"
            }
        };
    }
};