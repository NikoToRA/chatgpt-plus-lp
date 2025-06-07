// Test API endpoint to verify Azure Functions is working
module.exports = async function (context, req) {
    context.log('Test API function processed a request.');

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

    const responseMessage = {
        success: true,
        message: "Azure Functions API is working!",
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        environment: {
            hasAzureWebJobsStorage: !!process.env.AzureWebJobsStorage,
            hasAzureStorageConnectionString: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
            nodeVersion: process.version
        }
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: responseMessage
    };
};