import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { useUser } from '../../contexts/UserContext';
import { useHedera } from '../../contexts/HederaContext';
import ModernStatsCard from '../ModernStatsCard';
import ModernActionCard from '../ModernActionCard';


import { config } from '../../config/environment';

export function ModernDashboard() {
  const { user, isAuthenticated, logout } = useUser();
  const { account, isInitialized, isLoading, error, refreshBalance, folders, initializeAfterOnboarding } = useHedera();

  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);

  // Wallet checking is now handled in ModernLogin before reaching the dashboard

  // Onboarding is now handled in ModernLogin before reaching the dashboard

  const handleRefreshBalance = async () => {
    if (refreshingBalance) return;
    
    setRefreshingBalance(true);
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setRefreshingBalance(false);
    }
  };



  // Test button removed - onboarding is now handled in ModernLogin

  // Stats data
  const stats = [
    {
      title: 'Total Files',
      value: folders.length.toString(),
      change: folders.length > 0 ? `+${folders.length}` : '0',
      changeType: folders.length > 0 ? 'positive' as const : 'neutral' as const,
      icon: '📁'
    },
    {
      title: 'Storage Used',
      value: '0.0 MB', // TODO: Calculate actual storage used
      change: '0%',
      changeType: 'neutral' as const,
      icon: '💾'
    },
    {
      title: 'HBAR Balance',
      value: account?.balance || '0.0',
      change: account?.balance && parseFloat(account.balance) > 0 ? 'Active' : 'New',
      changeType: account?.balance && parseFloat(account.balance) > 0 ? 'positive' as const : 'neutral' as const,
      icon: '⚡'
    },
    {
      title: 'Security Level',
      value: account?.security === 'kms-enhanced' ? 'KMS Enhanced' : 'Standard',
      change: account?.security === 'kms-enhanced' ? 'Secure' : 'Basic',
      changeType: account?.security === 'kms-enhanced' ? 'positive' as const : 'neutral' as const,
      icon: '🔐'
    }
  ];

  const actions = [
    {
      title: 'Upload Files',
      description: 'Securely store files on the blockchain',
      icon: '📤',
      buttonText: 'Upload',
      onClick: () => window.location.href = '/upload',
      color: 'primary' as const
    },
    {
      title: 'View Files',
      description: 'Access your stored files',
      icon: '📁',
      buttonText: 'View',
      onClick: () => window.location.href = '/files',
      color: 'secondary' as const
    },
    {
      title: 'Blockchain Dashboard',
      description: 'Monitor your Hedera account',
      icon: '⚡',
      buttonText: 'Monitor',
      onClick: () => window.location.href = '/blockchain',
      color: 'success' as const
    },
    {
      title: 'Groups',
      description: 'Manage shared wallets and groups',
      icon: '👥',
      buttonText: 'Manage',
      onClick: () => window.location.href = '/groups',
      color: 'info' as const
    }
  ];





  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.attributes?.name || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your secure blockchain storage dashboard
        </Typography>
      </Box>

      {/* Hedera Wallet Status */}
      {account ? (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              ⚡ Your Hedera Testnet Wallet
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Account ID
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'white', fontWeight: 600 }}>
                  {account.accountId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Balance
                </Typography>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {account.balance} HBAR
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Security
                </Typography>
                <Chip 
                  label={account.security || 'Standard'} 
                  color={account.security === 'kms-enhanced' ? 'success' : 'default'}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Network
                </Typography>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {account.network.toUpperCase()}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Additional wallet info */}
            {account.publicKey && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Public Key
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                  {account.publicKey.substring(0, 20)}...
                </Typography>
              </Box>
            )}
            
            {/* Action buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => window.open(`https://hashscan.io/testnet/account/${account.accountId}`, '_blank')}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#4CAF50' } }}
              >
                View on HashScan
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#4CAF50' } }}
              >
                {refreshingBalance ? 'Refreshing...' : 'Refresh Balance'}
              </Button>



            </Box>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>🔐 Wallet Status:</strong> No Hedera wallet found. Please complete the onboarding process to create your secure wallet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              // setOnboardingAccountType(user?.attributes?.['custom:account_type'] || 'personal'); // This line was removed
              // setShowOnboarding(true); // This line was removed
            }}
            sx={{ mt: 1 }}
          >
            Create Secure Wallet
          </Button>
        </Alert>
      )}



      {/* Onboarding Modal is now handled in ModernLogin */}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ModernStatsCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Actions Grid */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ModernActionCard {...action} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}