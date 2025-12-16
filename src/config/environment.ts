/**
 * Configuración de Ambientes con Switch Manual
 * Cambia entre proyectos de Supabase con VITE_USE_PROJECT
 */

type ProjectType = 'prod' | 'dev';

// Switch manual: 'prod' o 'dev'
const useProject = (import.meta.env.VITE_USE_PROJECT || 'prod') as ProjectType;

// Configuraciones de ambos proyectos
const supabaseConfigs = {
  prod: {
    url: import.meta.env.VITE_SUPABASE_URL_PROD || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_PROD || '',
    projectId: import.meta.env.VITE_SUPABASE_PROJ_ID_PROD || '',
  },
  dev: {
    url: import.meta.env.VITE_SUPABASE_URL_DEV || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || '',
    projectId: import.meta.env.VITE_SUPABASE_PROJ_ID_DEV || '',
  },
};

/**
 * Configuración activa según VITE_USE_PROJECT
 */
export const ENV = {
  // Proyecto activo
  project: useProject,
  isUsingProd: useProject === 'prod',
  isUsingDev: useProject === 'dev',

  // Modo de Vite
  mode: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Configuración de Supabase activa
  supabase: supabaseConfigs[useProject],

  // Feature flags
  features: {
    offlineMode: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    pwaEnabled: import.meta.env.VITE_ENABLE_PWA === 'true',
  },
};

/**
 * Log de configuración
 */
console.log(`🔗 Conectando a Supabase [${useProject.toUpperCase()}]:`, {
  proyecto: useProject,
  url: ENV.supabase.url,
  projectId: ENV.supabase.projectId,
  offline: ENV.features.offlineMode,
});

/**
 * Validación
 */
if (!ENV.supabase.url || !ENV.supabase.anonKey) {
  console.error(`❌ Error: Credenciales de proyecto "${useProject}" incompletas`);
  console.error('Verifica las variables VITE_SUPABASE_*_' + useProject.toUpperCase());
}
