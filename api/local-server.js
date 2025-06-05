const express = require('express');
const cors = require('cors');

// Load local settings
process.env.USE_MOCK_DATA = 'true';
process.env.AZURE_STORAGE_CONNECTION_STRING = '';

const app = express();
const port = 7071;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Azure Functions
const submitFormFunction = require('./submit-form/index');
const customersFunction = require('./customers/index');
const dashboardFunction = require('./dashboard/index');

// Helper to wrap Azure Functions for Express
const wrapAzureFunction = (fn) => {
  return async (req, res) => {
    const context = {
      log: console.log,
      bindingData: req.params,
      res: null
    };
    
    // Azure Function request format
    const azureReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    };
    
    try {
      // Execute Azure Function
      await fn(context, azureReq);
      
      // Return response
      if (context.res) {
        const response = context.res;
        
        // Set status code
        if (response.status) {
          res.status(response.status);
        }
        
        // Set headers
        if (response.headers) {
          Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
          });
        }
        
        // Send body
        res.send(response.body);
      } else {
        res.status(200).send('OK');
      }
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Routes
app.post('/api/submit-form', wrapAzureFunction(submitFormFunction));
app.get('/api/customers', wrapAzureFunction(customersFunction));
app.get('/api/customers/:id', wrapAzureFunction(customersFunction));
app.put('/api/customers/:id', wrapAzureFunction(customersFunction));
app.post('/api/customers/link', wrapAzureFunction(customersFunction));
app.get('/api/dashboard/:action', wrapAzureFunction(dashboardFunction));

// Start server
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      ChatGPT Plus LP Backend - Local Development Server        ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server is running at http://localhost:${port}                ║
║                                                                ║
║  📌 Available Endpoints:                                       ║
║                                                                ║
║  • POST   /api/submit-form        - フォーム送信              ║
║  • GET    /api/customers          - 顧客一覧取得              ║
║  • GET    /api/customers/:id      - 顧客詳細取得              ║
║  • PUT    /api/customers/:id      - 顧客情報更新              ║
║  • POST   /api/customers/link     - アカウント紐付け          ║
║  • GET    /api/dashboard/stats    - 統計情報取得              ║
║  • GET    /api/dashboard/recent   - 最近の申込み取得          ║
║                                                                ║
║  🔧 Settings:                                                  ║
║  • USE_MOCK_DATA: true (モックデータ使用中)                   ║
║  • CORSは有効になっています                                   ║
║                                                                ║
║  💡 Azure接続文字列を設定する場合:                            ║
║  1. local.settings.json を編集                                 ║
║  2. USE_MOCK_DATA を "false" に設定                           ║
║  3. AZURE_STORAGE_CONNECTION_STRING を設定                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});