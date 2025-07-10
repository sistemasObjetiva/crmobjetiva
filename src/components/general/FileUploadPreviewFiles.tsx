// src/components/general/FileUploadPreview.tsx
import React, { useEffect, useState, ChangeEvent } from 'react'
import { Typography, Box, Button, IconButton, useTheme } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import { getSignedUrl } from '../../hooks/useUtilsFunctions'
import { Document } from '../../config/types'

interface FileUploadPreviewProps {
  value?: Document | Document[]
  onChange: (file: File | File[]) => void
  onDelete?: (doc: Document) => void
  multiple?: boolean
  accept?: string
  // Aceptar número o string (por ejemplo "auto")
  width?: number | string
  height?: number | string
  disabled?: boolean
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({
  value,
  onChange,
  onDelete,
  accept = 'image/*,.pdf',
  width = 100,
  height = 100,
  multiple = false,
  disabled = false,
}) => {
  const theme = useTheme()
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const items = Array.isArray(value) ? value : value ? [value] : []
    items.forEach(val => {
      if (val.path && val.bucket && !(val.file instanceof File)) {
        getSignedUrl(val.path, val.bucket)
          .then(url => {
            if (url) setSignedUrls(prev => ({ ...prev, [val.id]: url }))
          })
          .catch(err => console.error('Error fetching signed URL:', err))
      }
    })
  }, [value])

  const items = Array.isArray(value) ? value : value ? [value] : []

  return (
    <Box>
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        disabled={disabled}
        sx={{
          textTransform: 'none',
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.dark,
          },
          mb: 1,
        }}
      >
        Subir archivo{multiple ? 's' : ''}
        <input
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (disabled) return
            const files = e.target.files
            if (files) onChange(multiple ? Array.from(files) : files[0])
          }}
        />
      </Button>

      <Box display="flex" flexWrap="wrap" gap={1}>
        {items.map(val => {
          const localUrl = val.file instanceof File ? URL.createObjectURL(val.file) : ''
          const previewUrl = localUrl || signedUrls[val.id]
          const isPDF = val.nombre.toLowerCase().endsWith('.pdf')

          // Para el contenedor, pasar width/height directamente (número o "auto")
          const containerStyles: React.CSSProperties = {
            position: 'relative',
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }

          // Para la imagen, usar estilo en lugar de props width/height fijas,
          // así "auto" funciona correctamente
          const imgStyles: React.CSSProperties = {
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            objectFit: 'cover',
            borderRadius: 4,
          }

          return (
            <Box key={val.id} sx={containerStyles}>
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(val)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 1,
                    p: 0.5,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}

              {previewUrl ? (
                isPDF ? (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    style={imgStyles}
                  >
                    <Typography variant="caption">PDF no compatible</Typography>
                  </object>
                ) : (
                  <img
                    src={previewUrl}
                    alt={val.nombre}
                    style={imgStyles}
                  />
                )
              ) : val.path ? (
                <Typography variant="caption">Cargando...</Typography>
              ) : null}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default FileUploadPreview
