const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, EncryptCommand } = require('@aws-sdk/client-kms');

const dynamodbClient = new DynamoDBClient({ region: 'ap-southeast-2' });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const kms = new KMSClient({ region: 'ap-southeast-2' });

async function fixOperatorCredentials() {
  try {
    // Get credentials from environment (these should be in your .env.local)
    const accountId = '0.0.5664976';
    const privateKeyHex = '302e020100300506032b6570040220cd9f3cdba9bc497b678797d1d6532e657004220424704ff1dd854d97c396b45b14053401863009abc497b879176da6f03cdf10abc5';
    const kmsKeyId = 'arn:aws:kms:ap-southeast-2:994220462693:key/6a636600-1364-4d8c-a0f7-2993548a2b12';
    const tableName = 'default-safemate-wallet-keys';

    console.log('🔧 Fixing operator credentials...');
    console.log('Account ID:', accountId);
    console.log('Private key length:', privateKeyHex.length);

    // Convert hex string to binary
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    console.log('Binary key length:', privateKeyBytes.length);

    // Extract the actual 32-byte Ed25519 private key from DER format
    // The DER format is: 30 2e 02 01 00 30 05 06 03 2b 65 70 04 22 [32 bytes of actual key]
    // We need to extract the last 32 bytes
    const actualPrivateKeyBytes = privateKeyBytes.slice(-32);
    console.log('Actual Ed25519 key length:', actualPrivateKeyBytes.length);
    console.log('Actual key hex:', actualPrivateKeyBytes.toString('hex'));

    // Encrypt the actual private key
    console.log('🔐 Encrypting actual private key...');
    const encryptCommand = new EncryptCommand({
      KeyId: kmsKeyId,
      Plaintext: actualPrivateKeyBytes
    });

    const encryptResponse = await kms.send(encryptCommand);
    const encryptedPrivateKey = Buffer.from(encryptResponse.CiphertextBlob).toString('base64');
    console.log('✅ Private key encrypted successfully');

    // Store in DynamoDB
    console.log('💾 Storing in DynamoDB...');
    const putCommand = new PutCommand({
      TableName: tableName,
      Item: {
        user_id: 'hedera_operator',
        account_id: accountId,
        encrypted_private_key: encryptedPrivateKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        key_type: 'ed25519'
      }
    });

    await dynamodb.send(putCommand);
    console.log('✅ Operator credentials updated successfully!');
    console.log('🎉 The onboarding API should now work correctly.');

  } catch (error) {
    console.error('❌ Error fixing operator credentials:', error);
  }
}

fixOperatorCredentials(); 