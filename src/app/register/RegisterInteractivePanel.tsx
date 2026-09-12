'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './registerInteractive.module.css'

interface DomainInfo {
  id: string
  name: string
  roleTitle: string
  ctcRange: string
  roundsCount: string
  corePillars: string
  insight: string
}

const DOMAINS: DomainInfo[] = [
  {
    id: 'dist',
    name: 'Distributed Systems',
    roleTitle: 'Systems & Backend Engineer',
    ctcRange: '₹28 - 54 LPA',
    roundsCount: '4 Interview Rounds',
    corePillars: 'Concurrency, Partitioning, Caching, CAP Theorem',
    insight: 'Strong candidates stand out by clearly analyzing latency, consistency trade-offs, and failure recovery.'
  },
  {
    id: 'quant',
    name: 'Quantitative Trading',
    roleTitle: 'Quantitative Technologist',
    ctcRange: '₹45 - 85 LPA',
    roundsCount: '5 Interview Rounds',
    corePillars: 'Modern C++, Memory Layout, Probability, Advanced DSA',
    insight: 'Evaluations emphasize sub-microsecond cache efficiency and mathematical problem solving speed.'
  },
  {
    id: 'ai',
    name: 'Machine Learning & Data',
    roleTitle: 'ML Platform & Infrastructure',
    ctcRange: '₹30 - 58 LPA',
    roundsCount: '4 Interview Rounds',
    corePillars: 'Model Serving, Vector Search, Distributed Training',
    insight: 'Expect detailed discussions on inference latency, distributed checkpoints, and data pipelines.'
  },
  {
    id: 'cloud',
    name: 'Full-Stack Architecture',
    roleTitle: 'Full-Stack Product Engineer',
    ctcRange: '₹22 - 42 LPA',
    roundsCount: '3 Interview Rounds',
    corePillars: 'Async Architecture, State Management, API Contracts',
    insight: 'Focus is placed on end-to-end telemetry, edge compute, and production error boundary design.'
  }
]

export default function RegisterInteractivePanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeDomain, setActiveDomain] = useState(0)
  const [prepProblems, setPrepProblems] = useState(175)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false })

  const currentDomain = DOMAINS[activeDomain]

  // Calculate readiness score
  const readinessPercentage = Math.min(96, Math.max(30, Math.round((prepProblems / 400) * 100)))
  const readinessLabel =
    readinessPercentage >= 80
      ? 'Strong Placement Readiness'
      : readinessPercentage >= 55
      ? 'Solid Core Foundation'
      : 'Developing Practical Skills'

  // Minimalist Ambient Orbital Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    let angle = 0

    const rings = [70, 130, 190]
    const orbitalPoints = [
      { ring: 0, angle: 0.5, speed: 0.005, label: 'Core DSA' },
      { ring: 0, angle: 3.2, speed: -0.004, label: 'OOP & LLD' },
      { ring: 1, angle: 1.4, speed: 0.003, label: 'System Architecture' },
      { ring: 1, angle: 4.6, speed: -0.0035, label: 'Databases' },
      { ring: 2, angle: 0.8, speed: 0.002, label: 'Peer Reports' },
      { ring: 2, angle: 2.7, speed: -0.0025, label: 'TPC Verified' }
    ]

    const render = () => {
      angle += 0.005
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height * 0.32

      // Subtle background grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)'
      const gridSize = 45
      for (let x = 20; x < width; x += gridSize) {
        for (let y = 20; y < height; y += gridSize) {
          ctx.fillRect(x, y, 1.5, 1.5)
        }
      }

      // Elegant concentric orbital guide rings
      rings.forEach(r => {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
        ctx.lineWidth = 1
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      })

      // Center node
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'var(--accent)'
      ctx.fill()

      // Render orbital points
      orbitalPoints.forEach(pt => {
        pt.angle += pt.speed
        const r = rings[pt.ring]
        const px = centerX + Math.cos(pt.angle) * r
        const py = centerY + Math.sin(pt.angle) * r

        // Delicate ray to center
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(px, py)
        ctx.stroke()

        // Point
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Label
        ctx.font = '500 8.5px "JetBrains Mono", monospace'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.fillText(pt.label, px + 7, py + 3)
      })

      // Subtle mouse interaction line
      if (mousePos.active) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'
        ctx.lineWidth = 1
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(mousePos.x, mousePos.y)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [mousePos])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    })
  }

  const handleMouseLeave = () => {
    setMousePos(prev => ({ ...prev, active: false }))
  }

  return (
    <div
      className={styles.container}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Top Header */}
      <div className={styles.topHeader}>
        <div>
          <div className={styles.headerTitle}>Placement Career Benchmarks</div>
          <div className={styles.headerSubtitle}>Verified compensation and interview stages across disciplines</div>
        </div>
        <div className={styles.headerBadge}>TPC Validated</div>
      </div>

      {/* Main Content Deck */}
      <div className={styles.contentDeck}>
        {/* Domain Switcher */}
        <div className={styles.tabsRow}>
          {DOMAINS.map((domain, idx) => (
            <button
              key={domain.id}
              type="button"
              className={`${styles.tabBtn} ${activeDomain === idx ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveDomain(idx)}
            >
              <span className={styles.tabIndex}>0{idx + 1}</span>
              <span className={styles.tabLabel}>{domain.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Domain Card */}
        <div className={styles.domainCard}>
          <div className={styles.domainMetaRow}>
            <div>
              <div className={styles.domainTitle}>{currentDomain.name}</div>
              <div className={styles.domainRole}>{currentDomain.roleTitle}</div>
            </div>
            <div className={styles.domainStats}>
              <span className={styles.ctcValue}>{currentDomain.ctcRange}</span>
              <span className={styles.bulletDot}>•</span>
              <span>{currentDomain.roundsCount}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Evaluation Focus:</span>
            <span className={styles.infoValue}>{currentDomain.corePillars}</span>
          </div>

          {/* Interactive Preparation Estimator */}
          <div className={styles.estimatorBox}>
            <div className={styles.estimatorHeader}>
              <span className={styles.estimatorTitle}>Preparation Readiness Estimator</span>
              <span className={styles.readinessStatusBadge}>{readinessLabel}</span>
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderLabelRow}>
                <span className={styles.sliderLabel}>Interview Problems & System Scenarios Mastered:</span>
                <span className={styles.sliderValue}>{prepProblems} Problems</span>
              </div>
              <input
                type="range"
                min="40"
                max="400"
                value={prepProblems}
                onChange={e => setPrepProblems(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            <div className={styles.readinessBar}>
              <div
                className={styles.readinessFill}
                style={{ width: `${readinessPercentage}%` }}
              />
              <span className={styles.readinessText}>
                Estimated Shortlist Confidence: {readinessPercentage}%
              </span>
            </div>
          </div>

          {/* Insight Advice */}
          <div className={styles.insightBox}>
            <span className={styles.insightLabel}>Preparation Advice:</span>
            <span className={styles.insightText}>{currentDomain.insight}</span>
          </div>
        </div>

        {/* Clean Footer Note */}
        <div className={styles.deckFooter}>
          <span>Join students and coordinators sharing verified placement interview reports.</span>
        </div>
      </div>
    </div>
  )
}
