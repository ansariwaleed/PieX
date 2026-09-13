'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // Complete progress bar on route/search change
  useEffect(() => {
    setProgress(100)
    const timer = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 200)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  // Instant tactile feedback on clicking internal navigational links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/api') &&
        target.target !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentPath = window.location.pathname + window.location.search
        if (href !== currentPath && href !== window.location.pathname) {
          setVisible(true)
          setProgress(25)
          const step1 = setTimeout(() => setProgress(65), 100)
          const step2 = setTimeout(() => setProgress(85), 300)
          return () => {
            clearTimeout(step1)
            clearTimeout(step2)
          }
        }
      }
    }

    document.addEventListener('click', handleLinkClick, { capture: true })
    return () => document.removeEventListener('click', handleLinkClick, { capture: true })
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '2.5px',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #d4af37 0%, #fef3c7 50%, #e2c258 100%)',
        boxShadow: '0 0 12px rgba(212, 175, 55, 0.7), 0 0 4px rgba(212, 175, 55, 0.4)',
        zIndex: 999999,
        transition: progress === 100 ? 'width 0.15s ease-out, opacity 0.2s ease 0.1s' : 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        willChange: 'width, opacity'
      }}
    />
  )
}
