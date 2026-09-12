'use client'

import React, { useState, useEffect } from 'react'
import styles from './ascii.module.css'

export default function LoginAsciiArt() {
  const [timeStr, setTimeStr] = useState('00:00:00')
  const [uptime, setUptime] = useState(1482)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(now.toTimeString().split(' ')[0])
    }
    update()
    const timer = setInterval(() => {
      update()
      setUptime(prev => prev + 1)
    }, 1000)
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
          <span className={styles.headerTitle}>SECURE GATEWAY // NODE-01</span>
        </div>
        <div className={styles.headerTag}>
          SYS.CLOCK: {timeStr}
        </div>
      </div>

      {/* Central ASCII Artwork */}
      <div className={styles.asciiMainArea}>
        <div className={styles.asciiFrame}>
          <pre className={styles.asciiPre}>
{`+-------------------------------------------------------------+
|  `}<span className={styles.highlightText}>[PIEX] :: VERIFIED CAMPUS INTELLIGENCE PLATFORM</span>{`          |
|  NODE: AUTH_GATE_ALPHA // ARCHIVAL PROTOCOL ED25519         |
+-------------------------------------------------------------+
|                                                             |
|           .---------------------------------------.         |
|          /  [ SYS.CONSOLE // VERIFIED_GATEWAY ]   \\        |
|         |  +------------------------------------+  |        |
|         |  | `}<span className={styles.accentGreen}>&gt; ENCRYPTION LAYER: AES-256 GCM</span>{`   |  |        |
|         |  | `}<span className={styles.accentGreen}>&gt; TPC ROSTER STATUS: SYNCED</span>{`      |  |        |
|         |  | `}<span className={styles.accentGreen}>&gt; CANDIDATE INTEGRITY: 100%</span>{`     |  |        |
|         |  |                                    |  |        |
|         |  |     `}<span className={styles.accentCyan}>.---.     .---.     .---.</span>{`      |  |        |
|         |  |    `}<span className={styles.accentCyan}>| DSA |===| SYS |===| TPC |</span>{`     |  |        |
|         |  |     `}<span className={styles.accentCyan}>'---'     '---'     '---'</span>{`      |  |        |
|         |  |       |         |         |        |  |        |
|         |  |     `}<span className={styles.highlightText}>[###]=====[###]=====[###]</span>{`      |  |        |
|         |  |                                    |  |        |
|         |  | `}<span className={styles.dimText}>TELEMETRY STREAM: LISTENING_</span>{`      |  |        |
|         |  +------------------------------------+  |        |
|          \\________________________________________/         |
|                   \\______________________/                  |
|                   /______________________\\                  |
|                .-'                        '-.               |
|               /  [::]  [::]  [::]  [::]  [::]  \\              |
|              '----------------------------------'           |
|                                                             |
|  AUTHENTICATED REPOSITORY ACCESS RESTRICTED TO VERIFIED     |
|  STUDENTS AND INSTITUTIONAL PLACEMENT AUTHORITIES.          |
+-------------------------------------------------------------+`}
          </pre>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div className={styles.telemetryFooter}>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>System Status</span>
          <span className={styles.telemetryValue} style={{ color: '#34d399' }}>ONLINE // AUDITED</span>
        </div>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>Protocol Cipher</span>
          <span className={styles.telemetryValue}>SHA-256 / JWT</span>
        </div>
        <div className={styles.telemetryCell}>
          <span className={styles.telemetryLabel}>Node Uptime</span>
          <span className={styles.telemetryValue}>{uptime}s SESSION</span>
        </div>
      </div>
    </div>
  )
}
