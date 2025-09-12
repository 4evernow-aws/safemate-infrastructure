import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material';
import { 
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import type { WidgetProps } from '../../dashboard/core/DashboardProvider';
import BaseWidget from '../shared/BaseWidget';
import { createWidget, WidgetRegistry } from '../../dashboard/core/WidgetRegistry';
import HederaApiService from '../../services/hederaApiService';

interface Folder {
  id: string;
  name: string;
  files: File[];
  hederaFileId: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
}

interface File {
  id: string;
  name: string;
  size: number;
  version: string;
  contentType: string;
  createdAt: string;
  tokenId: string;
}

const FileManagementTestWidget: React.FC<WidgetProps> = ({ widgetId, accountType, onAction }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [uploadFileDialog, setUploadFileDialog] = useState(false);
  const [updateFileDialog, setUpdateFileDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form states
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileVersion, setFileVersion] = useState('1.0');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await HederaApiService.listFolders();
      if (response.success && response.data) {
        // Transform the API response to match the Folder interface
        const transformedFolders: Folder[] = response.data.map((folder: any) => ({
          id: folder.tokenId,
          name: folder.folderName,
          files: [],
          hederaFileId: folder.tokenId,
          createdAt: folder.createdAt,
          updatedAt: folder.createdAt,
          fileCount: 0
        }));
        setFolders(transformedFolders);
        setSuccess(`Loaded ${transformedFolders.length} folders`);
      } else {
        setError(response.error || 'Failed to load folders');
      }
    } catch (err) {
      setError('Failed to load folders');
      console.error('Error loading folders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await HederaApiService.createFolder(folderName.trim());
      if (response.success && response.data) {
        setSuccess(`Folder "${folderName}" created successfully! Transaction: ${response.data.transactionId}`);
        setFolderName('');
        setCreateFolderDialog(false);
        await loadFolders(); // Refresh the list
      } else {
        setError(response.error || 'Failed to create folder');
      }
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!fileName.trim() || !fileContent.trim() || !selectedFolder) {
      setError('File name, content, and folder are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Convert text content to base64
      const base64Content = btoa(fileContent);
      
      const response = await HederaApiService.uploadFile({
        fileName: fileName.trim(),
        fileData: base64Content,
        fileSize: fileContent.length,
        contentType: 'text/plain',
        folderId: selectedFolder,
        version: fileVersion
      }, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success && response.data) {
        setSuccess(`File "${fileName}" uploaded successfully! Version: ${response.data.version}, Transaction: ${response.data.transactionId}`);
        setFileName('');
        setFileContent('');
        setFileVersion('1.0');
        setSelectedFolder('');
        setUploadFileDialog(false);
        await loadFolders(); // Refresh the list
      } else {
        setError(response.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateFile = async () => {
    if (!selectedFile || !fileContent.trim()) {
      setError('File and new content are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Convert text content to base64
      const base64Content = btoa(fileContent);
      
      const response = await HederaApiService.updateFile(selectedFile.tokenId, {
        fileData: base64Content,
        version: fileVersion,
        fileName: fileName.trim() || selectedFile.name
      });

      if (response.success && response.data) {
        setSuccess(`File updated successfully! New version: ${response.data.version}, Transaction: ${response.data.transactionId}`);
        setFileName('');
        setFileContent('');
        setFileVersion('1.0');
        setSelectedFile(null);
        setUpdateFileDialog(false);
        await loadFolders(); // Refresh the list
      } else {
        setError(response.error || 'Failed to update file');
      }
    } catch (err) {
      setError('Failed to update file');
      console.error('Error updating file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await HederaApiService.deleteFolder(folderId);
      if (response.success) {
        setSuccess('Folder deleted successfully!');
        await loadFolders(); // Refresh the list
      } else {
        setError(response.error || 'Failed to delete folder');
      }
    } catch (err) {
      setError('Failed to delete folder');
      console.error('Error deleting folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateDialog = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setFileContent(''); // User will enter new content
    setFileVersion((parseFloat(file.version) + 0.1).toFixed(1)); // Increment version
    setUpdateFileDialog(true);
  };

  const renderFolders = () => {
    if (folders.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Folders Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first folder to get started
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setCreateFolderDialog(true)}
            size="small"
          >
            Create Folder
          </Button>
        </Box>
      );
    }

    return (
      <List>
        {folders.map((folder) => (
          <Card key={folder.id} sx={{ mb: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{folder.name}</Typography>
                  <Chip 
                    label={`${folder.fileCount} files`} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setUploadFileDialog(true);
                    }}
                    title="Upload file to this folder"
                  >
                    <UploadIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteFolder(folder.id)}
                    title="Delete folder"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary" display="block">
                Created: {new Date(folder.createdAt).toLocaleString()}
              </Typography>
              
              {folder.files && folder.files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Files:
                  </Typography>
                  <List dense>
                    {folder.files.map((file) => (
                      <ListItem key={file.id} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <FileIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`v${file.version} • ${file.size} bytes • ${new Date(file.createdAt).toLocaleDateString()}`}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => openUpdateDialog(file)}
                          title="Update file"
                        >
                          <EditIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </List>
    );
  };

  return (
    <BaseWidget
      widgetId={widgetId}
      accountType={accountType}
      title="File Management Test"
      subtitle="Test folder creation, file upload, and versioning"
      loading={isLoading}
      error={error}
      onRefresh={loadFolders}
    >
      <Box>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setCreateFolderDialog(true)}
            size="small"
          >
            Create Folder
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadFolders}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary">
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {renderFolders()}

        {/* Create Folder Dialog */}
        <Dialog open={createFolderDialog} onClose={() => setCreateFolderDialog(false)}>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              fullWidth
              variant="outlined"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>

        {/* Upload File Dialog */}
        <Dialog open={uploadFileDialog} onClose={() => setUploadFileDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="File Name"
              fullWidth
              variant="outlined"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name..."
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Folder</InputLabel>
              <Select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                label="Folder"
              >
                {folders.map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Version"
              fullWidth
              variant="outlined"
              value={fileVersion}
              onChange={(e) => setFileVersion(e.target.value)}
              placeholder="1.0"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="File Content"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Enter file content..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadFileDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadFile} variant="contained">Upload</Button>
          </DialogActions>
        </Dialog>

        {/* Update File Dialog */}
        <Dialog open={updateFileDialog} onClose={() => setUpdateFileDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Update File</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="File Name (optional)"
              fullWidth
              variant="outlined"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter new file name or leave unchanged..."
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="New Version"
              fullWidth
              variant="outlined"
              value={fileVersion}
              onChange={(e) => setFileVersion(e.target.value)}
              placeholder="1.1"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="New File Content"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Enter new file content..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateFileDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateFile} variant="contained">Update</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BaseWidget>
  );
};

export const FileManagementTestWidgetDefinition = createWidget({
  id: 'file-management-test',
  name: 'File Management Test',
  component: FileManagementTestWidget,
  category: 'files',
  permissions: ['personal', 'family', 'business', 'community', 'sporting', 'cultural'],
  gridSize: { cols: 12, rows: 12 },
  priority: 10,
});

WidgetRegistry.register(FileManagementTestWidgetDefinition);

export default FileManagementTestWidget;
