/**
 * ============================================
 * OFFLINE STATUS BADGE
 * ============================================
 * Componente para mostrar estado de conexión y sincronización
 */

import React from 'react';
import { Badge, IconButton, Tooltip, CircularProgress, Box, Typography } from '@mui/material';
import {
  CloudDone,
  CloudOff,
  CloudSync,
  Warning,
} from '@mui/icons-material';
import { useOffline } from '../../config/context/OfflineContext';

export const OfflineStatusBadge: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, lastSync, syncNow, syncResult } = useOffline();

  const getIcon = () => {
    if (!isOnline) {
      return <CloudOff color="error" />;
    }

    if (isSyncing) {
      return <CloudSync color="primary" />;
    }

    if (pendingCount > 0) {
      return <Warning color="warning" />;
    }

    return <CloudDone color="success" />;
  };

  const getTooltip = () => {
    if (!isOnline) {
      return 'Sin conexión - Modo offline';
    }

    if (isSyncing) {
      return 'Sincronizando...';
    }

    if (pendingCount > 0) {
      return `${pendingCount} operación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''}`;
    }

    if (lastSync) {
      const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
      if (minutes < 1) {
        return 'Sincronizado hace un momento';
      } else if (minutes === 1) {
        return 'Sincronizado hace 1 minuto';
      } else {
        return `Sincronizado hace ${minutes} minutos`;
      }
    }

    return 'Sincronizado';
  };

  const handleClick = () => {
    if (isOnline && !isSyncing) {
      syncNow();
    }
  };

  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="body2">{getTooltip()}</Typography>
          {syncResult && syncResult.errors.length > 0 && (
            <Typography variant="caption" color="error">
              {syncResult.errors[0]}
            </Typography>
          )}
        </Box>
      }
    >
      <IconButton 
        onClick={handleClick}
        disabled={!isOnline || isSyncing}
        size="small"
      >
        {isSyncing ? (
          <CircularProgress size={24} />
        ) : (
          <Badge badgeContent={pendingCount > 0 ? pendingCount : null} color="warning">
            {getIcon()}
          </Badge>
        )}
      </IconButton>
    </Tooltip>
  );
};
