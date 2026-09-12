'use client'

import React, { useState, useEffect } from 'react'
import styles from '../login/ascii.module.css'

export default function RegisterAsciiArt() {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCycle(prev => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.asciiContainer}>
      <div className={styles.pixelGridOverlay} />
      <div className={styles.scanline} />

      {/* Terminal Top Bar */}
      <div className={styles.terminalHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.statusLed} />
          <span className={styles.headerTitle}>INSTITUTIONAL DIRECTORY // TOPOLOGY</span>
        </div>
        <div className={styles.headerTag}>
          VERIFICATION: ACTIVE
        </div>
      </div>

      {/* Central ASCII Blueprint Artwork */}
      <div className={styles.asciiMainArea}>
        <div className={styles.asciiFrame}>
          <pre className={styles.asciiPre}>
{`+-------------------------------------------------------------+
|  `}<span className={styles.highlightText}>[PIEX NETWORK] :: PLACEMENT VERIFICATION TOPOLOGY</span>{`        |
|  ARCHITECTURE // DUAL-STAGE ROSTER CROSS-REFERENCING        |
+-------------------------------------------------------------+
|                                                             |
|       +====================+        +====================+  |
|       |  `}<span className={styles.accentCyan}>[STUDENT PORTAL]</span>{`  |        |  `}<span className={styles.highlightText}>[TPC CELL GATEWAY]</span>{` |  |
|       |  - Story Submission|        |  - Roster Matching |  |
|       |  - Question Archive|        |  - Offer Audit     |  |
|       +---------+----------+        +---------+----------+  |
|                 |                             |             |
|                 |      `}<span className={styles.accentGreen}>.--------------.</span>{`       |             |
|                 +----&gt;`}<span className={styles.accentGreen}>|  CRYPTO AUDIT |</span>{`&lt;------+             |
|                        `}<span className={styles.accentGreen}>'--------------'</span>{`                     |
|                               |                             |
|                               v                             |
|                   +=======================+                 |
|                   | `}<span className={styles.highlightText}>VERIFIED ARCHIVE POOL</span>{` |                 |
|                   |  100% AUTHENTIC DATA  |                 |
|                   +===========+===========+                 |
|                               |                             |
|              .----------------+----------------.            |
|              |                |                |            |
|              v                v                v            |
|         `}<span className={styles.accentCyan}>[ROUND DATA]</span>{`     `}<span className={styles.accentCyan}>[COMPENSATION]</span>{`    `}<span className={styles.accentCyan}>[BENCHMARKS]</span>{`    |
|                                                             |
|  NODE STATUS: `}<span className={styles.accentGreen}>{cycle === 0 ? 'LISTENING' : cycle === 1 ? 'INDEXING' : cycle === 2 ? 'ENCRYPTING' : 'READY'}</span>{` // HEARTBEAT: STABLE              |
+-------------------------------------------------------------+`}
          </pre>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div className={styles.telemetryFooter}>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>Placement Verification</span>
          <span className={styles.telemetryValue} style={{ color: '#34d399' }}>STRICT AUDIT</span>
        </div>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>Roster Integrity</span>
          <span className={styles.telemetryValue}>TPC-CERTIFIED</span>
        </div>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>Data Privacy</span>
          <span className={styles.telemetryValue}>ANONYMOUS // SECURE</span>
        </div>
      </div>
    </div>
  )
}
