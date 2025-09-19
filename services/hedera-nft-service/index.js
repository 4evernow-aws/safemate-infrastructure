/**
 * SafeMate v2 - Hedera NFT Service
 * 
 * This Lambda function handles NFT creation on the Hedera testnet.
 * It creates real NFTs for folders using the user's private key from KMS.
 * 
 * Features:
 * - Real Hedera testnet NFT creation
 * - KMS decryption for user private keys
 * - NFT metadata storage
 * - Folder representation as NFTs
 * - CORS support for all HTTP methods
 * - Cognito User Pool authentication
 * - Lambda Layer integration for Hedera SDK
 * 
 * Environment Variables Required:
 * - WALLET_KEYS_TABLE: DynamoDB table for encrypted private keys
 * - WALLET_METADATA_TABLE: DynamoDB table for wallet metadata
 * - WALLET_KMS_KEY_ID: KMS key ID for wallet encryption
 * - HEDERA_NETWORK: Hedera network (testnet/mainnet)
 * - AWS_REGION: AWS region for services
 * 
 * API Endpoints:
 * - POST /nft/create: Create a new NFT folder
 * - GET /nft/list: List user's NFTs
 * - GET /nft/{tokenId}: Get NFT details
 * - GET /folders: List user's folders
 * - POST /folders: Create new folder
 * - GET /transactions: Get transaction history
 * - GET /balance: Get HBAR balance
 * - OPTIONS: CORS preflight support
 * 
 * @version 1.0.8
 * @author SafeMate Development Team
 * @lastUpdated 2025-09-18
 * @environment Preprod (preprod)
 * @awsRegion ap-southeast-2
 * @hederaNetwork testnet
 * @corsOrigin *
 * @supportedMethods GET,POST,PUT,DELETE,OPTIONS
 * @lambdaLayer preprod-safemate-hedera-dependencies:3
 * @corsFix Enhanced CORS headers for preflight requests
 * @hederaSDKFix Safe import with error handling for layer compatibility
 * @cleanLogging Reduced console output for cleaner browser experience
 * @endpointMapping Complete endpoint mapping for all API routes
 * @dynamoDBFix Fixed wallet lookup to use QueryCommand instead of GetCommand
 * @privateKeyFix Fixed private key lookup to use QueryCommand instead of GetCommand
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');
// Import Hedera SDK from layer
let Client, PrivateKey, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, Hbar, AccountId, TokenId, NftId;

try {
    const hederaSDK = require('@hashgraph/sdk');
    Client = hederaSDK.Client;
    PrivateKey = hederaSDK.PrivateKey;
    TokenCreateTransaction = hederaSDK.TokenCreateTransaction;
    TokenType = hederaSDK.TokenType;
    TokenSupplyType = hederaSDK.TokenSupplyType;
    TokenMintTransaction = hederaSDK.TokenMintTransaction;
    Hbar = hederaSDK.Hbar;
    AccountId = hederaSDK.AccountId;
    TokenId = hederaSDK.TokenId;
    NftId = hederaSDK.NftId;
    // Hedera SDK loaded successfully
} catch (error) {
    console.error('Failed to load Hedera SDK:', error.message);
    // Continue without Hedera SDK for CORS testing
}

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// Environment variables
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE || 'wallet-keys';
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE || 'wallet-metadata';
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
};

/**
 * Decrypt private key from KMS
 */
async function decryptPrivateKey(encryptedPrivateKey) {
    try {
        console.log('🔐 Decrypting private key from KMS...');
        
        const decryptCommand = new DecryptCommand({
            CiphertextBlob: Buffer.from(encryptedPrivateKey, 'base64'),
            KeyId: WALLET_KMS_KEY_ID
        });
        
        const decryptResponse = await kmsClient.send(decryptCommand);
        const decryptedKey = Buffer.from(decryptResponse.Plaintext).toString('utf-8');
        
        console.log('✅ Private key decrypted successfully');
        return decryptedKey;
    } catch (error) {
        console.error('❌ Failed to decrypt private key:', error);
        throw new Error('Failed to decrypt private key');
    }
}

/**
 * Get user's private key from DynamoDB and KMS
 */
async function getUserPrivateKey(userId) {
    try {
        console.log(`🔍 Getting private key for user: ${userId}`);
        
        // Get encrypted private key from DynamoDB - query by user_id to find their key
        const queryCommand = new QueryCommand({
            TableName: WALLET_KEYS_TABLE,
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            Limit: 1 // Get the first key for the user
        });
        
        const response = await docClient.send(queryCommand);
        
        if (!response.Items || response.Items.length === 0 || !response.Items[0].encryptedPrivateKey) {
            throw new Error('No private key found for user');
        }
        
        // Decrypt private key
        const privateKey = await decryptPrivateKey(response.Items[0].encryptedPrivateKey);
        
        console.log('✅ User private key retrieved successfully');
        return privateKey;
    } catch (error) {
        console.error('❌ Failed to get user private key:', error);
        throw error;
    }
}

/**
 * Create Hedera client with user's credentials
 */
function createHederaClient(accountId, privateKey) {
    try {
        console.log(`🔗 Creating Hedera client for account: ${accountId}`);
        
        const client = HEDERA_NETWORK === 'testnet' 
            ? Client.forTestnet() 
            : Client.forMainnet();
        
        client.setOperator(accountId, privateKey);
        
        console.log('✅ Hedera client created successfully');
        return client;
    } catch (error) {
        console.error('❌ Failed to create Hedera client:', error);
        throw error;
    }
}

/**
 * Create NFT folder on Hedera blockchain
 */
async function createNftFolder(client, folderName, parentFolderId, userId) {
    try {
        console.log(`🚀 Creating NFT folder: ${folderName}`);
        
        // Create metadata for the folder
        const metadata = {
            name: folderName,
            description: `SafeMate folder: ${folderName}`,
            parentFolderId: parentFolderId || null,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            folderType: 'folder',
            version: '1.0.0',
            attributes: {
                folderType: 'nft',
                blockchain: 'hedera',
                network: HEDERA_NETWORK
            }
        };

        // Convert metadata to JSON string
        const metadataJson = JSON.stringify(metadata);
        const metadataBytes = Buffer.from(metadataJson);

        console.log('📝 Creating NFT token for folder...');

        // Create the NFT token (folder)
        const tokenCreateTransaction = new TokenCreateTransaction()
            .setTokenName(folderName)
            .setTokenSymbol(folderName.substring(0, 4).toUpperCase()) // Use first 4 chars as symbol
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(1) // Only 1 NFT per folder
            .setTreasuryAccountId(client.operatorAccountId)
            .setAdminKey(client.operatorPublicKey)
            .setSupplyKey(client.operatorPublicKey)
            .setWipeKey(client.operatorPublicKey)
            .setFreezeKey(client.operatorPublicKey)
            .setPauseKey(client.operatorPublicKey)
            .setTokenMemo(`SafeMate folder: ${folderName}`)
            .setMaxTransactionFee(new Hbar(5)); // 5 HBAR max fee

        // Execute token creation
        const tokenCreateResponse = await tokenCreateTransaction.execute(client);
        const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
        const tokenId = tokenCreateReceipt.tokenId;

        if (!tokenId) {
            throw new Error('Failed to create NFT token for folder');
        }

        console.log(`✅ NFT token created: ${tokenId.toString()}`);

        // Mint the NFT with metadata
        console.log('🎨 Minting NFT with folder metadata...');
        
        const tokenMintTransaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([metadataBytes]) // Use array format
            .setMaxTransactionFee(new Hbar(2)); // 2 HBAR max fee

        const tokenMintResponse = await tokenMintTransaction.execute(client);
        const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
        const nftId = tokenMintReceipt.serials[0];

        if (!nftId) {
            throw new Error('Failed to mint NFT for folder');
        }

        console.log(`✅ NFT minted with serial: ${nftId}`);

        // Get the full NFT ID
        const fullNftId = new NftId(tokenId, nftId);

        console.log(`🎉 Folder NFT created successfully: ${fullNftId.toString()}`);

        return {
            success: true,
            tokenId: tokenId.toString(),
            nftId: fullNftId.toString(),
            transactionId: tokenCreateResponse.transactionId.toString(),
            folderName,
            network: HEDERA_NETWORK,
            metadata,
            timestamp: new Date().toISOString(),
            blockchainVerified: true
        };

    } catch (error) {
        console.error('❌ Failed to create NFT folder:', error);
        throw error;
    }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    // Reduced logging for cleaner console output
    console.log('Hedera NFT Service invoked:', event.httpMethod, event.path);

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        // Extract user information from Cognito authorizer
        const userClaims = event.requestContext?.authorizer?.claims;
        if (!userClaims) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Unauthorized - no user claims found' 
                })
            };
        }

        const userId = userClaims.sub;

        // Route based on HTTP method and path
        const httpMethod = event.httpMethod;
        const path = event.path;

        if (httpMethod === 'POST' && path === '/nft/create') {
            return await handleCreateNft(event, userId);
        } else if (httpMethod === 'GET' && path === '/nft/list') {
            return await handleListNfts(event, userId);
        } else if (httpMethod === 'GET' && path.startsWith('/nft/')) {
            return await handleGetNft(event, userId);
        } else if (httpMethod === 'GET' && path === '/folders') {
            return await handleListFolders(event, userId);
        } else if (httpMethod === 'POST' && path === '/folders') {
            return await handleCreateFolder(event, userId);
        } else if (httpMethod === 'GET' && path === '/balance') {
            return await handleGetBalance(event, userId);
        } else if (httpMethod === 'GET' && path === '/transactions') {
            return await handleGetTransactions(event, userId);
        } else {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Endpoint not found' 
                })
            };
        }

    } catch (error) {
        console.error('Lambda execution error:', error.message);
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

/**
 * Handle NFT creation
 */
async function handleCreateNft(event, userId) {
    try {
        
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { folderName, parentFolderId } = body;

        if (!folderName) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Folder name is required' 
                })
            };
        }

        // Get user's wallet information - query by user_id to find their wallet
        const queryWalletCommand = new QueryCommand({
            TableName: WALLET_METADATA_TABLE,
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            Limit: 1 // Get the first wallet for the user
        });

        const walletResponse = await docClient.send(queryWalletCommand);
        
        if (!walletResponse.Items || walletResponse.Items.length === 0) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'No wallet found for user' 
                })
            };
        }

        const wallet = walletResponse.Items[0];

        // Get user's private key
        const privateKeyString = await getUserPrivateKey(userId);
        const privateKey = PrivateKey.fromString(privateKeyString);

        // Create Hedera client
        const client = createHederaClient(wallet.accountAlias, privateKey);

        // Create NFT folder
        const result = await createNftFolder(client, folderName, parentFolderId, userId);

        // Store NFT metadata in DynamoDB
        const nftMetadata = {
            userId,
            tokenId: result.tokenId,
            nftId: result.nftId,
            folderName: result.folderName,
            parentFolderId: result.parentFolderId,
            network: result.network,
            metadata: result.metadata,
            createdAt: result.timestamp,
            blockchainVerified: result.blockchainVerified
        };

        const putNftCommand = new PutCommand({
            TableName: WALLET_METADATA_TABLE,
            Item: {
                user_id: userId,
                wallet_id: `nft#${result.tokenId}`,
                tokenId: result.tokenId,
                nftId: result.nftId,
                folderName: result.folderName,
                parentFolderId: result.parentFolderId,
                network: result.network,
                metadata: result.metadata,
                createdAt: result.timestamp,
                blockchainVerified: result.blockchainVerified
            }
        });

        await docClient.send(putNftCommand);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: result
            })
        };

    } catch (error) {
        console.error('Error creating NFT:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Failed to create NFT' 
            })
        };
    }
}

/**
 * Handle NFT listing
 */
async function handleListNfts(event, userId) {
    try {
        
        // Query user's NFTs from DynamoDB
        const queryCommand = new QueryCommand({
            TableName: WALLET_METADATA_TABLE,
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        });

        const response = await docClient.send(queryCommand);
        
        const nfts = response.Items || [];
        console.log(`📁 Found ${nfts.length} NFTs for user`);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    nfts: nfts.map(nft => ({
                        tokenId: nft.tokenId,
                        nftId: nft.nftId,
                        folderName: nft.folderName,
                        parentFolderId: nft.parentFolderId,
                        network: nft.network,
                        metadata: nft.metadata,
                        createdAt: nft.createdAt,
                        blockchainVerified: nft.blockchainVerified
                    }))
                }
            })
        };

    } catch (error) {
        console.error('❌ Error listing NFTs:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Failed to list NFTs' 
            })
        };
    }
}

/**
 * Handle getting specific NFT
 */
async function handleGetNft(event, userId) {
    try {
        console.log('🔍 Handling get NFT request');
        
        // Extract token ID from path
        const pathParts = event.path.split('/');
        const tokenId = pathParts[pathParts.length - 1];

        if (!tokenId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Token ID is required' 
                })
            };
        }

        // Get NFT from DynamoDB
        const getCommand = new GetCommand({
            TableName: WALLET_METADATA_TABLE,
            Key: {
                pk: `nft#${userId}`,
                sk: `nft#${tokenId}`
            }
        });

        const response = await docClient.send(getCommand);
        
        if (!response.Item) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'NFT not found' 
                })
            };
        }

        const nft = response.Item;
        console.log(`📁 Found NFT: ${nft.folderName}`);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: {
                    tokenId: nft.tokenId,
                    nftId: nft.nftId,
                    folderName: nft.folderName,
                    parentFolderId: nft.parentFolderId,
                    network: nft.network,
                    metadata: nft.metadata,
                    createdAt: nft.createdAt,
                    blockchainVerified: nft.blockchainVerified
                }
            })
        };

    } catch (error) {
        console.error('Error getting NFT:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Failed to get NFT' 
            })
        };
    }
}

/**
 * Handle folder listing (same as NFT listing)
 */
async function handleListFolders(event, userId) {
    return await handleListNfts(event, userId);
}

/**
 * Handle folder creation (same as NFT creation)
 */
async function handleCreateFolder(event, userId) {
    return await handleCreateNft(event, userId);
}

/**
 * Handle balance retrieval
 */
async function handleGetBalance(event, userId) {
    try {
        // Get user's wallet information
        const getWalletCommand = new GetCommand({
            TableName: WALLET_METADATA_TABLE,
            Key: { 
                user_id: userId,
                wallet_id: 'default' // Use default wallet_id for now
            }
        });

        const walletResponse = await docClient.send(getWalletCommand);
        
        if (!walletResponse.Item) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'No wallet found for user' 
                })
            };
        }

        const wallet = walletResponse.Item;

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                balance: wallet.initial_balance_hbar || '0.0',
                accountId: wallet.accountAlias,
                network: wallet.network || 'testnet'
            })
        };

    } catch (error) {
        console.error('Error getting balance:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Failed to get balance' 
            })
        };
    }
}

/**
 * Handle transaction history
 */
async function handleGetTransactions(event, userId) {
    try {
        // For now, return empty transactions array
        // In a real implementation, this would query Hedera mirror node
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: [],
                message: 'Transaction history endpoint - not yet implemented'
            })
        };

    } catch (error) {
        console.error('Error getting transactions:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                error: error.message || 'Failed to get transactions' 
            })
        };
    }
}
