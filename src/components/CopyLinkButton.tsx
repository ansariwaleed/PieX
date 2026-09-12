'use client'

import { useState } from 'react'

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: copied ? 'var(--accent)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0.45rem 0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
      title="Copy Link to Clipboard"
    >
      <span>{copied ? '✓' : '⎘'}</span>
      <span>{copied ? 'LINK COPIED' : 'SHARE EXPERIENCE'}</span>
    </button>
  )
}
