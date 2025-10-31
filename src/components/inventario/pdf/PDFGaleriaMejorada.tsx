import { View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'

export default function PDFGaleriaCompacta({
  renderUrl, isometricoUrl, planoUrl, galeriaUrls = [],
}: {
  renderUrl?: string
  isometricoUrl?: string
  planoUrl?: string
  galeriaUrls?: string[]
}) {
  // Verificar qué imágenes tenemos disponibles
  const hasPlano = !!planoUrl
  const hasRender = !!renderUrl
  const hasIsometrico = !!isometricoUrl
  const hasGaleria = galeriaUrls.length > 0

  if (!hasPlano && !hasRender && !hasIsometrico && !hasGaleria) {
    return null
  }

  // Con toda la página disponible, podemos hacer las imágenes mucho más grandes
  const showGallery = galeriaUrls.slice(0, 6) // hasta 6 imágenes adicionales
  const hiddenCount = galeriaUrls.length - showGallery.length

  return (
    <View style={styles.galleryWrapper}>
      <Text style={styles.galleryTitle}>Planos e imágenes de la unidad</Text>
      
      {/* PLANO PRINCIPAL - GRANDE si existe */}
      {hasPlano && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image src={planoUrl} style={{
            width: 480,
            height: 320,
            objectFit: 'contain',
            backgroundColor: '#ffffff',
          }} />
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 14, 
            color: '#0f766e', 
            fontWeight: 700,
            marginTop: 8 
          }}>Plano Arquitectónico</Text>
        </View>
      )}

      {/* RENDER E ISOMÉTRICO - Más grandes en fila */}
      {(hasRender || hasIsometrico) && (
        <View style={{ flexDirection: 'row', marginBottom: 20, justifyContent: 'space-around' }}>
          {hasRender && (
            <View style={{ alignItems: 'center', width: 250 }}>
              <Image src={renderUrl} style={{
                width: 240,
                height: 180,
                objectFit: 'contain',
                backgroundColor: '#f9fafb',
              }} />
              <Text style={{ 
                textAlign: 'center', 
                fontSize: 12, 
                color: '#374151', 
                fontWeight: 600,
                marginTop: 6 
              }}>Render 3D</Text>
            </View>
          )}
          {hasIsometrico && (
            <View style={{ alignItems: 'center', width: 250 }}>
              <Image src={isometricoUrl} style={{
                width: 240,
                height: 180,
                objectFit: 'contain',
                backgroundColor: '#f9fafb',
              }} />
              <Text style={{ 
                textAlign: 'center', 
                fontSize: 12, 
                color: '#374151', 
                fontWeight: 600,
                marginTop: 6 
              }}>Vista Isométrica</Text>
            </View>
          )}
        </View>
      )}

      {/* GALERÍA ADICIONAL - Grid 3x2 más grande */}
      {showGallery.length > 0 && (
        <>
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Vistas adicionales del proyecto
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {showGallery.map((url, i) => (
              <View key={i} style={{ width: 160, marginRight: 10, marginBottom: 10, alignItems: 'center' }}>
                <Image src={url} style={{
                  width: 150,
                  height: 110,
                  objectFit: 'contain',
                }} />
                <Text style={{ textAlign: 'center', fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                  Vista {i + 1}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Nota sobre imágenes ocultas */}
      {hiddenCount > 0 && (
        <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
          * {hiddenCount} imagen(es) adicional(es) disponible(s) por solicitud.
        </Text>
      )}
    </View>
  )
}