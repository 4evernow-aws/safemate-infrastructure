const { LambdaClient, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const lambda = new LambdaClient({ region: 'ap-southeast-2' });

async function deploySimpleLambda() {
  console.log('🔧 Creating simple Lambda deployment with bundled dependencies...');

  try {
    // Create directory structure
    const lambdaDir = 'simple-lambda';
    
    // Clean up existing directory
    if (fs.existsSync(lambdaDir)) {
      fs.rmSync(lambdaDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(lambdaDir, { recursive: true });

    // Create package.json with AWS SDK v3 and Hedera SDK
    const packageJson = {
      "name": "safemate-simple-lambda",
      "version": "1.0.0",
      "dependencies": {
        "@aws-sdk/client-dynamodb": "^3.859.0",
        "@aws-sdk/lib-dynamodb": "^3.859.0",
        "@aws-sdk/client-kms": "^3.859.0",
        "@hashgraph/sdk": "^2.71.1"
      }
    };

    fs.writeFileSync(path.join(lambdaDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    console.log('📦 Installing AWS SDK v3 and Hedera SDK...');
    
    // Install dependencies
    execSync('npm install', { cwd: lambdaDir, stdio: 'inherit' });

    // Create the Lambda function code
    const functionCode = `const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, EncryptCommand } = require('@aws-sdk/client-kms');
const { Client, PrivateKey, AccountId, AccountCreateTransaction, Hbar } = require('./node_modules/@hashgraph/sdk');
const crypto = require('crypto');

// Initialize AWS services with SDK v3
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-southeast-2' }));
const kms = new KMSClient({ region: 'ap-southeast-2' });

// Hedera configuration
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY;

// DynamoDB table names
const WALLETS_TABLE = process.env.WALLETS_TABLE || 'safemate-wallets';
const USERS_TABLE = process.env.USERS_TABLE || 'safemate-users';

async function initializeHederaClient() {
  try {
    if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
      throw new Error('Hedera operator credentials not configured');
    }

    const operatorPrivateKey = PrivateKey.fromString(HEDERA_OPERATOR_KEY);
    const operatorAccountId = AccountId.fromString(HEDERA_OPERATOR_ID);

    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(operatorAccountId, operatorPrivateKey);

    return { client, operatorAccountId, operatorPrivateKey };
  } catch (error) {
    console.error('Error initializing Hedera client:', error);
    throw error;
  }
}

async function startOnboarding(userId, email) {
  try {
    console.log('Starting onboarding for user:', userId);

    // Check if user already has a wallet
    const existingWallet = await dynamodb.send(new GetCommand({
      TableName: WALLETS_TABLE,
      Key: { userId: userId }
    }));

    if (existingWallet.Item) {
      console.log('User already has a wallet:', existingWallet.Item.walletId);
      return {
        success: true,
        message: 'Wallet already exists',
        walletId: existingWallet.Item.walletId,
        accountId: existingWallet.Item.accountId,
        transactionId: existingWallet.Item.transactionId
      };
    }

    // Initialize Hedera client
    const { client } = await initializeHederaClient();

    // Generate new keypair
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;

    console.log('Generated new keypair for user:', userId);

    // Create Hedera account
    const transaction = new AccountCreateTransaction()
      .setKey(publicKey)
      .setInitialBalance(new Hbar(0.5))
      .setMaxAutomaticTokenAssociations(10);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;

    console.log('Created Hedera account:', accountId.toString());

    // Generate wallet ID
    const walletId = crypto.randomUUID();

    // Encrypt private key with KMS
    const encryptCommand = new EncryptCommand({
      KeyId: process.env.KMS_KEY_ID,
      Plaintext: privateKey.toString()
    });

    const encryptResult = await kms.send(encryptCommand);
    const encryptedPrivateKey = Buffer.from(encryptResult.CiphertextBlob).toString('base64');

    // Store wallet data in DynamoDB
    const walletData = {
      userId: userId,
      walletId: walletId,
      accountId: accountId.toString(),
      publicKey: publicKey.toString(),
      encryptedPrivateKey: encryptedPrivateKey,
      transactionId: response.transactionId.toString(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await dynamodb.send(new PutCommand({
      TableName: WALLETS_TABLE,
      Item: walletData
    }));

    console.log('Wallet data stored in DynamoDB');

    return {
      success: true,
      message: 'Wallet created successfully',
      walletId: walletId,
      accountId: accountId.toString(),
      transactionId: response.transactionId.toString()
    };

  } catch (error) {
    console.error('Error in startOnboarding:', error);
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
}

async function getWalletStatus(userId) {
  try {
    console.log('Getting wallet status for user:', userId);

    const result = await dynamodb.send(new GetCommand({
      TableName: WALLETS_TABLE,
      Key: { userId: userId }
    }));

    if (!result.Item) {
      return {
        success: false,
        message: 'No wallet found for user',
        hasWallet: false
      };
    }

    return {
      success: true,
      message: 'Wallet found',
      hasWallet: true,
      wallet: {
        walletId: result.Item.walletId,
        accountId: result.Item.accountId,
        status: result.Item.status,
        createdAt: result.Item.createdAt
      }
    };

  } catch (error) {
    console.error('Error getting wallet status:', error);
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
}

exports.handler = async (event) => {
  console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));

  try {
    // Extract user info from the event
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const email = event.requestContext?.authorizer?.claims?.email;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'User ID not found in request'
        })
      };
    }

    const path = event.path;
    let result;

    if (path === '/onboarding/start') {
      result = await startOnboarding(userId, email);
    } else if (path === '/onboarding/status') {
      result = await getWalletStatus(userId);
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Endpoint not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Lambda function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};`;

    // Write the function code
    fs.writeFileSync(path.join(lambdaDir, 'index.js'), functionCode);

    console.log('📦 Creating Lambda deployment package...');
    
    // Create zip file
    const zipPath = 'simple-lambda.zip';
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      console.log('✅ Lambda package created successfully!');
      console.log('📦 Zip size:', archive.pointer() + ' bytes');
      
      try {
        // Remove any existing layers first
        console.log('🔧 Removing existing layers from Lambda function...');
        const removeLayersCommand = new UpdateFunctionConfigurationCommand({
          FunctionName: 'default-safemate-user-onboarding',
          Layers: []
        });

        await lambda.send(removeLayersCommand);
        console.log('✅ Existing layers removed!');

        // Deploy the Lambda function code
        console.log('🚀 Deploying Lambda function code...');
        const functionCodeBuffer = fs.readFileSync(zipPath);
        
        const updateCodeCommand = new UpdateFunctionCodeCommand({
          FunctionName: 'default-safemate-user-onboarding',
          ZipFile: functionCodeBuffer
        });

        await lambda.send(updateCodeCommand);
        console.log('✅ Lambda function code updated successfully!');

        console.log('🎉 Simple deployment finished successfully!');
        console.log('📋 Summary:');
        console.log('- Lambda function deployed with AWS SDK v3 and Hedera SDK');
        console.log('- No layers required - using bundled AWS SDK v3');
        console.log('- Full wallet creation functionality restored');
        console.log('🔍 Test the wallet creation flow now!');

      } catch (error) {
        console.error('❌ Error during deployment:', error);
      }
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.file(path.join(lambdaDir, 'index.js'), { name: 'index.js' });
    archive.directory(path.join(lambdaDir, 'node_modules'), 'node_modules');
    archive.finalize();

  } catch (error) {
    console.error('❌ Error creating simple Lambda deployment:', error);
  }
}

// Run the simple deployment
deploySimpleLambda();

