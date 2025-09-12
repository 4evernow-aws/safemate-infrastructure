import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  CreateNewFolder as CreateFolderIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Storage as StorageIcon,
  AccountBalance as BlockchainIcon
} from '@mui/icons-material';
import EnhancedFileService, {
  type FolderInfo,
  type FileInfo,
  type CreateFolderRequest,
  type CreateFileRequest
} from '../../services/enhancedFileService';
import { useTheme } from '@mui/material/styles';

interface FileManagerProps {
  onFileSelect?: (file: FileInfo) => void;
  onFolderSelect?: (folder: FolderInfo) => void;
}

interface CurrentPath {
  id: string;
  name: string;
  type: 'root' | 'folder';
}

const FileManager: React.FC<FileManagerProps> = ({ onFileSelect, onFolderSelect }) => {
  const theme = useTheme();
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<CurrentPath[]>([{ id: 'root', name: 'Home', type: 'root' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: FolderInfo | FileInfo | null;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    loadFolders();
  }, []);

  // Load folders and files when current folder changes
  useEffect(() => {
    if (currentFolder) {
      loadFilesInFolder(currentFolder);
    } else {
      setFiles([]);
    }
  }, [currentFolder]);

  const loadFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await EnhancedFileService.listFolders();
      if (result.success && result.folders) {
        setFolders(result.folders);
      } else {
        setError(result.error || 'Failed to load folders');
      }
    } catch (err) {
      setError('Failed to load folders');
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilesInFolder = async (folderTokenId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await EnhancedFileService.listFilesInFolder(folderTokenId);
      if (result.success && result.files) {
        setFiles(result.files);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateFolderRequest = {
        name: newFolderName.trim(),
        parentFolderId: currentFolder || undefined,
        metadata: {
          createdBy: 'file-manager',
          description: `Folder created via SafeMate File Manager`
        }
      };

      const result = await EnhancedFileService.createFolder(request);
      
      if (result.success) {
        setSuccess(`Folder "${newFolderName}" created successfully!`);
        setCreateFolderDialog(false);
        setNewFolderName('');
        loadFolders();
        if (currentFolder) {
          loadFilesInFolder(currentFolder);
        }
      } else {
        setError(result.error || 'Failed to create folder');
      }
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!currentFolder) {
      setError('Please select a folder to upload to');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await EnhancedFileService.uploadFile(selectedFile, currentFolder, {
        uploadedBy: 'file-manager',
        uploadMethod: 'drag-drop'
      });

      if (result.success) {
        setSuccess(`File "${selectedFile.name}" uploaded successfully!`);
        setUploadDialog(false);
        setSelectedFile(null);
        loadFilesInFolder(currentFolder);
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFolderClick = (folder: FolderInfo) => {
    setCurrentFolder(folder.tokenId);
    setCurrentPath([
      ...currentPath,
      { id: folder.tokenId, name: folder.folderName, type: 'folder' as const }
    ]);
    onFolderSelect?.(folder);
  };

  const handleFileClick = (file: FileInfo) => {
    onFileSelect?.(file);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      // Go to root
      setCurrentFolder(null);
      setCurrentPath([{ id: 'root', name: 'Home', type: 'root' }]);
    } else {
      // Go to specific folder
      const targetPath = currentPath.slice(0, index + 1);
      const targetFolder = targetPath[targetPath.length - 1];
      setCurrentFolder(targetFolder.id);
      setCurrentPath(targetPath);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item: FolderInfo | FileInfo) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      item
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      await EnhancedFileService.downloadFile(file.tokenId, file.fileName);
      setSuccess(`File "${file.fileName}" downloaded successfully!`);
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    }
  };

  const handleVerifyIntegrity = async (item: FolderInfo | FileInfo) => {
    try {
      const result = await EnhancedFileService.verifyMetadataIntegrity(item.tokenId);
      if (result.success) {
        if (result.integrityValid) {
          setSuccess('Metadata integrity verified successfully!');
        } else {
          setError('Metadata integrity check failed - blockchain and database metadata do not match');
        }
      } else {
        setError(result.error || 'Failed to verify metadata integrity');
      }
    } catch (err) {
      setError('Failed to verify metadata integrity');
      console.error('Error verifying integrity:', err);
    }
  };

  const handleGetBlockchainMetadata = async (item: FolderInfo | FileInfo) => {
    try {
      const result = await EnhancedFileService.getBlockchainMetadata(item.tokenId);
      if (result.success) {
        console.log('Blockchain metadata:', result.metadata);
        setSuccess('Blockchain metadata retrieved successfully! Check console for details.');
      } else {
        setError(result.error || 'Failed to get blockchain metadata');
      }
    } catch (err) {
      setError('Failed to get blockchain metadata');
      console.error('Error getting blockchain metadata:', err);
    }
  };

  const renderFolderItem = (folder: FolderInfo) => (
    <ListItem
      key={folder.tokenId}
      component="div"
      onClick={() => handleFolderClick(folder)}
      onContextMenu={(e) => handleContextMenu(e, folder)}
      sx={{
        borderRadius: 1,
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.palette.action.hover
        }
      }}
    >
      <ListItemIcon>
        <FolderIcon color="primary" />
      </ListItemIcon>
      <ListItemText
        primary={folder.folderName}
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              label={folder.network}
              size="small"
              color="primary"
              variant="outlined"
            />
            {folder.blockchainVerified && (
              <Tooltip title="Blockchain verified">
                <VerifiedIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            <Typography variant="caption" color="text.secondary">
              {new Date(folder.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, folder);
          }}
        >
          <MoreIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  const renderFileItem = (file: FileInfo) => (
    <ListItem
      key={file.tokenId}
      component="div"
      onClick={() => handleFileClick(file)}
      onContextMenu={(e) => handleContextMenu(e, file)}
      sx={{
        borderRadius: 1,
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.palette.action.hover
        }
      }}
    >
      <ListItemIcon>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>
            {EnhancedFileService.getFileTypeIcon(file.contentType)}
          </span>
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={file.fileName}
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              label={`v${file.version}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={EnhancedFileService.formatFileSize(file.contentSize)}
              size="small"
              color="default"
              variant="outlined"
            />
            {file.blockchainVerified && (
              <Tooltip title="Blockchain verified">
                <VerifiedIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            <Typography variant="caption" color="text.secondary">
              {new Date(file.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, file);
          }}
        >
          <MoreIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            SafeMate File Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CreateFolderIcon />}
              onClick={() => setCreateFolderDialog(true)}
              disabled={loading}
            >
              New Folder
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialog(true)}
              disabled={loading || !currentFolder}
            >
              Upload File
            </Button>
            <IconButton onClick={loadFolders} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          {currentPath.map((path, index) => (
            <Link
              key={path.id}
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbClick(index);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {index === 0 ? <HomeIcon sx={{ mr: 0.5 }} /> : null}
              {path.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Folders */}
            {folders.filter(f => !currentFolder || f.parentFolderId === currentFolder).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Folders
                </Typography>
                <Paper sx={{ p: 1 }}>
                  <List>
                    {folders
                      .filter(f => !currentFolder || f.parentFolderId === currentFolder)
                      .map(renderFolderItem)}
                  </List>
                </Paper>
              </Grid>
            )}

            {/* Files */}
            {files.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Files
                </Typography>
                <Paper sx={{ p: 1 }}>
                  <List>
                    {files.map(renderFileItem)}
                  </List>
                </Paper>
              </Grid>
            )}

            {/* Empty state */}
            {folders.filter(f => !currentFolder || f.parentFolderId === currentFolder).length === 0 && 
             files.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {currentFolder ? 'This folder is empty' : 'No folders or files yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentFolder 
                      ? 'Upload files or create subfolders to get started'
                      : 'Create your first folder to start organizing your files'
                    }
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

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
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ marginBottom: 16 }}
          />
          {selectedFile && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedFile.name} ({EnhancedFileService.formatFileSize(selectedFile.size)})
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={loading || !selectedFile}
          >
            {loading ? <CircularProgress size={20} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.item && 'fileName' in contextMenu.item ? (
          // File context menu
          <>
            <MenuItem onClick={() => {
              handleDownload(contextMenu.item as FileInfo);
              handleContextMenuClose();
            }}>
              <DownloadIcon sx={{ mr: 1 }} />
              Download
            </MenuItem>
            <MenuItem onClick={() => {
              handleVerifyIntegrity(contextMenu.item as FileInfo);
              handleContextMenuClose();
            }}>
              <VerifiedIcon sx={{ mr: 1 }} />
              Verify Integrity
            </MenuItem>
            <MenuItem onClick={() => {
              handleGetBlockchainMetadata(contextMenu.item as FileInfo);
              handleContextMenuClose();
            }}>
              <BlockchainIcon sx={{ mr: 1 }} />
              View Blockchain Metadata
            </MenuItem>
          </>
        ) : (
          // Folder context menu
          <>
            <MenuItem onClick={() => {
              if (contextMenu?.item) {
                handleVerifyIntegrity(contextMenu.item as FolderInfo);
              }
              handleContextMenuClose();
            }}>
              <VerifiedIcon sx={{ mr: 1 }} />
              Verify Integrity
            </MenuItem>
            <MenuItem onClick={() => {
              if (contextMenu?.item) {
                handleGetBlockchainMetadata(contextMenu.item as FolderInfo);
              }
              handleContextMenuClose();
            }}>
              <BlockchainIcon sx={{ mr: 1 }} />
              View Blockchain Metadata
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManager;
