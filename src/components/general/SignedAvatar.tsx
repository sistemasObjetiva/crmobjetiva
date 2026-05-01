// src/components/general/SignedAvatar.tsx
import { useEffect, useState, forwardRef } from 'react'
import { Avatar, CircularProgress } from '@mui/material'
import { getSignedUrl } from '../../hooks/useUtilsFunctions'
import { Document } from '../../config/types'

interface SignedAvatarProps {
  value: Document
  alt?: string
  sx?: any
  onClick?: () => void
  [key: string]: any // Para permitir props adicionales
}

const SignedAvatar = forwardRef<HTMLDivElement, SignedAvatarProps>(
  ({ value, alt, sx, onClick, ...otherProps }, ref) => {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const path = value?.path
    const bucket = value?.bucket

    useEffect(() => {
      let mounted = true
      if (path && bucket) {
        setLoading(true)
        getSignedUrl(path, bucket)
          .then(signed => {
            if (mounted) setUrl(signed)
          })
          .catch(() => {
            if (mounted) setUrl(null)
          })
          .finally(() => {
            if (mounted) setLoading(false)
          })
      } else {
        setUrl(null)
      }
      return () => { mounted = false }
    }, [path, bucket])

    if (loading) {
      return <Avatar ref={ref} sx={sx} {...otherProps}><CircularProgress size={24} /></Avatar>
    }
    return (
      <Avatar
        ref={ref}
        src={url ?? undefined}
        alt={alt}
        sx={sx}
        onClick={onClick}
        {...otherProps}
      />
    )
  }
)

SignedAvatar.displayName = 'SignedAvatar'

export default SignedAvatar
