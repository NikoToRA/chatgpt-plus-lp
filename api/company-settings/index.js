// Company Settings API - Handles company configuration storage and retrieval
const { TableClient } = require("@azure/data-tables");

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
        const connectionString = process.env.AzureWebJobsStorage || "DefaultEndpointsProtocol=https;AccountName=koereqqstorage;AccountKey=VM2FzAPdX8d0GunlQX0SfXe17OQrNqDbc/5oAPBGoSs7TBNG4dt/2FiATk9Caibir6uSAPSUlIN2+AStPvEsYg==;EndpointSuffix=core.windows.net";
        
        context.log('Initializing TableClient with connection string present:', !!connectionString);
        const tableClient = new TableClient(connectionString, "CompanySettings");
        
        context.log('Creating table if not exists...');
        try {
            await tableClient.createTable();
            context.log('Table creation completed');
        } catch (tableError) {
            context.log('Table creation error (may already exist):', tableError.message);
        }

        if (req.method === 'GET') {
            // Retrieve company settings
            try {
                const entities = tableClient.listEntities();
                for await (const entity of entities) {
                    if (entity.partitionKey === "CompanyInfo") {
                        // Parse and return company info
                        const companyInfo = {
                            id: entity.id,
                            companyName: entity.companyName,
                            representativeName: entity.representativeName,
                            postalCode: entity.postalCode,
                            address: entity.address,
                            phoneNumber: entity.phoneNumber,
                            email: entity.email,
                            website: entity.website,
                            taxId: entity.taxId,
                            bankInfo: entity.bankInfo ? JSON.parse(entity.bankInfo) : null,
                            products: entity.products ? JSON.parse(entity.products) : [],
                            invoiceSettings: entity.invoiceSettings ? JSON.parse(entity.invoiceSettings) : null,
                            emailSettings: entity.emailSettings ? JSON.parse(entity.emailSettings) : null,
                            invoiceTemplate: entity.invoiceTemplate ? JSON.parse(entity.invoiceTemplate) : null,
                        };

                        context.res = {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: {
                                success: true,
                                data: companyInfo,
                                message: "Company settings retrieved successfully"
                            }
                        };
                        return;
                    }
                }

                // No data found
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

            } catch (error) {
                throw new Error(`Failed to retrieve company settings: ${error.message}`);
            }

        } else if (req.method === 'POST') {
            // Save company settings
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

            const entity = {
                partitionKey: "CompanyInfo",
                rowKey: companyInfo.id || "company-1",
                id: companyInfo.id || "company-1",
                companyName: companyInfo.companyName || '',
                representativeName: companyInfo.representativeName || '',
                postalCode: companyInfo.postalCode || '',
                address: companyInfo.address || '',
                phoneNumber: companyInfo.phoneNumber || '',
                email: companyInfo.email || '',
                website: companyInfo.website || '',
                taxId: companyInfo.taxId || '',
                bankInfo: JSON.stringify(companyInfo.bankInfo || {}),
                products: JSON.stringify(companyInfo.products || []),
                invoiceSettings: JSON.stringify(companyInfo.invoiceSettings || {}),
                emailSettings: JSON.stringify(companyInfo.emailSettings || {}),
                invoiceTemplate: JSON.stringify(companyInfo.invoiceTemplate || {}),
                updatedAt: new Date().toISOString()
            };

            await tableClient.upsertEntity(entity);

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    message: "Company settings saved successfully"
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