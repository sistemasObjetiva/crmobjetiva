# Edge Function: disable-user (Opcional)

Esta función desactiva el usuario en Supabase Auth sin eliminarlo, para que no pueda iniciar sesión pero conserves su cuenta para auditoría.

## Código de la función

```typescript
// supabase/functions/disable-user/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Desactivar usuario (no eliminar)
    const { data, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        ban_duration: 'none', // Sin límite de tiempo
        user_metadata: { 
          disabled: true,
          disabled_at: new Date().toISOString()
        }
      }
    )

    if (authError) {
      console.error('Error al desactivar usuario:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario desactivado en Auth correctamente',
        userId: userId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en disable-user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## ¿Crear esta función?

**Opción 1 (Recomendado):** SÍ, créala
- ✅ Usuario no podrá iniciar sesión
- ✅ Datos se conservan para auditoría
- ✅ Se puede reactivar fácilmente

**Opción 2:** NO la crees
- Usuario seguirá en Auth pero marcado como inactivo en BD
- Podría iniciar sesión pero no tendría permisos
- Más simple de implementar

## Si decides crearla:

1. Dashboard → Edge Functions
2. Create function: `disable-user`
3. Pega el código de arriba
4. Deploy

Ya funciona con el código actual, solo mejorará si creas la función.
