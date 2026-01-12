/**
 * Script para optimizar imágenes existentes en Supabase Storage
 * 
 * USO:
 * 1. npm install tsx (si no lo tienes)
 * 2. tsx scripts/optimize-existing-images.ts
 * 
 * El script:
 * - Descarga cada imagen del storage
 * - La optimiza usando Canvas API
 * - La vuelve a subir reemplazando la original
 * - Mantiene las mismas rutas, solo reduce el tamaño
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('   REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY deben estar definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageRecord {
  tipo: string
  entidad_id: string
  entidad_nombre: string
  campo: string
  path: string
  bucket: string
}

// Función de optimización (duplicada aquí para no depender del frontend)
async function optimizeImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'webp' | 'png'
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto del canvas'))
      return
    }

    img.onload = () => {
      let { width, height } = img

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height
        if (width > height) {
          width = maxWidth
          height = width / aspectRatio
        } else {
          height = maxHeight
          width = height * aspectRatio
        }
      }

      canvas.width = width
      canvas.height = height

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo crear el blob'))
            return
          }

          const mimeType = `image/${format}`
          const optimizedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now()
          })

          resolve(optimizedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = URL.createObjectURL(file)
  })
}

async function fetchAllImages(): Promise<ImageRecord[]> {
  console.log('🔍 Identificando todas las imágenes en la base de datos...\n')

  // Query para obtener todas las imágenes
  const query = `
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
    SELECT 
      'unidad' as tipo,
      u.id::text,
      u.nombre,
      'render' as campo,
      (u.render->>'path')::text,
      (u.render->>'bucket')::text
    FROM unidades u
    WHERE u.render IS NOT NULL 
      AND u.render->>'path' IS NOT NULL
    UNION ALL
    SELECT 
      'unidad' as tipo,
      u.id::text,
      u.nombre,
      'isometrico' as campo,
      (u.isometrico->>'path')::text,
      (u.isometrico->>'bucket')::text
    FROM unidades u
    WHERE u.isometrico IS NOT NULL 
      AND u.isometrico->>'path' IS NOT NULL
    UNION ALL
    SELECT 
      'unidad' as tipo,
      u.id::text,
      u.nombre,
      'plano' as campo,
      (u.plano->>'path')::text,
      (u.plano->>'bucket')::text
    FROM unidades u
    WHERE u.plano IS NOT NULL 
      AND u.plano->>'path' IS NOT NULL
    UNION ALL
    SELECT 
      'unidad' as tipo,
      u.id::text,
      u.nombre,
      'imagenes_' || (row_number() OVER (PARTITION BY u.id ORDER BY img_elem.ordinality))::text as campo,
      (img_elem.value->>'path')::text,
      (img_elem.value->>'bucket')::text
    FROM unidades u
    CROSS JOIN LATERAL jsonb_array_elements(u.imagenes) WITH ORDINALITY AS img_elem(value, ordinality)
    WHERE u.imagenes IS NOT NULL 
      AND jsonb_array_length(u.imagenes) > 0
      AND img_elem.value->>'path' IS NOT NULL
    UNION ALL
    SELECT 
      'propiedad' as tipo,
      pr.id::text,
      pr."tituloPropiedad",
      'imagenes_' || (row_number() OVER (PARTITION BY pr.id ORDER BY img_elem.ordinality))::text as campo,
      (img_elem.value->>'path')::text,
      (img_elem.value->>'bucket')::text
    FROM propiedades pr
    CROSS JOIN LATERAL jsonb_array_elements(pr.imagenes) WITH ORDINALITY AS img_elem(value, ordinality)
    WHERE pr.imagenes IS NOT NULL 
      AND jsonb_array_length(pr.imagenes) > 0
      AND img_elem.value->>'path' IS NOT NULL
    ORDER BY tipo, entidad_id, campo
  `

  const { data, error } = await supabase.rpc('exec_sql', { sql: query })

  if (error) {
    // Si no existe la función exec_sql, intentar con una consulta directa
    console.log('⚠️  Función exec_sql no disponible, ejecuta la query SQL manualmente')
    console.log('   y pega los resultados en un archivo images.json')
    return []
  }

  return data || []
}

async function optimizeExistingImages(dryRun: boolean = false) {
  console.log('════════════════════════════════════════════════════════')
  console.log('  🖼️  OPTIMIZACIÓN DE IMÁGENES EXISTENTES')
  console.log('════════════════════════════════════════════════════════\n')

  if (dryRun) {
    console.log('🧪 MODO DRY-RUN: No se realizarán cambios reales\n')
  }

  // Obtener todas las imágenes
  const images = await fetchAllImages()

  if (images.length === 0) {
    console.log('⚠️  No se encontraron imágenes o no se pudo ejecutar la query')
    console.log('   Ejecuta manualmente la query SQL en Supabase y guarda los resultados')
    return
  }

  console.log(`📊 Total de imágenes encontradas: ${images.length}\n`)

  // Estadísticas por tipo
  const stats = images.reduce((acc, img) => {
    acc[img.tipo] = (acc[img.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📈 Distribución por tipo:')
  Object.entries(stats).forEach(([tipo, count]) => {
    console.log(`   ${tipo}: ${count} imágenes`)
  })
  console.log('')

  let processed = 0
  let skipped = 0
  let errors = 0
  let totalOriginalSize = 0
  let totalOptimizedSize = 0

  for (const img of images) {
    try {
      const progress = `[${processed + skipped + errors + 1}/${images.length}]`
      console.log(`${progress} 📦 ${img.tipo}/${img.campo}: ${img.path}`)

      // 1. Descargar imagen original
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(img.bucket)
        .download(img.path)

      if (downloadError) {
        console.log(`   ❌ Error descargando: ${downloadError.message}`)
        errors++
        continue
      }

      const originalSize = downloadData.size
      totalOriginalSize += originalSize

      // Verificar si es una imagen
      if (!downloadData.type.startsWith('image/')) {
        console.log(`   ⏭️  No es imagen (${downloadData.type})`)
        skipped++
        continue
      }

      // 2. Optimizar imagen
      const file = new File([downloadData], img.path.split('/').pop() || 'image.jpg', {
        type: downloadData.type
      })

      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      })

      const optimizedSize = optimizedFile.size
      totalOptimizedSize += optimizedSize
      const reduction = ((1 - optimizedSize / originalSize) * 100)

      // Si la reducción es menor al 5%, no vale la pena
      if (reduction < 5) {
        console.log(`   ⏭️  Reducción mínima (${reduction.toFixed(1)}%), saltando`)
        totalOptimizedSize = totalOptimizedSize - optimizedSize + originalSize
        skipped++
        continue
      }

      console.log(
        `   ✨ Optimizada: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction.toFixed(1)}%)`
      )

      // 3. Resubir imagen optimizada (si no es dry-run)
      if (!dryRun) {
        const { error: uploadError } = await supabase.storage
          .from(img.bucket)
          .upload(img.path, optimizedFile, {
            upsert: true,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.log(`   ❌ Error resubiendo: ${uploadError.message}`)
          errors++
          continue
        }

        console.log(`   ✅ Resubida exitosamente`)
      }

      processed++

      // Pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.log(`   ❌ Error procesando: ${error}`)
      errors++
    }

    console.log('')
  }

  // Resumen final
  console.log('════════════════════════════════════════════════════════')
  console.log('  📊 RESUMEN FINAL')
  console.log('════════════════════════════════════════════════════════\n')
  console.log(`✅ Optimizadas: ${processed}`)
  console.log(`⏭️  Saltadas: ${skipped}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`📊 Total procesadas: ${processed + skipped + errors}/${images.length}`)
  console.log('')
  console.log(`💾 Tamaño original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`💾 Tamaño optimizado total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`💰 Espacio ahorrado: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)}MB`)
  console.log(`📉 Reducción promedio: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)}%`)
  console.log('')
  console.log('════════════════════════════════════════════════════════\n')
}

// Ejecutar
const dryRun = process.argv.includes('--dry-run')

optimizeExistingImages(dryRun)
  .then(() => {
    console.log('✅ Proceso completado exitosamente')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Error en el proceso:', err)
    process.exit(1)
  })
