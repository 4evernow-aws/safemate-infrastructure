import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Breadcrumbs,
  Link,
  Fab,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  ListItem,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  CreateNewFolder as CreateFolderIcon,
  Description as FileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Slideshow as PresentationIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Upload as FileUploadIcon,
  Refresh as RefreshIcon,
  InsertDriveFile as DocIcon,
  Security as SecurityIcon,
  Token as TokenIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  FileCopy as CopyIcon,
  CloudUpload as CloudUploadIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useHedera } from '../../contexts/HederaContext';
import { config } from '../../config/environment';
import ModernStatsCard from '../ModernStatsCard';
import FileDetailsModal from '../modals/FileDetailsModal';
import { formatFileSize } from '../../utils/formatters';

// Enhanced file and folder interfaces for hierarchical structure
interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  path: string;
  parentId: string | null;
  isShared: boolean;
  shareCount?: number;
  downloadCount?: number;
  mateReward?: number;
}

interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  children: string[];
  isShared: boolean;
  shareCount?: number;
  mateReward?: number;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  estimatedReward?: number;
  estimatedCost?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`files-tabpanel-${index}`}
      aria-labelledby={`files-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ModernMyFiles() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { account, folders, uploadFile, refreshFolders, createFolder, isInitialized, isLoading: hederaLoading } = useHedera();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // State management for hierarchical file system
  const [allFolders, setAllFolders] = useState<Record<string, FolderItem>>({});
  const [allFiles, setAllFiles] = useState<Record<string, FileItem>>({});

  // Current navigation state
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentFolderId, setSelectedParentFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    itemId: string;
    itemType: 'file' | 'folder';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // File details modal state
  const [fileDetailsModalOpen, setFileDetailsModalOpen] = useState(false);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<FileItem | null>(null);

  // Upload state
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Transform folders to flat structure for consistency with files component
  const transformedFolders = useMemo(() => {
    const flatFolders: any[] = [];
    
    const processFolder = (folder: any, parentPath: string = '') => {
      const currentPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      flatFolders.push({
        ...folder,
        displayName: currentPath,
        fullPath: currentPath
      });
      
      if (folder.subfolders) {
        folder.subfolders.forEach((subfolder: any) => {
          processFolder(subfolder, currentPath);
        });
      }
    };
    
    folders.forEach(folder => {
      processFolder(folder);
    });
    
    return flatFolders;
  }, [folders]);

  const calculateReward = (fileSize: number) => {
    // Base reward: 2 MATE + size-based bonus
    return 2 + Math.floor(fileSize / (1024 * 1024)) * 1.5;
  };

  const calculateCost = (fileSize: number) => {
    // Estimated cost in HBAR
    return (fileSize / (1024 * 1024)) * 0.001;
  };

  // Upload dropzone handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0,
      estimatedReward: calculateReward(file.size),
      estimatedCost: calculateCost(file.size),
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
    enqueueSnackbar(`${acceptedFiles.length} file(s) added to upload queue`, { variant: 'success' });
  }, [enqueueSnackbar]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            enqueueSnackbar('File too large. Maximum size is 50MB.', { variant: 'error' });
          } else {
            enqueueSnackbar(`Upload error: ${error.message}`, { variant: 'error' });
          }
        });
      });
    },
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileStatus = (fileId: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      enqueueSnackbar('Please enter a folder name', { variant: 'error' });
      return;
    }

    setIsCreatingFolder(true);
    try {
      const result = await createFolder(newFolderName, selectedParentFolderId || undefined);
      if (result && typeof result === 'string') {
        enqueueSnackbar('Folder created successfully!', { variant: 'success' });
        setNewFolderName('');
        setCreateFolderDialogOpen(false);
        await refreshFolders();
      } else {
        enqueueSnackbar('Failed to create folder', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      enqueueSnackbar('Failed to create folder', { variant: 'error' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      enqueueSnackbar('No files to upload', { variant: 'warning' });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const fileToUpload of uploadFiles) {
      try {
        updateFileStatus(fileToUpload.id, { status: 'uploading', progress: 0 });
        
        const result = await uploadFile(selectedFolderId || 'root', fileToUpload.file, (progress: number) => {
          updateFileStatus(fileToUpload.id, { progress });
        });

        if (result && typeof result === 'string') {
          updateFileStatus(fileToUpload.id, { status: 'completed', progress: 100 });
          successCount++;
        } else {
          updateFileStatus(fileToUpload.id, { 
            status: 'error', 
            error: 'Upload failed' 
          });
          errorCount++;
        }
      } catch (error) {
        console.error('Upload error:', error);
        updateFileStatus(fileToUpload.id, { 
          status: 'error', 
          error: 'Upload failed' 
        });
        errorCount++;
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      enqueueSnackbar(`${successCount} file(s) uploaded successfully!`, { variant: 'success' });
      await refreshFolders();
    }
    
    if (errorCount > 0) {
      enqueueSnackbar(`${errorCount} file(s) failed to upload`, { variant: 'error' });
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
    }, 3000);
  };

  // Get breadcrumb path for current folder
  const breadcrumbs = useMemo(() => {
    const crumbs: BreadcrumbItem[] = [
      { id: 'root', name: 'Home', path: '/' }
    ];

    if (currentFolderId !== 'root') {
      // Build breadcrumb path based on current folder
      const currentFolder = allFolders[currentFolderId];
      if (currentFolder) {
        const pathParts = currentFolder.path.split('/').filter(Boolean);
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
          currentPath += `/${part}`;
          crumbs.push({
            id: `folder-${index}`,
            name: part,
            path: currentPath
          });
        });
      }
    }

    return crumbs;
  }, [currentFolderId, allFolders]);

  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          📁 My Files
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your files and upload new content to the blockchain
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Total Files"
            value={Object.keys(allFiles).length.toString()}
            icon="📄"
            color="primary"
            trend={{ value: 12, label: "+12%" }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Total Folders"
            value={Object.keys(allFolders).length.toString()}
            icon="📁"
            color="secondary"
            trend={{ value: 5, label: "+5%" }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Storage Used"
            value={formatFileSize(Object.values(allFiles).reduce((acc, file) => acc + file.size, 0))}
            icon="💾"
            color="success"
            trend={{ value: 8, label: "+8%" }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="MATE Rewards"
            value={`${Object.values(allFiles).reduce((acc, file) => acc + (file.mateReward || 0), 0)} MATE`}
            icon="🪙"
            color="warning"
            trend={{ value: 15, label: "+15%" }}
          />
        </Grid>
      </Grid>

      {/* Main Content with Tabs */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon />
                  Files
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUploadIcon />
                  Upload
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Files Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ flexGrow: 1 }}
            >
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={crumb.id}
                  color={index === breadcrumbs.length - 1 ? 'textPrimary' : 'inherit'}
                  component="button"
                  variant="body1"
                  onClick={() => navigateToFolder(crumb.id)}
                  sx={{ 
                    textDecoration: 'none',
                    fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {index === 0 && <HomeIcon fontSize="small" />}
                  {crumb.name}
                </Link>
              ))}
            </Breadcrumbs>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<CreateFolderIcon />}
                onClick={() => setCreateFolderDialogOpen(true)}
                sx={{ borderRadius: 3 }}
              >
                New Folder
              </Button>
              <Button
                variant="contained"
                startIcon={<FileUploadIcon />}
                onClick={() => setActiveTab(1)}
                sx={{ borderRadius: 3 }}
              >
                Upload Files
              </Button>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="size">Size</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ListViewIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Files and Folders List */}
          <Box>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                File management interface will be implemented here
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* Upload Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Upload Area */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    📤 Upload Files
                  </Typography>
                  
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? 'primary.main' : 'divider',
                      borderRadius: 3,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragActive ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      or click to select files (max 50MB per file)
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />}>
                      Select Files
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Upload Queue */}
              {uploadFiles.length > 0 && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      📋 Upload Queue ({uploadFiles.length})
                    </Typography>
                    
                    <List>
                      {uploadFiles.map((uploadFile) => (
                        <ListItem key={uploadFile.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 1 }}>
                          <ListItemIcon>
                            <FileIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={uploadFile.file.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Size: {formatFileSize(uploadFile.file.size)}
                                </Typography>
                                {uploadFile.estimatedReward && (
                                  <Typography variant="caption" display="block">
                                    Estimated Reward: {uploadFile.estimatedReward} MATE
                                  </Typography>
                                )}
                                {uploadFile.estimatedCost && (
                                  <Typography variant="caption" display="block">
                                    Estimated Cost: {uploadFile.estimatedCost} HBAR
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {uploadFile.status === 'uploading' && (
                                <CircularProgress size={20} />
                              )}
                              {uploadFile.status === 'completed' && (
                                <CheckCircleIcon color="success" />
                              )}
                              {uploadFile.status === 'error' && (
                                <ErrorIcon color="error" />
                              )}
                              <IconButton
                                edge="end"
                                onClick={() => removeFile(uploadFile.id)}
                                disabled={uploadFile.status === 'uploading'}
                              >
                                <ClearIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>

                    {uploadFiles.some(f => f.status === 'uploading') && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleUploadFiles}
                        disabled={isUploading || uploadFiles.length === 0}
                        startIcon={<CloudUploadIcon />}
                      >
                        {isUploading ? 'Uploading...' : 'Upload All Files'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setUploadFiles([])}
                        disabled={isUploading}
                      >
                        Clear Queue
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Folder Selection */}
              <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    📁 Select Folder
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Upload to Folder</InputLabel>
                    <Select
                      value={selectedFolderId}
                      label="Upload to Folder"
                      onChange={(e) => setSelectedFolderId(e.target.value)}
                    >
                      <MenuItem value="">Root Folder</MenuItem>
                      {transformedFolders.map((folder) => (
                        <MenuItem key={folder.id} value={folder.id}>
                          {folder.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    startIcon={<CreateFolderIcon />}
                    onClick={() => setCreateFolderDialogOpen(true)}
                    fullWidth
                  >
                    Create New Folder
                  </Button>
                </CardContent>
              </Card>

              {/* Upload Stats */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    📊 Upload Stats
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Files in Queue:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {uploadFiles.length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total Size:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatFileSize(uploadFiles.reduce((acc, f) => acc + f.file.size, 0))}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Estimated Rewards:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {uploadFiles.reduce((acc, f) => acc + (f.estimatedReward || 0), 0)} MATE
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Estimated Cost:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {uploadFiles.reduce((acc, f) => acc + (f.estimatedCost || 0), 0).toFixed(4)} HBAR
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onClose={() => setCreateFolderDialogOpen(false)} maxWidth="sm" fullWidth>
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
            sx={{ mt: 1 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Parent Folder</InputLabel>
            <Select
              value={selectedParentFolderId || ''}
              label="Parent Folder"
              onChange={(e) => setSelectedParentFolderId(e.target.value || null)}
            >
              <MenuItem value="">Root Folder</MenuItem>
              {transformedFolders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateFolder} 
            variant="contained"
            disabled={isCreatingFolder || !newFolderName.trim()}
          >
            {isCreatingFolder ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Details Modal */}
      <FileDetailsModal
        open={fileDetailsModalOpen}
        file={selectedFileForDetails}
        onClose={() => setFileDetailsModalOpen(false)}
      />
    </Container>
  );
} 