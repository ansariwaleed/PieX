'use client'

import { useState } from 'react'

interface CopyQuestionButtonProps {
  textToCopy: string
  label?: string
}

export default function CopyQuestionButton({ textToCopy, label = 'Copy Question' }: CopyQuestionButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback if clipboard API unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: copied ? '#34d399' : 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.72rem',
        fontWeight: 500,
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        transition: 'all 0.2s ease',
      }}
      title="Copy problem statement / questions for offline practice"
    >
      <span>{copied ? '✓' : '📋'}</span>
      <span>{copied ? 'Copied to clipboard' : label}</span>
    </button>
  )
}
