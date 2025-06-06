const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VNH3n0IhjyW2mM6xOtJqCuOL8l3/iHjJP1kxvGCVLdD4O7Z4+vN6M2vuQ1GKjz4S3WP7dZjBAJJM+AStGFbhmg==;EndpointSuffix=core.windows.net";

const customerTableClient = TableClient.fromConnectionString(connectionString, "Customers");
const submissionTableClient = TableClient.fromConnectionString(connectionString, "FormSubmissions");

module.exports = async function (context, req) {
    context.log('Dashboard function processed a request.');

    const action = context.bindingData.action;

    try {
        switch (action) {
            case 'stats':
                // Calculate statistics
                let totalApplications = 0;
                let pendingApplications = 0;
                let activeAccounts = 0;
                let monthlyRevenue = 0;

                // Count form submissions
                const submissions = submissionTableClient.listEntities();
                for await (const submission of submissions) {
                    totalApplications++;
                }

                // Count customers by status
                const customers = customerTableClient.listEntities({
                    queryOptions: { filter: "PartitionKey eq 'Customer'" }
                });
                
                for await (const customer of customers) {
                    if (customer.status === 'trial') {
                        pendingApplications++;
                    } else if (customer.status === 'active') {
                        activeAccounts++;
                        // Calculate revenue based on plan
                        const planPrices = {
                            basic: 3000,
                            plus: 5000,
                            enterprise: 10000
                        };
                        monthlyRevenue += planPrices[customer.plan] || 0;
                    }
                }

                const conversionRate = totalApplications > 0 
                    ? Math.round((activeAccounts / totalApplications) * 100 * 100) / 100
                    : 0;

                context.res = {
                    body: {
                        totalApplications,
                        pendingApplications,
                        activeAccounts,
                        monthlyRevenue,
                        conversionRate
                    }
                };
                break;

            case 'recent':
                // Get recent applications (last 10)
                const recentCustomers = [];
                const recentEntities = customerTableClient.listEntities({
                    queryOptions: { 
                        filter: "PartitionKey eq 'Customer'",
                        select: ["rowKey", "email", "organization", "name", "plan", "status", "timestamp"]
                    }
                });
                
                for await (const entity of recentEntities) {
                    recentCustomers.push({
                        id: entity.rowKey,
                        email: entity.email,
                        organization: entity.organization,
                        name: entity.name,
                        plan: entity.plan || 'basic',
                        status: entity.status || 'trial',
                        createdAt: entity.timestamp
                    });
                }

                // Sort by creation date and take last 10
                recentCustomers.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                context.res = {
                    body: recentCustomers.slice(0, 10)
                };
                break;

            default:
                context.res = {
                    status: 404,
                    body: { error: "Invalid action" }
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