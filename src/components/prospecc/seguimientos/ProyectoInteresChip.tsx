
import { Box, Chip } from '@mui/material'
import SignedAvatar from '../../../components/general/SignedAvatar'

export default function ProyectosInteresChips({
  ids, proyectos, propiedades,
}: {
  ids?: string[]
  proyectos: any[]
  propiedades: any[]
}) {
  if (!ids || ids.length === 0) return null
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {ids.map((id) => {
        const proy = proyectos.find((x: any) => x.id === id)
        if (proy) {
          return (
            <Chip
              key={`proy-${id}`}
              label={proy.nombre}
              avatar={
                proy.logo ? <SignedAvatar value={proy.logo} alt={proy.nombre} sx={{ width: 24, height: 24 }} /> : undefined
              }
              size="small"
              sx={{ mr: 0.5, bgcolor: 'transparent' }}
            />
          )
        }
        const prop = propiedades.find((x: any) => x.id === id)
        if (prop) {
          return (
            <Chip
              key={`prop-${id}`}
              label={prop.tituloPropiedad}
              avatar={
                prop.imagenes?.length
                  ? <SignedAvatar value={prop.imagenes[0]} alt={prop.tituloPropiedad} sx={{ width: 24, height: 24 }} />
                  : undefined
              }
              size="small"
              sx={{ mr: 0.5, bgcolor: 'transparent' }}
            />
          )
        }
        return null
      })}
    </Box>
  )
}
