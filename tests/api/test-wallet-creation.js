const https = require('https');

// Test wallet creation API
async function testWalletCreation() {
  console.log('🧪 Testing Hedera wallet creation...');
  
  const testData = {
    userId: 'test-user-' + Date.now(),
    email: 'test@example.com'
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'nh9d5m1g4m.execute-api.ap-southeast-2.amazonaws.com',
    port: 443,
    path: '/default/onboarding/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 API Response Status:', res.statusCode);
        console.log('📡 API Response Headers:', res.headers);
        
        try {
          const response = JSON.parse(data);
          console.log('📡 API Response Body:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Wallet creation test successful!');
            console.log('   Account ID:', response.hedera_account_id);
            console.log('   Wallet ID:', response.wallet_id);
            console.log('   Status:', response.account_type);
          } else {
            console.log('❌ Wallet creation test failed');
            console.log('   Error:', response.error || 'Unknown error');
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', error);
          console.log('Raw response:', data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test wallet status API
async function testWalletStatus() {
  console.log('\n🧪 Testing wallet status API...');
  
  const testData = {
    userId: 'test-user-status'
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'nh9d5m1g4m.execute-api.ap-southeast-2.amazonaws.com',
    port: 443,
    path: '/default/onboarding/status',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Status API Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('📡 Status API Response Body:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ Wallet status API is working');
          } else {
            console.log('❌ Wallet status API failed');
          }
        } catch (error) {
          console.log('❌ Failed to parse status response:', error);
          console.log('Raw response:', data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Status request failed:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    await testWalletCreation();
    await testWalletStatus();
    console.log('\n🎉 Wallet integration tests completed!');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runTests();
