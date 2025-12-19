import { ENV } from '../../config/environment';

/**
 * Badge visual para mostrar en qué ambiente estamos
 */
export function EnvironmentBadge() {
  // Solo mostrar en desarrollo
  if (!ENV.isDevelopment) return null;

  const badgeStyle: React.CSSProperties = {
    position: 'fixed',
    top: 10,
    right: 10,
    backgroundColor: '#10b981',
    color: 'white',
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    zIndex: 9999,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'monospace',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'white',
    animation: 'pulse 2s infinite',
  };

  const handleClick = () => {
    console.log('📊 Environment:', {
      proyecto: ENV.project,
      url: ENV.supabase.url,
      projectId: ENV.supabase.projectId,
      offline: ENV.features.offlineMode,
    });
  };

  const label = ENV.isUsingDev ? 'DEV' : 'PROD';
  const color = ENV.isUsingDev ? '#10b981' : '#f59e0b';

  return (
    <>
      <div 
        style={{ ...badgeStyle, backgroundColor: color }} 
        onClick={handleClick} 
        title="Click para ver info en consola"
      >
        <div style={dotStyle} />
        {label}
        {ENV.features.offlineMode && ' + OFFLINE'}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
