// src/utils/image.utils.ts

/**
 * Opciones para optimizar imágenes
 */
export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Redimensiona y optimiza una imagen
 * @param file El archivo de imagen original
 * @param options Opciones de optimización
 * @returns Blob optimizado de la imagen
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        // Crear canvas para redimensionar
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto 2d del canvas'))
          return
        }

        // Usar algoritmo de interpolación de alta calidad
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir a blob con compresión
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('No se pudo convertir canvas a blob'))
            }
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Verifica si un archivo es una imagen
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Obtiene el tamaño de un archivo en KB
 */
export function getFileSizeKB(file: File | Blob): number {
  return file.size / 1024
}

/**
 * Procesa y optimiza un archivo si es una imagen
 * Si no es imagen, retorna el archivo original
 */
export async function processFile(
  file: File,
  options?: ImageOptimizationOptions
): Promise<File> {
  // Si no es imagen, retornar original
  if (!isImageFile(file)) {
    return file
  }

  try {
    const optimizedBlob = await optimizeImage(file, options)
    
    // Crear nuevo File con el blob optimizado
    const optimizedFile = new File(
      [optimizedBlob],
      file.name,
      { type: `image/${options?.format || 'jpeg'}` }
    )

    console.log(
      `Imagen optimizada: ${file.name}`,
      `Original: ${getFileSizeKB(file).toFixed(2)}KB`,
      `Optimizada: ${getFileSizeKB(optimizedFile).toFixed(2)}KB`,
      `Reducción: ${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}%`
    )

    return optimizedFile
  } catch (error) {
    console.error('Error optimizando imagen, usando original:', error)
    return file
  }
}

/**
 * Procesa múltiples archivos en paralelo
 */
export async function processFiles(
  files: File[],
  options?: ImageOptimizationOptions
): Promise<File[]> {
  return Promise.all(files.map(file => processFile(file, options)))
}

/**
 * Genera thumbnail de una imagen
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 200
): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.7,
    format: 'jpeg'
  })
}
