// src/config/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { ENV } from './environment';

/**
 * Cliente de Supabase
 * Usa .env.development en local y .env.production en build
 */
export const supabase = createClient(
  ENV.supabase.url,
  ENV.supabase.anonKey
);

// Log para verificar qué proyecto estamos usando
if (ENV.isDevelopment) {
  console.log('🔗 Supabase:', ENV.supabase.url);
}