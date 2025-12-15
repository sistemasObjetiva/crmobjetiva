# 🚀 Setup de Edge Functions para Usuarios

## 📋 Funciones Creadas

Este proyecto usa 2 Edge Functions de Supabase para gestionar usuarios:

1. **`create-user`** - Crear usuarios en Supabase Auth
2. **`delete-user`** - Eliminar usuarios de Auth y BD

---

## 🔧 Instalación en Supabase Dashboard

### Opción 1: Via Dashboard (Recomendado para prueba rápida)

#### Función 1: create-user

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Click en "Edge Functions" en el menú lateral
3. Click "Create a new function"
4. **Name:** `create-user`
5. Pega el siguiente código:

```typescript
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
    const { email, password, nombre } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y password son requeridos' }),
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

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre || ''
      }
    })

    if (authError) {
      console.error('Error al crear usuario:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'No se pudo crear el usuario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        userId: authData.user.id,
        email: authData.user.email,
        success: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en create-user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

6. Click "Deploy"

#### Función 2: delete-user

1. Click "Create a new function" nuevamente
2. **Name:** `delete-user`
3. Pega el siguiente código:

```typescript
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

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error al eliminar usuario:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error('Error al eliminar de BD:', dbError)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en delete-user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Click "Deploy"

---

### Opción 2: Via Supabase CLI (Para desarrollo local)

#### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# O con npm
npm install -g supabase
```

#### 2. Login

```bash
supabase login
```

#### 3. Link al proyecto

```bash
supabase link --project-ref tu-project-ref
```

#### 4. Crear las funciones

```bash
# Crear estructura
supabase functions new create-user
supabase functions new delete-user
```

#### 5. Copiar el código

- Copia el código de arriba a `supabase/functions/create-user/index.ts`
- Copia el código de arriba a `supabase/functions/delete-user/index.ts`

#### 6. Deploy

```bash
# Deploy ambas funciones
supabase functions deploy create-user
supabase functions deploy delete-user

# O deploy todas
supabase functions deploy
```

---

## ✅ Verificar que Funciona

### Test create-user

```bash
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Temp123!",
    "nombre": "Usuario Test"
  }'
```

### Test delete-user

```bash
curl -X POST \
  https://tu-proyecto.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-del-usuario"
  }'
```

---

## 🔒 Seguridad

Las Edge Functions usan automáticamente:
- ✅ `SUPABASE_URL` - URL del proyecto
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Key con permisos admin

**Nunca expongas estas variables en el cliente.**

---

## 📝 Logs

Para ver logs de las funciones:

```bash
# Via CLI
supabase functions logs create-user
supabase functions logs delete-user

# Via Dashboard
Edge Functions → [nombre-función] → Logs
```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Verifica que el proyecto tenga las Edge Functions habilitadas
- Revisa que tu ANON_KEY sea correcta

### Error: "Function not found"
- Espera 1-2 minutos después del deploy
- Verifica el nombre exacto de la función

### Error CORS
- Las funciones ya incluyen headers CORS
- Si persiste, verifica tu dominio en la configuración de Supabase

---

## 🔄 Migrar desde Servidor Externo

### Antes (servidor externo)
```typescript
const res = await fetch(`${API_BASE}/newupsert-user/${projectId}`, {
  method: "POST",
  body: JSON.stringify({ email, password, nombre })
});
```

### Después (Edge Function)
```typescript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: { email, password, nombre }
});
```

**Ventajas:**
- ✅ Más rápido (menos latencia)
- ✅ Integrado con Supabase
- ✅ Auto-escalable
- ✅ Sin servidor externo que mantener
- ✅ Logs centralizados

---

## 📌 Próximos Pasos

Una vez funcionando las Edge Functions:

1. ✅ Verificar que usuarios se crean correctamente
2. ✅ Verificar que usuarios se eliminan correctamente
3. ✅ Eliminar dependencia del servidor externo
4. 🚀 Proceder con arquitectura offline
5. 🚀 Crear proyecto dev en Supabase

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica los logs de la función
2. Prueba con curl primero
3. Revisa que el usuario tenga email válido
4. Verifica permisos de Service Role Key
