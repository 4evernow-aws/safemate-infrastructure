const { CognitoIdentityProviderClient, InitiateAuthCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Cognito configuration
// Environment-specific Cognito configuration
const COGNITO_CONFIG = {
  development: {
    USER_POOL_ID: 'ap-southeast-2_uLgMRpWlw',
    CLIENT_ID: '2fg1ckjn1hga2t07lnujpk488a'
  },
  preprod: {
    USER_POOL_ID: 'ap-southeast-2_pMo5BXFiM',
    CLIENT_ID: '1a0trpjfgv54odl9csqlcbkuii'
  }
};

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const USER_POOL_ID = COGNITO_CONFIG[ENVIRONMENT]?.USER_POOL_ID || COGNITO_CONFIG.development.USER_POOL_ID;
const CLIENT_ID = '2fg1ckjn1hga2t07lnujpk488a';
const REGION = 'ap-southeast-2';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Authenticate with Cognito and get tokens
 */
async function authenticateUser(username, password) {
  try {
    console.log(`🔐 Authenticating user: ${username}`);
    
    // Try admin authentication first (for testing)
    const authParams = {
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };

    const command = new AdminInitiateAuthCommand(authParams);
    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      console.log('✅ Authentication successful!');
      console.log('📋 Token Information:');
      console.log(`   Access Token: ${response.AuthenticationResult.AccessToken.substring(0, 50)}...`);
      console.log(`   ID Token: ${response.AuthenticationResult.IdToken.substring(0, 50)}...`);
      console.log(`   Refresh Token: ${response.AuthenticationResult.RefreshToken.substring(0, 50)}...`);
      console.log(`   Expires In: ${response.AuthenticationResult.ExpiresIn} seconds`);
      
      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn
      };
    } else if (response.ChallengeName) {
      console.log(`⚠️ Challenge required: ${response.ChallengeName}`);
      return { challenge: response.ChallengeName, session: response.Session };
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.name === 'NotAuthorizedException') {
      console.log('💡 This usually means incorrect username/password');
    } else if (error.name === 'UserNotConfirmedException') {
      console.log('💡 User account is not confirmed');
    }
    throw error;
  }
}

/**
 * Test API with valid token
 */
async function testAPIWithToken(idToken) {
  try {
    console.log('\n🧪 Testing API with valid token...');
    
    const response = await fetch('https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default/folders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });

    const data = await response.json();
    console.log(`📡 API Response Status: ${response.status}`);
    console.log(`📡 API Response:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔐 SafeMate Cognito Authentication Helper');
  console.log('==========================================');
  console.log(`User Pool ID: ${USER_POOL_ID}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Region: ${REGION}`);
  console.log('');

  // For testing, you'll need to provide actual credentials
  // These are example values - replace with real credentials
  const testUsername = process.argv[2] || 'your-username';
  const testPassword = process.argv[3] || 'your-password';

  if (testUsername === 'your-username' || testPassword === 'your-password') {
    console.log('❌ Please provide username and password as arguments:');
    console.log('   node auth-helper.js <username> <password>');
    console.log('');
    console.log('💡 Example:');
    console.log('   node auth-helper.js testuser@example.com MyPassword123');
    return;
  }

  try {
    // Authenticate
    const tokens = await authenticateUser(testUsername, testPassword);
    
    if (tokens.idToken) {
      // Test API
      await testAPIWithToken(tokens.idToken);
      
      console.log('\n🎉 Success! You can now use this ID token in your frontend:');
      console.log(`Bearer ${tokens.idToken}`);
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { authenticateUser, testAPIWithToken };
