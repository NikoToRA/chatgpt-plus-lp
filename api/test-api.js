// Test API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:7071';

const testFormSubmission = async () => {
  console.log('\n📝 Testing Form Submission...');
  try {
    const response = await axios.post(`${BASE_URL}/api/submit-form`, {
      organization: "テスト医療センター",
      name: "テスト太郎",
      email: "test@medical-center.jp",
      purpose: "research",
      accounts: "4-10",
      message: "研究部門でChatGPTを活用したいです"
    });
    console.log('✅ Form submitted successfully:', response.data);
  } catch (error) {
    console.error('❌ Form submission failed:', error.response?.data || error.message);
  }
};

const testGetCustomers = async () => {
  console.log('\n👥 Testing Get Customers...');
  try {
    const response = await axios.get(`${BASE_URL}/api/customers`);
    console.log(`✅ Found ${response.data.length} customers`);
    response.data.forEach(customer => {
      console.log(`   - ${customer.organization} (${customer.status})`);
    });
  } catch (error) {
    console.error('❌ Get customers failed:', error.response?.data || error.message);
  }
};

const testGetStats = async () => {
  console.log('\n📊 Testing Dashboard Stats...');
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard/stats`);
    console.log('✅ Dashboard stats:', response.data);
  } catch (error) {
    console.error('❌ Get stats failed:', error.response?.data || error.message);
  }
};

const testGetRecentApplications = async () => {
  console.log('\n🕐 Testing Recent Applications...');
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard/recent`);
    console.log(`✅ Found ${response.data.length} recent applications`);
  } catch (error) {
    console.error('❌ Get recent applications failed:', error.response?.data || error.message);
  }
};

const runAllTests = async () => {
  console.log('🧪 Starting API Tests...\n');
  console.log(`Testing server at: ${BASE_URL}`);
  
  await testFormSubmission();
  await testGetCustomers();
  await testGetStats();
  await testGetRecentApplications();
  
  console.log('\n✨ All tests completed!');
};

// Check if server is running
axios.get(`${BASE_URL}/api/customers`)
  .then(() => {
    runAllTests();
  })
  .catch(() => {
    console.error(`❌ Server not running at ${BASE_URL}`);
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  });