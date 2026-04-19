import { motion } from 'framer-motion'

const STATUS_MAP = {
  RECRUITING:           { label: 'Recruiting',          color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)' },
  ACTIVE_NOT_RECRUITING:{ label: 'Active / Not Recruiting', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  COMPLETED:            { label: 'Completed',           color: '#67e8f9', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.25)' },
  ENROLLING_BY_INVITATION: { label: 'By Invitation',   color: '#c4b5fd', bg: 'rgba(124,109,250,0.12)', border: 'rgba(124,109,250,0.25)' },
  NOT_YET_RECRUITING:   { label: 'Starting Soon',       color: '#fda4af', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
  TERMINATED:           { label: 'Terminated',          color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)' },
}

export default function TrialCard({ trial, index }) {
  const s = STATUS_MAP[trial.status] || STATUS_MAP.COMPLETED

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '18px 20px',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = '' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          minWidth: 28, height: 28, borderRadius: 8,
          background: 'rgba(52,211,153,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7'
        }}>T{index + 1}</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {/* Status badge */}
            <span style={{
              padding: '2px 10px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
              background: s.bg, border: `1px solid ${s.border}`, color: s.color,
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: s.color,
                animation: trial.status === 'RECRUITING' ? 'pulse-dot 1.2s ease-in-out infinite' : 'none'
              }} />
              {s.label}
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>🔬 ClinicalTrials.gov</span>
          </div>

          <a
            href={trial.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)',
              textDecoration: 'none', lineHeight: 1.4, display: 'block'
            }}
            onMouseEnter={e => e.target.style.color = '#6ee7b7'}
            onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
          >
            {trial.title}
          </a>
        </div>
      </div>

      {/* Summary */}
      {trial.summary && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.65, paddingLeft: 38, marginBottom: 12 }}>
          {trial.summary?.slice(0, 240)}...
        </div>
      )}

      {/* Info grid */}
      <div style={{ paddingLeft: 38, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {trial.locations?.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)'
          }}>
            📍 {trial.locations.slice(0, 2).join(' · ')}{trial.locations.length > 2 ? ` +${trial.locations.length - 2}` : ''}
          </div>
        )}
        {trial.contacts?.[0] && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)'
          }}>
            📧 {trial.contacts[0].name || trial.contacts[0].email || 'Contact available'}
          </div>
        )}
        {trial.phases?.length > 0 && (
          <div style={{
            background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.18)',
            borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-tertiary)'
          }}>
            {trial.phases.join(', ')}
          </div>
        )}
      </div>

      {/* Eligibility snippet */}
      {trial.eligibility && (
        <div style={{ paddingLeft: 38, marginTop: 10 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Eligibility
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            {trial.eligibility?.slice(0, 200)}...
          </div>
        </div>
      )}

      {/* CTA */}
      {trial.url && (
        <div style={{ paddingLeft: 38, marginTop: 12 }}>
          <a
            href={trial.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 100,
              background: s.bg, border: `1px solid ${s.border}`,
              color: s.color, fontSize: '0.76rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s'
            }}
          >
            🔗 View on ClinicalTrials.gov →
          </a>
        </div>
      )}
    </motion.div>
  )
}
