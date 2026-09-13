'use client'

import React, { useState } from 'react'
import styles from './authVisual.module.css'

interface AuthVisualShowcaseProps {
  variant?: 'login' | 'register'
}

export default function AuthVisualShowcase(_props?: AuthVisualShowcaseProps) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 350, y: 350 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div
      className={styles.showcaseContainer}
      aria-hidden="true"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static Floral Image Layer (Breathing removed) */}
      <div className={styles.imageLayer} />

      {/* Cinematic Dark Gradient Vignette Overlay */}
      <div className={styles.vignetteLayer} />

      {/* Fine Architectural Grid Overlay */}
      <div className={styles.gridOverlay} />

      {/* Interactive Cursor Hover Spotlight Glow */}
      <div
        className={styles.spotlightLayer}
        style={{
          background: isHovered
            ? `radial-gradient(circle 380px at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.22), rgba(254, 240, 138, 0.08) 40%, transparent 75%)`
            : 'radial-gradient(circle 420px at 50% 50%, rgba(212, 175, 55, 0.1), transparent 75%)',
          opacity: isHovered ? 1 : 0.6
        }}
      />
    </div>
  )
}
