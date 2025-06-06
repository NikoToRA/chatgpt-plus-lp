const { TableClient, TableEntity } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

const tableClient = TableClient.fromConnectionString(connectionString, "Customers");

module.exports = async function (context, req) {
    context.log('Customers function processed a request.');

    const method = req.method;
    const id = context.bindingData.id;

    try {
        switch (method) {
            case 'GET':
                if (id) {
                    // Get single customer
                    try {
                        const entity = await tableClient.getEntity("Customer", id);
                        const customer = {
                            id: entity.rowKey,
                            email: entity.email,
                            organization: entity.organization,
                            name: entity.name,
                            chatGptEmail: entity.chatGptEmail || null,
                            status: entity.status || 'trial',
                            plan: entity.plan || 'basic',
                            paymentMethod: entity.paymentMethod || 'card',
                            stripeCustomerId: entity.stripeCustomerId || null,
                            createdAt: entity.timestamp,
                            lastActivityAt: entity.lastActivityAt || entity.timestamp
                        };
                        context.res = {
                            body: customer
                        };
                    } catch (error) {
                        context.res = {
                            status: 404,
                            body: { error: "Customer not found" }
                        };
                    }
                } else {
                    // Get all customers
                    const customers = [];
                    const entities = tableClient.listEntities({
                        queryOptions: { filter: "PartitionKey eq 'Customer'" }
                    });
                    
                    for await (const entity of entities) {
                        customers.push({
                            id: entity.rowKey,
                            email: entity.email,
                            organization: entity.organization,
                            name: entity.name,
                            chatGptEmail: entity.chatGptEmail || null,
                            status: entity.status || 'trial',
                            plan: entity.plan || 'basic',
                            paymentMethod: entity.paymentMethod || 'card',
                            stripeCustomerId: entity.stripeCustomerId || null,
                            createdAt: entity.timestamp,
                            lastActivityAt: entity.lastActivityAt || entity.timestamp
                        });
                    }
                    
                    context.res = {
                        body: customers
                    };
                }
                break;

            case 'PUT':
                if (!id) {
                    context.res = {
                        status: 400,
                        body: { error: "Customer ID is required for update" }
                    };
                    return;
                }

                const updateData = req.body;
                try {
                    const existingEntity = await tableClient.getEntity("Customer", id);
                    
                    const updatedEntity = {
                        partitionKey: "Customer",
                        rowKey: id,
                        ...existingEntity,
                        ...updateData,
                        lastActivityAt: new Date().toISOString()
                    };

                    await tableClient.updateEntity(updatedEntity, "Merge");
                    
                    context.res = {
                        body: {
                            id: id,
                            ...updateData,
                            lastActivityAt: updatedEntity.lastActivityAt
                        }
                    };
                } catch (error) {
                    context.res = {
                        status: 404,
                        body: { error: "Customer not found" }
                    };
                }
                break;

            case 'POST':
                if (req.url.includes('/link')) {
                    // Account linking endpoint
                    const { customerId, chatGptEmail, linkedBy } = req.body;
                    
                    try {
                        const customerEntity = await tableClient.getEntity("Customer", customerId);
                        customerEntity.chatGptEmail = chatGptEmail;
                        customerEntity.linkedAt = new Date().toISOString();
                        customerEntity.linkedBy = linkedBy;
                        
                        await tableClient.updateEntity(customerEntity, "Merge");
                        
                        // Create account mapping record
                        const mappingEntity = {
                            partitionKey: "AccountMapping",
                            rowKey: customerId,
                            chatGptEmail: chatGptEmail,
                            chatGptAccountId: `cgpt_${Date.now()}`, // Placeholder
                            linkedAt: new Date().toISOString(),
                            linkedBy: linkedBy
                        };
                        
                        await tableClient.createEntity(mappingEntity);
                        
                        context.res = {
                            body: { success: true }
                        };
                    } catch (error) {
                        context.res = {
                            status: 500,
                            body: { error: "Failed to link account" }
                        };
                    }
                } else {
                    context.res = {
                        status: 400,
                        body: { error: "Invalid endpoint" }
                    };
                }
                break;

            default:
                context.res = {
                    status: 405,
                    body: { error: "Method not allowed" }
                };
        }
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: { error: "Internal server error" }
        };
    }
};