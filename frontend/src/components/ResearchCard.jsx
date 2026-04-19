import { motion } from 'framer-motion'

export default function ResearchCard({ pub, index }) {
  const sourceColor = {
    PubMed:   { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.25)',  text: '#67e8f9' },
    OpenAlex: { bg: 'rgba(124,109,250,0.12)', border: 'rgba(124,109,250,0.25)', text: '#c4b5fd' },
  }[pub.source] || { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'var(--text-secondary)' }

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
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          minWidth: 28, height: 28, borderRadius: 8,
          background: 'rgba(124,109,250,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-tertiary)'
        }}>#{index + 1}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
            <span style={{
              padding: '2px 9px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 600,
              background: sourceColor.bg, border: `1px solid ${sourceColor.border}`, color: sourceColor.text
            }}>{pub.source}</span>
            {pub.year && (
              <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{pub.year}</span>
            )}
            {pub.citationCount > 0 && (
              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                📊 {pub.citationCount.toLocaleString()} citations
              </span>
            )}
          </div>

          <a
            href={pub.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)',
              textDecoration: 'none', lineHeight: 1.4, display: 'block'
            }}
            onMouseEnter={e => e.target.style.color = 'var(--accent-tertiary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
          >
            {pub.title}
          </a>
        </div>
      </div>

      {/* Authors */}
      {pub.authors?.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginBottom: 8, paddingLeft: 38 }}>
          👥 {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ` +${pub.authors.length - 3} more` : ''}
        </div>
      )}

      {/* Abstract */}
      {pub.abstract && (
        <div style={{
          fontSize: '0.8rem', color: 'var(--text-tertiary)',
          lineHeight: 1.65, paddingLeft: 38,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {pub.abstract}
        </div>
      )}

      {/* Footer */}
      {pub.url && (
        <div style={{ paddingLeft: 38, marginTop: 10 }}>
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem', color: 'var(--accent-secondary)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
            }}
          >
            🔗 View Publication →
          </a>
        </div>
      )}
    </motion.div>
  )
}
