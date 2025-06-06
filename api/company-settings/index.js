// Company Settings API - Handles company configuration storage and retrieval
// Fallback to in-memory storage until Azure Table Storage is properly configured

let inMemoryCompanySettings = null;

module.exports = async function (context, req) {
    context.log('Company Settings API function processed a request.');

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
        context.log('Processing request method:', req.method);

        if (req.method === 'GET') {
            // Retrieve company settings from in-memory storage
            if (inMemoryCompanySettings) {
                context.log('Returning in-memory company settings');
                context.res = {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: {
                        success: true,
                        data: inMemoryCompanySettings,
                        message: "Company settings retrieved successfully (in-memory)"
                    }
                };
                return;
            }

            // No data found
            context.log('No company settings found in memory');
            context.res = {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: "No company settings found"
                }
            };
            return;

        } else if (req.method === 'POST') {
            // Save company settings to in-memory storage
            context.log('Processing POST request for company settings');
            const companyInfo = req.body;
            context.log('Received company info:', JSON.stringify(companyInfo, null, 2));
            
            if (!companyInfo) {
                context.log('Error: No company information provided');
                context.res = {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: {
                        success: false,
                        message: "Company information is required"
                    }
                };
                return;
            }

            // Store in memory with timestamp
            inMemoryCompanySettings = {
                ...companyInfo,
                updatedAt: new Date().toISOString()
            };

            context.log('Company settings saved to in-memory storage');
            
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    message: "Company settings saved successfully (in-memory)"
                }
            };
        }

    } catch (error) {
        context.log.error('Error in company settings API:', error);
        context.log.error('Error stack:', error.stack);
        context.log.error('Connection string exists:', !!process.env.AzureWebJobsStorage);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message,
                stack: error.stack,
                hasConnectionString: !!process.env.AzureWebJobsStorage,
                message: "Failed to process company settings"
            }
        };
    }
};