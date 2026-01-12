-- Script para optimizar imágenes existentes en Supabase Storage
-- Este script genera URLs firmadas de todas las imágenes para poder descargarlas y resubirlas optimizadas
-- IMPORTANTE: Ejecutar este script EN LA CONSOLA DE SUPABASE o mediante el cliente de JavaScript

-- ========================================
-- PASO 1: Identificar todas las imágenes
-- ========================================

-- Obtener todas las rutas de imágenes de proyectos
SELECT 
  'proyecto' as tipo,
  p.id::text as entidad_id,
  p.nombre as entidad_nombre,
  'logo' as campo,
  (p.logo->>'path')::text as path,
  (p.logo->>'bucket')::text as bucket
FROM proyectos p
WHERE p.logo IS NOT NULL 
  AND p.logo->>'path' IS NOT NULL
UNION ALL
SELECT 
  'proyecto' as tipo,
  p.id::text,
  p.nombre,
  'render' as campo,
  (p.render->>'path')::text,
  (p.render->>'bucket')::text
FROM proyectos p
WHERE p.render IS NOT NULL 
  AND p.render->>'path' IS NOT NULL
UNION ALL
-- Imágenes de unidades dentro de proyectos - render
SELECT 
  'unidad' as tipo,
  (uni.value->>'id')::text as entidad_id,
  (uni.value->>'nombre')::text as entidad_nombre,
  'render' as campo,
  (uni.value->'render'->>'path')::text as path,
  (uni.value->'render'->>'bucket')::text as bucket
FROM proyectos p
CROSS JOIN LATERAL jsonb_array_elements(p.unidades) AS uni(value)
WHERE p.unidades IS NOT NULL 
  AND jsonb_array_length(p.unidades) > 0
  AND uni.value->'render' IS NOT NULL
  AND uni.value->'render'->>'path' IS NOT NULL
UNION ALL
-- Imágenes de unidades - isométrico
SELECT 
  'unidad' as tipo,
  (uni.value->>'id')::text,
  (uni.value->>'nombre')::text,
  'isometrico' as campo,
  (uni.value->'isometrico'->>'path')::text,
  (uni.value->'isometrico'->>'bucket')::text
FROM proyectos p
CROSS JOIN LATERAL jsonb_array_elements(p.unidades) AS uni(value)
WHERE p.unidades IS NOT NULL 
  AND jsonb_array_length(p.unidades) > 0
  AND uni.value->'isometrico' IS NOT NULL
  AND uni.value->'isometrico'->>'path' IS NOT NULL
UNION ALL
-- Imágenes de unidades - plano
SELECT 
  'unidad' as tipo,
  (uni.value->>'id')::text,
  (uni.value->>'nombre')::text,
  'plano' as campo,
  (uni.value->'plano'->>'path')::text,
  (uni.value->'plano'->>'bucket')::text
FROM proyectos p
CROSS JOIN LATERAL jsonb_array_elements(p.unidades) AS uni(value)
WHERE p.unidades IS NOT NULL 
  AND jsonb_array_length(p.unidades) > 0
  AND uni.value->'plano' IS NOT NULL
  AND uni.value->'plano'->>'path' IS NOT NULL
UNION ALL
-- Imágenes múltiples de unidades
SELECT 
  'unidad' as tipo,
  (uni.value->>'id')::text,
  (uni.value->>'nombre')::text,
  'imagenes_' || (row_number() OVER (PARTITION BY (uni.value->>'id')::text ORDER BY img_elem.ordinality))::text as campo,
  (img_elem.value->>'path')::text,
  (img_elem.value->>'bucket')::text
FROM proyectos p
CROSS JOIN LATERAL jsonb_array_elements(p.unidades) AS uni(value)
CROSS JOIN LATERAL jsonb_array_elements(uni.value->'imagenes') WITH ORDINALITY AS img_elem(value, ordinality)
WHERE p.unidades IS NOT NULL 
  AND jsonb_array_length(p.unidades) > 0
  AND uni.value->'imagenes' IS NOT NULL
  AND jsonb_typeof(uni.value->'imagenes') = 'array'
  AND jsonb_array_length(uni.value->'imagenes') > 0
  AND img_elem.value->>'path' IS NOT NULL
UNION ALL
-- Imágenes de propiedades
SELECT 
  'propiedad' as tipo,
  pr.id::text,
  pr."tituloPropiedad",
  'imagenes_' || (row_number() OVER (PARTITION BY pr.id::text ORDER BY img_elem.ordinality))::text as campo,
  (img_elem.value->>'path')::text,
  (img_elem.value->>'bucket')::text
FROM propiedades pr
CROSS JOIN LATERAL jsonb_array_elements(pr.imagenes) WITH ORDINALITY AS img_elem(value, ordinality)
WHERE pr.imagenes IS NOT NULL 
  AND jsonb_array_length(pr.imagenes) > 0
  AND img_elem.value->>'path' IS NOT NULL
ORDER BY tipo, entidad_id, campo;


-- ========================================
-- PASO 2: Estadísticas de imágenes
-- ========================================

-- Contar imágenes por tipo
SELECT 
  tipo,
  COUNT(*) as total_imagenes
FROM (
  SELECT 'proyecto-logo' as tipo FROM proyectos WHERE logo IS NOT NULL AND logo->>'path' IS NOT NULL
  UNION ALL
  SELECT 'proyecto-render' FROM proyectos WHERE render IS NOT NULL AND render->>'path' IS NOT NULL
  UNION ALL
  SELECT 'unidad-render' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'render' IS NOT NULL AND uni->'render'->>'path' IS NOT NULL
  UNION ALL
  SELECT 'unidad-isometrico' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'isometrico' IS NOT NULL AND uni->'isometrico'->>'path' IS NOT NULL
  UNION ALL
  SELECT 'unidad-plano' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'plano' IS NOT NULL AND uni->'plano'->>'path' IS NOT NULL
  UNION ALL
  SELECT 'unidad-imagenes' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni, jsonb_array_elements(uni->'imagenes') WHERE p.unidades IS NOT NULL AND uni->'imagenes' IS NOT NULL
  UNION ALL
  SELECT 'propiedad-imagenes' FROM propiedades pr, jsonb_array_elements(pr.imagenes) WHERE pr.imagenes IS NOT NULL
) t
GROUP BY tipo
ORDER BY tipo;


-- ========================================
-- PASO 3: Script TypeScript/JavaScript para optimizar
-- ========================================

/*
// Guardar este código en un archivo: optimize-existing-images.ts

import { createClient } from '@supabase/supabase-js'
import { optimizeImage, processFile } from './src/utils/image.utils'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageRecord {
  tipo: string
  entidad_id: string
  entidad_nombre: string
  campo: string
  path: string
  bucket: string
}

async function optimizeExistingImages() {
  console.log('🔍 Identificando imágenes existentes...')
  
  // Obtener lista de imágenes desde la query SQL del PASO 1
  // (ejecutar esa query y guardar resultados en images)
  const images: ImageRecord[] = [] // Llenar con resultados de la query
  
  console.log(`📊 Total de imágenes encontradas: ${images.length}`)
  
  let processed = 0
  let errors = 0
  let totalSaved = 0
  
  for (const img of images) {
    try {
      console.log(`⏳ Procesando [${processed + 1}/${images.length}]: ${img.path}`)
      
      // 1. Descargar imagen original
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(img.bucket)
        .download(img.path)
      
      if (downloadError) {
        console.error(`❌ Error descargando ${img.path}:`, downloadError)
        errors++
        continue
      }
      
      // 2. Obtener tamaño original
      const originalSize = downloadData.size
      
      // 3. Optimizar imagen
      const file = new File([downloadData], img.path.split('/').pop() || 'image.jpg', {
        type: downloadData.type
      })
      
      if (!file.type.startsWith('image/')) {
        console.log(`⏭️  Saltando ${img.path} (no es imagen)`)
        processed++
        continue
      }
      
      const optimizedFile = await processFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      })
      
      const optimizedSize = optimizedFile.size
      const reduction = ((1 - optimizedSize / originalSize) * 100)
      
      if (reduction < 5) {
        console.log(`⏭️  Saltando ${img.path} (reducción menor al 5%: ${reduction.toFixed(1)}%)`)
        processed++
        continue
      }
      
      // 4. Resubir imagen optimizada
      const { error: uploadError } = await supabase.storage
        .from(img.bucket)
        .upload(img.path, optimizedFile, {
          upsert: true,
          cacheControl: '3600'
        })
      
      if (uploadError) {
        console.error(`❌ Error resubiendo ${img.path}:`, uploadError)
        errors++
        continue
      }
      
      totalSaved += (originalSize - optimizedSize)
      
      console.log(
        `✅ Optimizada: ${img.path}`,
        `| Original: ${(originalSize / 1024).toFixed(2)}KB`,
        `| Optimizada: ${(optimizedSize / 1024).toFixed(2)}KB`,
        `| Reducción: ${reduction.toFixed(1)}%`
      )
      
      processed++
      
      // Pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error procesando ${img.path}:`, error)
      errors++
    }
  }
  
  console.log('\n📊 RESUMEN:')
  console.log(`✅ Procesadas exitosamente: ${processed}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`💾 Espacio ahorrado: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`)
}

// Ejecutar
optimizeExistingImages()
  .then(() => console.log('✅ Proceso completado'))
  .catch(err => console.error('❌ Error en el proceso:', err))
*/


-- ========================================
-- PASO 4: Verificar resultados
-- ========================================

-- Después de ejecutar el script TypeScript, verificar que todo funciona correctamente
-- Las imágenes deberían ser accesibles con las mismas rutas pero con menor tamaño

-- Query para verificar que todas las rutas siguen siendo válidas
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN path IS NOT NULL THEN 1 END) as con_path,
  COUNT(CASE WHEN bucket IS NOT NULL THEN 1 END) as con_bucket
FROM (
  SELECT 'proyecto-logo' as tipo, logo->>'path' as path, logo->>'bucket' as bucket FROM proyectos WHERE logo IS NOT NULL
  UNION ALL
  SELECT 'proyecto-render', render->>'path', render->>'bucket' FROM proyectos WHERE render IS NOT NULL
  UNION ALL
  SELECT 'unidad-render', uni->'render'->>'path', uni->'render'->>'bucket' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'render' IS NOT NULL
  UNION ALL
  SELECT 'unidad-isometrico', uni->'isometrico'->>'path', uni->'isometrico'->>'bucket' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'isometrico' IS NOT NULL
  UNION ALL
  SELECT 'unidad-plano', uni->'plano'->>'path', uni->'plano'->>'bucket' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni WHERE p.unidades IS NOT NULL AND uni->'plano' IS NOT NULL
  UNION ALL
  SELECT 'unidad-imagenes', img->>'path', img->>'bucket' FROM proyectos p, jsonb_array_elements(p.unidades) AS uni, jsonb_array_elements(uni->'imagenes') AS img WHERE p.unidades IS NOT NULL AND uni->'imagenes' IS NOT NULL
  UNION ALL
  SELECT 'propiedad-imagenes', img->>'path', img->>'bucket' FROM propiedades, jsonb_array_elements(imagenes) AS img WHERE imagenes IS NOT NULL
) t
GROUP BY tipo;
