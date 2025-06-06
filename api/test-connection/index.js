// Test Connection API - Simple diagnostics for Azure Storage connection
module.exports = async function (context, req) {
    context.log('Test Connection API function processed a request.');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const connectionString = process.env.AzureWebJobsStorage;
        const hasConnectionString = !!connectionString;
        const isDefaultConnection = connectionString && connectionString.includes('UseDevelopmentStorage=true');
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                diagnostics: {
                    hasConnectionString,
                    isDefaultConnection,
                    connectionStringLength: connectionString ? connectionString.length : 0,
                    startsWithDefault: connectionString ? connectionString.startsWith('DefaultEndpointsProtocol') : false,
                    environment: process.env.NODE_ENV || 'unknown',
                    timestamp: new Date().toISOString()
                },
                message: "Connection test completed"
            }
        };

    } catch (error) {
        context.log.error('Error in test connection:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message,
                message: "Test connection failed"
            }
        };
    }
};