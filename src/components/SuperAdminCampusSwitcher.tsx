'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Campus {
  id: string
  name: string
}

export default function SuperAdminCampusSwitcher({
  campuses,
  currentCampusId
}: {
  campuses: Campus[]
  currentCampusId: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campusId = e.target.value
    router.push(`${pathname}?campusId=${campusId}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <label style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
      }}>
        Switch College:
      </label>
      <select
        value={currentCampusId}
        onChange={handleSelect}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          padding: '0.35rem 0.6rem',
          cursor: 'pointer'
        }}
      >
        {campuses.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
