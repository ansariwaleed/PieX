import styles from '../admin.module.css'
import { prisma } from '@/lib/prisma'

export default async function AnalyticsPage() {
  const [rounds, experiences, drives] = await Promise.all([
    prisma.interviewRound.findMany(),
    prisma.experience.findMany({ include: { drive: { include: { company: true } } } }),
    prisma.placementDrive.findMany({ include: { company: true } })
  ])

  // Aggregate round difficulty by type
  const roundStats: Record<string, { count: number; totalDifficulty: number; totalDuration: number }> = {}
  const topicCounts: Record<string, number> = {}

  rounds.forEach((r) => {
    if (!roundStats[r.type]) {
      roundStats[r.type] = { count: 0, totalDifficulty: 0, totalDuration: 0 }
    }
    roundStats[r.type].count += 1
    roundStats[r.type].totalDifficulty += r.difficulty
    roundStats[r.type].totalDuration += r.durationMinutes

    r.topics.forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1
    })
  })

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const selectedCount = experiences.filter(e => e.result === 'Selected').length
  const totalCount = experiences.length || 1
  const selectionRate = Math.round((selectedCount / totalCount) * 100)

  return (
    <>
      <h1 className={styles.pageTitle}>Campus Placement Intelligence</h1>
      <p className={styles.pageSubtitle}>Aggregated interview analytics & patterns across recruiting drives</p>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[CONVERSION]</div>
          <div className={styles.statValue}>{selectionRate}%</div>
          <div className={styles.statLabel}>Offer Rate (Reported)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[DURATION]</div>
          <div className={styles.statValue}>
            {Math.round(rounds.reduce((a, b) => a + b.durationMinutes, 0) / (rounds.length || 1))}m
          </div>
          <div className={styles.statLabel}>Avg Round Duration</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[DIFFICULTY]</div>
          <div className={styles.statValue}>
            {(rounds.reduce((a, b) => a + b.difficulty, 0) / (rounds.length || 1)).toFixed(1)}/5
          </div>
          <div className={styles.statLabel}>Avg Round Difficulty</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[TAXONOMY]</div>
          <div className={styles.statValue}>{Object.keys(topicCounts).length}</div>
          <div className={styles.statLabel}>Unique Topics Mapped</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Interview Round Breakdown</h2>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Round Type</th>
              <th>Occurrences</th>
              <th>Avg Duration</th>
              <th>Avg Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(roundStats).map(([type, stat]) => (
              <tr key={type}>
                <td className={styles.studentName}>{type}</td>
                <td>{stat.count} rounds</td>
                <td>{Math.round(stat.totalDuration / stat.count)} mins</td>
                <td>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {(stat.totalDifficulty / stat.count).toFixed(1)} / 5.0
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Most Frequently Tested Topics</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {topTopics.map(([topic, count]) => (
            <div key={topic} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{topic}</span>
              <span className="badge badge-verified">{count} times</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
