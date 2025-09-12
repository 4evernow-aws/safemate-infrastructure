const axios = require('axios');

// Test configuration
const API_BASE_URL = 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default';
const ENDPOINT = '/onboarding/status';

// Test cases for different token formats and configurations
const testCases = [
  {
    name: 'Test 1: Standard Bearer Token',
    description: 'Test with standard Bearer token format',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
      'Accept': 'application/json'
    }
  },
  {
    name: 'Test 2: Bearer Token with Cognito Headers',
    description: 'Test with Bearer token plus Cognito-specific headers',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
      'x-cognito-id-token': 'YOUR_TOKEN_HERE', // Replace with actual token
      'Accept': 'application/json'
    }
  },
  {
    name: 'Test 3: Cognito Headers Only',
    description: 'Test with Cognito headers only (no Bearer)',
    headers: {
      'Content-Type': 'application/json',
      'x-cognito-id-token': 'YOUR_TOKEN_HERE', // Replace with actual token
      'Accept': 'application/json'
    }
  },
  {
    name: 'Test 4: No Authorization (Should Fail)',
    description: 'Test without any authorization (should return 401)',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
];

async function testEndpoint(testCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  console.log(`🔗 URL: ${API_BASE_URL}${ENDPOINT}`);
  console.log(`📋 Headers:`, JSON.stringify(testCase.headers, null, 2));
  
  try {
    const response = await axios.get(`${API_BASE_URL}${ENDPOINT}`, {
      headers: testCase.headers,
      timeout: 10000
    });
    
    console.log(`✅ Success: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    console.log(`📋 Response Headers:`, JSON.stringify(response.headers, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.status} ${error.response.statusText}`);
      console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
      console.log(`📋 Error Headers:`, JSON.stringify(error.response.headers, null, 2));
    } else {
      console.log(`❌ Network Error:`, error.message);
    }
  }
}

async function runTests() {
  console.log('🔍 API Gateway 401 Unauthorized Diagnostic Tests');
  console.log('===============================================');
  console.log(`🎯 Target: ${API_BASE_URL}${ENDPOINT}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  
  for (const testCase of testCases) {
    await testEndpoint(testCase);
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log('To use this test script:');
  console.log('1. Replace "YOUR_TOKEN_HERE" with actual ID token from browser console');
  console.log('2. Run: node tests/api/test-onboarding-401-fix.js');
  console.log('3. Compare results to identify the correct token format');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
