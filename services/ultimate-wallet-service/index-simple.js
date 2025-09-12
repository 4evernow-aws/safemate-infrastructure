/**
 * Simplified Ultimate Wallet Service for Testing
 */

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

// Main Lambda handler
exports.handler = async (event) => {
  console.log('🔧 Simplified UltimateWalletService invoked with event:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight - ALWAYS return CORS headers for OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔧 Handling CORS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Extract user information from Cognito claims
    const userClaims = event.requestContext?.authorizer?.claims || {};
    const userId = userClaims.sub || userClaims['cognito:username'] || 'default-user';
    const email = userClaims.email || userClaims['cognito:email'] || 'default@example.com';
    
    console.log('🔧 User claims:', userClaims);
    console.log('🔧 Extracted userId:', userId);
    console.log('🔧 Extracted email:', email);
    
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('🔧 Processing request:', httpMethod, path);
    
    // Simple response for testing
    if (path === '/onboarding/start' && httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Simplified wallet creation endpoint working',
          userId: userId,
          email: email
        })
      };
    }
    else if (path === '/onboarding/status' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          status: 'ready',
          userId: userId
        })
      };
    }
    else if (path === '/onboarding/retry' && httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Simplified retry endpoint working',
          userId: userId
        })
      };
    }
    else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Endpoint not found',
          path: path,
          method: httpMethod
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Lambda function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};
