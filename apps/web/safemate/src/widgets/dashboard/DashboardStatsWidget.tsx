import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Avatar
} from '@mui/material';
import { 
  InsertDriveFile as FilesIcon,
  CloudQueue as StorageIcon,
  AccountBalance as HbarIcon,
  Stars as MateIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { WidgetProps } from '../../dashboard/core/DashboardProvider';
import BaseWidget from '../shared/BaseWidget';
import { createWidget, WidgetRegistry } from '../../dashboard/core/WidgetRegistry';
import { useHedera } from '../../contexts/HederaContext';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  progress?: number;
  chip?: string;
}

const DashboardStatsWidget: React.FC<WidgetProps> = ({ widgetId, accountType, onAction }) => {
  const { account, folders, isLoading, error } = useHedera();
  const [stats, setStats] = useState<StatCard[]>([]);

  useEffect(() => {
    const fileCount = folders.length;
    const storageUsed = 0.0; // TODO: Calculate actual storage
    const hbarBalance = account?.balance ? parseFloat(account.balance) : 0;
    const mateTokens = 0; // TODO: Get from MATE token balance

    const newStats: StatCard[] = [
      {
        title: 'FILES STORED',
        value: fileCount.toString(),
        subtitle: fileCount === 1 ? 'Total file' : 'Total files',
        icon: <FilesIcon sx={{ fontSize: 24 }} />,
        color: '#4285F4',
        bgColor: '#E3F2FD',
        progress: Math.min((fileCount / 100) * 100, 100),
        chip: fileCount > 0 ? '+' + fileCount : undefined
      },
      {
        title: 'STORAGE USED',
        value: `${storageUsed.toFixed(1)}MB`,
        subtitle: 'Total space',
        icon: <StorageIcon sx={{ fontSize: 24 }} />,
        color: '#34A853',
        bgColor: '#E8F5E8',
        progress: (storageUsed / 1000) * 100, // Assuming 1GB limit
      },
      {
        title: 'HBAR BALANCE',
        value: hbarBalance.toFixed(2),
        subtitle: 'Network credits',
        icon: <HbarIcon sx={{ fontSize: 24 }} />,
        color: '#FBBC05',
        bgColor: '#FFFDE7',
        chip: hbarBalance > 0 ? 'Active' : 'New'
      },
      {
        title: 'MATE TOKENS',
        value: mateTokens.toString(),
        subtitle: 'Rewards earned',
        icon: <MateIcon sx={{ fontSize: 24 }} />,
        color: '#EA4335',
        bgColor: '#FFEBEE',
        progress: Math.min((mateTokens / 1000) * 100, 100),
      }
    ];

    setStats(newStats);
  }, [account, folders]);

  const handleRefresh = () => {
    onAction?.('refresh-dashboard-stats', { widgetId });
    console.log(`Action: Refresh Dashboard Stats for ${accountType} account`);
  };

  const handleStatClick = (stat: StatCard) => {
    onAction?.('stat-clicked', { widgetId, statTitle: stat.title });
    console.log(`Action: ${stat.title} clicked for ${accountType} account`);
  };

  return (
    <BaseWidget
      widgetId={widgetId}
      accountType={accountType}
      title="Account Overview"
      subtitle="Your secure decentralized storage hub is ready to use"
      loading={isLoading}
      error={error}
      onRefresh={handleRefresh}
    >
      <Box sx={{ width: '100%' }}>
                          <Grid container spacing={2}>
           {stats.map((stat, index) => (
             <Grid item xs={12} sm={4} key={index}>
               <Card 
                 sx={{ 
                   height: '100%',
                   cursor: 'pointer',
                   border: `2px solid transparent`,
                   transition: 'all 0.2s ease-in-out',
                   '&:hover': {
                     border: `2px solid ${stat.color}40`,
                     transform: 'translateY(-2px)',
                     boxShadow: 2
                   }
                 }}
                 onClick={() => handleStatClick(stat)}
               >
                 <CardContent sx={{ p: 0.5, textAlign: 'center', '&:last-child': { pb: 0.5 } }}>
                   {/* Icon */}
                   <Avatar 
                     sx={{ 
                       bgcolor: stat.bgColor, 
                       color: stat.color,
                       width: 32,
                       height: 32,
                       mx: 'auto',
                       mb: 0.25
                     }}
                   >
                     {stat.icon}
                   </Avatar>

                   {/* Title */}
                   <Typography 
                     variant="h6" 
                     component="div" 
                     sx={{ 
                       fontSize: '0.8rem',
                       fontWeight: 600,
                       color: stat.color,
                       mb: 0.25
                     }}
                   >
                     {stat.title}
                   </Typography>

                   {/* Value */}
                   <Typography 
                     variant="h4" 
                     component="div" 
                     sx={{ 
                       fontWeight: 700,
                       fontSize: '1rem',
                       color: stat.color,
                       mb: 0.25
                     }}
                   >
                     {stat.value}
                   </Typography>

                   {/* Subtitle */}
                   <Typography 
                     variant="body2" 
                     color="text.secondary"
                     sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}
                   >
                     {stat.subtitle}
                   </Typography>

                   {/* Progress Bar */}
                   {stat.progress !== undefined && (
                     <LinearProgress
                       variant="determinate"
                       value={stat.progress}
                       sx={{
                         height: 2,
                         borderRadius: 1,
                         bgcolor: `${stat.color}20`,
                         '& .MuiLinearProgress-bar': {
                           bgcolor: stat.color,
                           borderRadius: 1
                         },
                         mb: 0.5
                       }}
                     />
                   )}

                   {/* Chip */}
                   {stat.chip && (
                     <Chip
                       label={stat.chip}
                       size="small"
                       icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                       sx={{
                         height: 18,
                         fontSize: '0.6rem',
                         fontWeight: 600,
                         bgcolor: `${stat.color}15`,
                         color: stat.color,
                         border: `1px solid ${stat.color}30`,
                         '& .MuiChip-icon': { color: stat.color }
                       }}
                     />
                   )}

                   {/* Info Button */}
                   <Box sx={{ mt: 0.25 }}>
                     <InfoIcon sx={{ fontSize: 12, color: 'text.disabled', cursor: 'pointer' }} />
                   </Box>
                 </CardContent>
               </Card>
             </Grid>
           ))}
        </Grid>
      </Box>
    </BaseWidget>
  );
};

export const DashboardStatsWidgetDefinition = createWidget({
  id: 'dashboard-stats',
  name: 'Dashboard Statistics',
  component: DashboardStatsWidget,
  category: 'analytics',
  permissions: ['personal', 'family', 'business', 'community', 'sporting', 'cultural'],
  gridSize: { cols: 3, rows: 3 },
  priority: 1,
});

WidgetRegistry.register(DashboardStatsWidgetDefinition);

export default DashboardStatsWidget;
