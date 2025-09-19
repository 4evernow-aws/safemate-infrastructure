/**
 * SafeMate v2 - Hedera NFT Service - Test Version
 * 
 * This is a test version that handles CORS without requiring Hedera SDK
 * 
 * @version 1.0.3-test
 * @author SafeMate Development Team
 * @lastUpdated 2025-09-18
 */

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('🚀 Hedera NFT Service Test Lambda invoked');
    console.log('📋 Event:', JSON.stringify(event, null, 2));

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            console.log('✅ Handling CORS preflight request');
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        // Get the path and method
        const path = event.path || event.rawPath || '/';
        const method = event.httpMethod || event.requestContext?.http?.method || 'GET';

        console.log(`📋 Processing ${method} ${path}`);

        // Handle different endpoints
        if (path === '/folders' && method === 'GET') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    data: [],
                    message: 'Folders endpoint working - test mode'
                })
            };
        }

        if (path === '/nft/create' && method === 'POST') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: 'NFT creation endpoint working - test mode',
                    data: {
                        tokenId: 'test-token-id',
                        folderName: 'Test Folder'
                    }
                })
            };
        }

        if (path === '/balance' && method === 'GET') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    balance: '0.1',
                    message: 'Balance endpoint working - test mode'
                })
            };
        }

        if (path === '/transactions' && method === 'GET') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    data: [],
                    message: 'Transactions endpoint working - test mode'
                })
            };
        }

        // Default response
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: 'Hedera NFT Service Test - All endpoints working',
                path: path,
                method: method,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error in Lambda handler:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Internal server error'
            })
        };
    }
};
