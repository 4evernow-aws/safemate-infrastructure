const { LambdaClient, UpdateFunctionCodeCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');

const lambda = new LambdaClient({ region: 'ap-southeast-2' });

async function deployFixedLambda() {
  console.log('🔧 Deploying fixed Lambda function with AWS SDK v2...');
  
  try {
    // Read the fixed Lambda function code
    const functionCode = fs.readFileSync('services/user-onboarding/index-v2.js', 'utf8');
    
    // Create a zip file with the function code
    const archiver = require('archiver');
    const output = fs.createWriteStream('fixed-lambda.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', async () => {
      console.log('✅ Lambda zip created successfully!');
      
      // Read the zip file
      const zipBuffer = fs.readFileSync('fixed-lambda.zip');
      
      // Update the Lambda function
      const command = new UpdateFunctionCodeCommand({
        FunctionName: 'default-safemate-user-onboarding',
        ZipFile: zipBuffer
      });
      
      const response = await lambda.send(command);
      console.log('✅ Lambda function updated successfully!');
      console.log('Response:', response);
      
      // Cleanup
      fs.unlinkSync('fixed-lambda.zip');
      
      console.log('🎉 Fixed Lambda function deployed successfully!');
      console.log('The function now uses AWS SDK v2 and should work without the layer dependency issues.');
    });
    
    archive.pipe(output);
    archive.append(functionCode, { name: 'index.js' });
    archive.finalize();
    
  } catch (error) {
    console.error('❌ Error deploying Lambda function:', error);
  }
}

deployFixedLambda();
