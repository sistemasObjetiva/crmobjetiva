# 🔧 Configuración de Ambientes Multi-Supabase

## 📋 Resumen

Este proyecto ahora soporta **múltiples proyectos de Supabase** para desarrollo y producción.

---

## 🚀 Configuración Rápida

### 1. Copia el archivo de ejemplo

```bash
cp .env.example .env.local
```

### 2. Llena las credenciales en `.env.local`

```env
# ========================================
# CONTROL: Cambia aquí entre prod/dev
# ========================================
VITE_USE_ENV=development  # O 'production'

# ========================================
# SUPABASE - PRODUCCIÓN
# ========================================
VITE_SUPABASE_URL_PROD=https://tu-proyecto-prod.supabase.co
VITE_SUPABASE_ANON_KEY_PROD=tu-key-de-produccion
VITE_SUPABASE_PROJ_ID_PROD=tu-project-id-prod

# ========================================
# SUPABASE - DESARROLLO
# ========================================
VITE_SUPABASE_URL_DEV=https://qdinhxiufvteehbubvsw.supabase.co
VITE_SUPABASE_ANON_KEY_DEV=tu-key-de-desarrollo
VITE_SUPABASE_PROJ_ID_DEV=qdinhxiufvteehbubvsw
```

### 3. Corre el proyecto

```bash
npm run dev
```

Verás en consola:
```
🌍 Environment Config: {
  ambiente: 'development',
  supabase: 'https://qdinhxiufvteehbubvsw.supabase.co',
  projectId: 'qdinhxiufvteehbubvsw',
  ...
}
```

---

## 🎛️ Cambiar Entre Ambientes

### Método 1: Variable de Entorno (Recomendado)

En `.env.local`:
```env
# Para desarrollo (proyecto dev)
VITE_USE_ENV=development

# Para producción (proyecto prod)
VITE_USE_ENV=production
```

### Método 2: Scripts en package.json

Puedes agregar:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:prod": "VITE_USE_ENV=production vite",
    "dev:dev": "VITE_USE_ENV=development vite"
  }
}
```

Luego:
```bash
npm run dev:dev   # Usa proyecto dev
npm run dev:prod  # Usa proyecto prod
```

---

## 🔍 Verificar Qué Proyecto Estás Usando

### Visualmente
Verás un badge verde en la esquina superior derecha que dice **"DEVELOPMENT"**:
- 🟢 Verde = Proyecto dev
- 🟠 Naranja = Proyecto staging (si lo configuras)
- ❌ No aparece = Producción

### En Consola
Al cargar la app verás:
```
🌍 Environment Config: { ... }
🔗 Supabase Client: { ... }
```

### Click en el Badge
Click en el badge verde y verás en consola toda la info del ambiente actual.

---

## 🏗️ Estructura de Archivos

```
src/
├── config/
│   ├── environment.ts      # ← Configuración de ambientes
│   └── supabase.tsx        # ← Cliente Supabase (usa environment.ts)
└── components/
    └── dev/
        └── EnvironmentBadge.tsx  # ← Badge visual
```

---

## ⚠️ IMPORTANTE

### Para Desarrollo Local
1. ✅ Usa `VITE_USE_ENV=development`
2. ✅ Trabaja con el proyecto dev de Supabase
3. ✅ Rompe lo que quieras, es tu sandbox

### Para Producción (Deploy)
1. ✅ En Vercel configura `VITE_USE_ENV=production`
2. ✅ Configura las variables `_PROD`
3. ✅ Nunca uses las credenciales dev en producción

---

## 📝 Checklist

- [ ] `.env.local` creado (NO commitear)
- [ ] Variables `_PROD` configuradas
- [ ] Variables `_DEV` configuradas
- [ ] `VITE_USE_ENV` configurado
- [ ] Badge visible en desarrollo
- [ ] Verificado en consola qué proyecto usa
- [ ] Probado crear un registro (debe ir al proyecto correcto)

---

## 🆘 Troubleshooting

### "Error: Configuración incompleta"
- Verifica que todas las variables `VITE_SUPABASE_*` estén llenas
- Revisa que no haya typos en los nombres

### "No veo el badge"
- El badge solo aparece si `VITE_USE_ENV !== 'production'`
- Verifica que esté importado en tu Layout

### "Los datos no se guardan"
- Verifica en consola qué proyecto estás usando
- Ve a Supabase Dashboard del proyecto correcto
- Revisa permisos RLS de las tablas

---

## 🎯 Próximos Pasos

Una vez que esto funcione:
1. ✅ Instalar Dexie para IndexedDB
2. ✅ Crear sistema de sincronización
3. ✅ Implementar PWA
4. ✅ Modularizar hooks

---

**¿Listo?** Copia las credenciales de tu proyecto dev de Supabase a `.env.local` y prueba! 🚀
