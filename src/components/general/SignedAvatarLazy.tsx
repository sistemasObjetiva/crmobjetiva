// SignedAvatarLazy.tsx (o dentro del mismo archivo)
import React, { useEffect, useRef, useState } from 'react'
import SignedAvatar from '../general/SignedAvatar'
import { Document } from '../../config/types'

export const SignedAvatarLazy: React.FC<{
  doc?: Document
  alt?: string
  size?: number
}> = ({ doc, alt, size = 24 }) => {
  const [visible, setVisible] = useState(false)
  const contRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!contRef.current) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setVisible(true)),
      { rootMargin: '200px' }
    )
    io.observe(contRef.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={contRef} style={{ width: size, height: size }}>
      {visible && doc ? (
        <SignedAvatar
          value={doc}
          alt={alt}
          sx={{ width: size, height: size }}
          // imgProps los maneja internamente Avatar; no hace falta pasarlos aquí
        />
      ) : (
        <div style={{ width: size, height: size }} />
      )}
    </div>
  )
}
