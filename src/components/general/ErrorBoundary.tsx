import { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Componente ErrorBoundary para capturar errores de React
 * y mostrar una UI de fallback amigable
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error para debugging (en producción esto debería ir a un servicio como Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si se proporciona un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback predeterminado
      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          bgcolor="#f5f5f5"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            <ErrorOutlineIcon
              color="error"
              sx={{ fontSize: 64, mb: 2 }}
            />
            
            <Typography variant="h4" gutterBottom color="error">
              Algo salió mal
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Lo sentimos, ocurrió un error inesperado. Por favor, intenta recargar la página.
            </Typography>

            {/* Mostrar detalles del error solo en desarrollo */}
            {import.meta.env.DEV && this.state.error && (
              <Box
                mt={3}
                p={2}
                bgcolor="#fff3cd"
                borderRadius={1}
                textAlign="left"
              >
                <Typography variant="caption" component="div" fontWeight="bold" mb={1}>
                  Error Details (Solo visible en desarrollo):
                </Typography>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    overflow: 'auto',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && '\n\n'}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            <Box mt={3} display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.reload()}
              >
                Recargar Página
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
              >
                Intentar de Nuevo
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
