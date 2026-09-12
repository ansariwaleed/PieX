'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './interactive.module.css'

interface NodeItem {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  label: string
}

const ROUND_DATA = [
  {
    id: 'oa',
    title: 'Round 1: Online Assessment',
    category: 'Automated Technical Screening',
    duration: '90 mins',
    format: '2-3 DSA Problems + Core CS MCQs',
    focus: 'Data structures, algorithm efficiency, edge cases',
    difficulty: 'High',
    questions: [
      'Given an array of stock prices, determine the maximum achievable profit with at most k non-overlapping transactions in O(nk) time.',
      'Design an in-memory sliding window rate limiter supporting high-concurrency requests with strict per-second quotas.',
      'Find the shortest subarray with sum at least k in an array containing both positive and negative values.'
    ],
    insight: 'Over 75% of candidate rejections occur in this round due to unhandled boundary inputs and quadratic time complexity.'
  },
  {
    id: 'tech1',
    title: 'Round 2: Technical & Data Structures',
    category: '1:1 Live Coding & Problem Solving',
    duration: '60 mins',
    format: 'Interactive Pair Programming',
    focus: 'Trees, graphs, dynamic programming, code modularity',
    difficulty: 'Very High',
    questions: [
      'Implement an LRU cache with concurrent thread-safe reads and exclusive writes using reader-writer locks.',
      'Given a directed acyclic graph representing task dependencies, find all valid build orders and detect any circular dependencies.',
      'Design an efficient data structure that supports insert, delete, getRandom, and findMedian in O(1) or O(log n) time.'
    ],
    insight: 'Interviewers prioritize candidate communication, trade-off analysis, and test case articulation before writing code.'
  },
  {
    id: 'sys',
    title: 'Round 3: System Architecture',
    category: 'High-Level Distributed Design',
    duration: '60 mins',
    format: 'Architectural Blueprint Discussion',
    focus: 'Microservices, sharding, caching tiers, fault tolerance',
    difficulty: 'Advanced',
    questions: [
      'Design a globally distributed URL shortening service handling 50,000 writes/sec and 2 billion daily reads with 99.99% availability.',
      'Architect a real-time collaborative document editing system with operational transformation and conflict resolution.',
      'Design an event-driven notification dispatch pipeline supporting push, email, and SMS with deduplication.'
    ],
    insight: 'Focus on clarifying non-functional constraints (throughput, latency, storage growth) before proposing topology.'
  },
  {
    id: 'hr',
    title: 'Round 4: Behavioral & Culture Fit',
    category: 'Hiring Manager & Leadership Evaluation',
    duration: '45 mins',
    format: 'Scenario-Based Discussion',
    focus: 'Ownership, conflict resolution, technical trade-offs',
    difficulty: 'Evaluative',
    questions: [
      'Describe a critical production incident caused by an unforeseen edge case. How did you investigate, mitigate, and document it?',
      'Tell me about a time you strongly disagreed with an engineering decision made by a team lead. How did you handle the discussion?',
      'How do you balance meeting tight release deadlines with paying down technical debt and writing comprehensive tests?'
    ],
    insight: 'Use the STAR method (Situation, Task, Action, Result) with quantified outcomes to deliver credible answers.'
  }
]

export default function InteractivePanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeRound, setActiveRound] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false })

  const currentRound = ROUND_DATA[activeRound]
  const currentQuestion = currentRound.questions[questionIndex % currentRound.questions.length]

  // Reset question index when switching rounds
  useEffect(() => {
    setQuestionIndex(0)
  }, [activeRound])

  // Minimal Ambient Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    const topics = [
      'Algorithms',
      'System Design',
      'Distributed Caches',
      'Database Sharding',
      'Concurrency',
      'Graphs & Trees',
      'Load Balancing',
      'Microservices',
      'Data Pipelines'
    ]

    const nodes: NodeItem[] = topics.map((label, i) => {
      const angle = (i / topics.length) * Math.PI * 2
      const radius = 130 + (i % 3) * 45
      return {
        x: width / 2 + Math.cos(angle) * radius,
        y: height * 0.32 + Math.sin(angle) * (radius * 0.65),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 3,
        label
      }
    })

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Very subtle grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      const gridSize = 45
      for (let x = 20; x < width; x += gridSize) {
        for (let y = 20; y < height; y += gridSize) {
          ctx.fillRect(x, y, 1.5, 1.5)
        }
      }

      // Update nodes
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        const topBound = 20
        const bottomBound = height * 0.65
        if (node.x < 30) { node.x = 30; node.vx *= -1 }
        if (node.x > width - 30) { node.x = width - 30; node.vx *= -1 }
        if (node.y < topBound) { node.y = topBound; node.vy *= -1 }
        if (node.y > bottomBound) { node.y = bottomBound; node.vy *= -1 }

        if (mousePos.active) {
          const dx = mousePos.x - node.x
          const dy = mousePos.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140 && dist > 10) {
            const pull = (140 - dist) / 140 * 0.02
            node.vx += (dx / dist) * pull
            node.vy += (dy / dist) * pull
          }
        }
      })

      // Connecting lines between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.25
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.lineWidth = 1
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Cursor connection line
      if (mousePos.active) {
        nodes.forEach(node => {
          const dx = mousePos.x - node.x
          const dy = mousePos.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.4
            ctx.beginPath()
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`
            ctx.lineWidth = 1
            ctx.moveTo(mousePos.x, mousePos.y)
            ctx.lineTo(node.x, node.y)
            ctx.stroke()
          }
        })
      }

      // Draw node points and typography
      nodes.forEach(node => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        ctx.font = '500 9px "JetBrains Mono", monospace'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.fillText(node.label, node.x + 8, node.y + 3)
      })

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
          <div className={styles.headerTitle}>Verified Placement Archive</div>
          <div className={styles.headerSubtitle}>Real interview stages and questions from hiring drives</div>
        </div>
        <div className={styles.headerBadge}>100% Peer Verified</div>
      </div>

      {/* Main Content Deck */}
      <div className={styles.contentDeck}>
        {/* Round Switcher Tabs */}
        <div className={styles.tabsRow}>
          {ROUND_DATA.map((round, idx) => (
            <button
              key={round.id}
              type="button"
              className={`${styles.tabBtn} ${activeRound === idx ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveRound(idx)}
            >
              <span className={styles.tabStage}>Stage {idx + 1}</span>
              <span className={styles.tabLabel}>
                {idx === 0 ? 'Coding OA' : idx === 1 ? 'Technical 1:1' : idx === 2 ? 'System Design' : 'Behavioral'}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Round Card */}
        <div className={styles.roundCard}>
          <div className={styles.roundMetaRow}>
            <div>
              <div className={styles.roundTitle}>{currentRound.title}</div>
              <div className={styles.roundCategory}>{currentRound.category}</div>
            </div>
            <div className={styles.roundStats}>
              <span>{currentRound.duration}</span>
              <span className={styles.bulletDot}>•</span>
              <span>{currentRound.difficulty} Difficulty</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Assessment Focus:</span>
            <span className={styles.infoValue}>{currentRound.focus}</span>
          </div>

          {/* Verified Question Preview */}
          <div className={styles.questionBox}>
            <div className={styles.questionHeader}>
              <span className={styles.questionTitle}>Sample Verified Interview Question</span>
              <button
                type="button"
                className={styles.nextQuestionBtn}
                onClick={() => setQuestionIndex(i => i + 1)}
              >
                Next Example →
              </button>
            </div>
            <p className={styles.questionBody}>{currentQuestion}</p>
          </div>

          {/* Placement Tip */}
          <div className={styles.insightBox}>
            <span className={styles.insightLabel}>Placement Advice:</span>
            <span className={styles.insightText}>{currentRound.insight}</span>
          </div>
        </div>

        {/* Clean Footer Note */}
        <div className={styles.deckFooter}>
          <span>Verified records submitted by candidates and validated by campus placement cells.</span>
        </div>
      </div>
    </div>
  )
}
