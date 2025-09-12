import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Text, 
  Progress, 
  Alert, 
  Group, 
  Stack,
  Badge,
  Divider
} from '@mantine/core';
import { IconUpload, IconCheck, IconX, IconFile } from '@tabler/icons-react';
import { HederaApiService } from '../services/hederaApiService';
import { config } from '../config/environment';
import DirectHederaService from '../services/directHederaService';
import SecureCredentialStorage from '../services/secureCredentialStorage';

interface UploadResult {
  fileId: string;
  transactionId: string;
  method: 'api-gateway' | 'direct-blockchain';
  fileSize: number;
  duration: number;
}

export default function DirectBlockchainTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Check if user has stored credentials
  React.useEffect(() => {
    const checkCredentials = async () => {
      const credentials = await SecureCredentialStorage.getCredentials();
      setHasCredentials(!!credentials);
    };
    checkCredentials();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const getUploadMethod = (fileSize: number): 'direct-blockchain' => {
    return 'direct-blockchain'; // All files now use direct blockchain upload (no API Gateway)
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setUploadResult(null);

    const startTime = Date.now();
    const uploadMethod = getUploadMethod(selectedFile.size);

    try {
      console.log(`🚀 Starting upload test: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);
      console.log(`📤 Upload method: ${uploadMethod}`);

      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const uploadResult = await HederaApiService.uploadFile({
        fileName: selectedFile.name,
        fileData: fileData,
        fileSize: selectedFile.size,
        contentType: selectedFile.type,
        folderId: 'test-folder'
      }, (progress) => {
        setProgress(progress);
      });

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const duration = Date.now() - startTime;

      setUploadResult({
        fileId: uploadResult.data.fileId,
        transactionId: uploadResult.data.transactionId,
        method: uploadMethod,
        fileSize: selectedFile.size,
        duration
      });

      console.log('✅ Upload test completed successfully');
      console.log('📊 Upload result:', uploadResult.data);

    } catch (err) {
      console.error('❌ Upload test failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const testDirectConnection = async () => {
    try {
      const credentials = await SecureCredentialStorage.getCredentials();
      if (!credentials) {
        setError('No stored credentials found. Please create a wallet first.');
        return;
      }

      const directService = new DirectHederaService(
        credentials.accountId,
        credentials.privateKey,
        credentials.network
      );

      const isValid = await directService.validateConnection();
      if (isValid) {
        setError(null);
        alert('✅ Direct blockchain connection successful!');
      } else {
        setError('❌ Direct blockchain connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <div>
          <Text size="xl" fw={700} mb="xs">
            Direct Blockchain Upload Test
          </Text>
          <Text size="sm" c="dimmed">
            Test the direct blockchain upload functionality - all files are uploaded directly to the blockchain
          </Text>
        </div>

        <Divider />

        {/* File Size Limits Info */}
        <Card withBorder p="sm" bg="blue.0">
          <Text size="sm" fw={600} mb="xs">Upload Method:</Text>
          <Group gap="xs">
            <Badge color="blue" variant="light">
              All Files: Direct Blockchain Upload
            </Badge>
            <Badge color="green" variant="light">
              Max Size: {formatFileSize(config.maxFileSizeDirect)}
            </Badge>
          </Group>
        </Card>

        {/* Credentials Status */}
        <Card withBorder p="sm" bg={hasCredentials ? "green.0" : "red.0"}>
          <Group gap="xs">
            {hasCredentials ? (
              <IconCheck size={16} color="green" />
            ) : (
              <IconX size={16} color="red" />
            )}
            <Text size="sm">
              {hasCredentials ? 'Stored credentials available' : 'No stored credentials found'}
            </Text>
          </Group>
        </Card>

        {/* File Selection */}
        <div>
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              component="span"
              leftSection={<IconUpload size={16} />}
              variant="outline"
              disabled={isUploading}
            >
              Select File
            </Button>
          </label>
          
          {selectedFile && (
            <Card mt="sm" withBorder p="sm">
              <Group gap="xs">
                <IconFile size={16} />
                <div>
                  <Text size="sm" fw={500}>{selectedFile.name}</Text>
                  <Text size="xs" c="dimmed">
                    {formatFileSize(selectedFile.size)} • 
                    Upload method: {getUploadMethod(selectedFile.size)}
                  </Text>
                </div>
              </Group>
            </Card>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <Text size="sm" mb="xs">Upload Progress: {progress.toFixed(1)}%</Text>
            <Progress value={progress} size="lg" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert icon={<IconX size={16} />} title="Upload Error" color="red">
            {error}
          </Alert>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Alert icon={<IconCheck size={16} />} title="Upload Successful" color="green">
            <Stack gap="xs">
              <Text size="sm">
                <strong>File ID:</strong> {uploadResult.fileId}
              </Text>
              <Text size="sm">
                <strong>Transaction ID:</strong> {uploadResult.transactionId}
              </Text>
              <Text size="sm">
                <strong>Method:</strong> {uploadResult.method}
              </Text>
              <Text size="sm">
                <strong>Duration:</strong> {uploadResult.duration}ms
              </Text>
            </Stack>
          </Alert>
        )}

        {/* Action Buttons */}
        <Group>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            loading={isUploading}
            leftSection={<IconUpload size={16} />}
          >
            {isUploading ? 'Uploading...' : 'Test Upload'}
          </Button>
          
          <Button
            onClick={testDirectConnection}
            variant="outline"
            disabled={!hasCredentials}
          >
            Test Direct Connection
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
