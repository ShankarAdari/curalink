import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchHealthNews } from '../services/api'

const CATEGORY_COLORS = {
  Outbreak:      { bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)', text: '#fda4af' },
  Oncology:      { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', text: '#c4b5fd' },
  Cardiology:    { bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.22)', text: '#fda4af' },
  Vaccines:      { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.22)',  text: '#6ee7b7' },
  'Mental Health':{ bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.22)', text: '#67e8f9' },
  Neurology:     { bg: 'rgba(34,211,238,0.10)',  border: 'rgba(34,211,238,0.22)', text: '#67e8f9' },
  Endocrinology: { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.22)', text: '#fcd34d' },
  'General Health':{ bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'var(--text-secondary)' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 7) return `${Math.floor(d/7)}w ago`
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

export default function HealthNews({ compact = false }) {
  const [articles, setArticles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeIdx, setActiveIdx]   = useState(0)
  const [activeFilter, setFilter]   = useState('All')

  useEffect(() => {
    fetchHealthNews()
      .then(d => setArticles(d.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...new Set(articles.map(a => a.category))]
  const filtered = activeFilter === 'All' ? articles : articles.filter(a => a.category === activeFilter)

  // Compact mode — just a scrolling ticker
  if (compact) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12, padding: '10px 16px',
        overflow: 'hidden', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🦠 Live Health News</span>
        </div>
        {loading ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Loading headlines...</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}
            >
              {articles[activeIdx % articles.length]?.icon} {articles[activeIdx % articles.length]?.title?.slice(0, 80)}...
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(251,113,133,0.15)',
            border: '1px solid rgba(251,113,133,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>🦠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Health Headlines</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Latest medical & outbreak news</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="pulse-dot" style={{ background: '#fda4af' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Live</span>
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {categories.map(cat => {
          const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS['General Health']
          const isActive = activeFilter === cat
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '4px 12px', borderRadius: 100, cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 500,
                background: isActive ? (col.bg || 'rgba(124,109,250,0.18)') : 'transparent',
                border: `1px solid ${isActive ? col.border : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? col.text : 'var(--text-tertiary)',
                transition: 'all 0.15s'
              }}
            >{cat}</button>
          )
        })}
      </div>

      {/* Articles list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height: 80, borderRadius: 16,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filtered.map((article, i) => {
              const col = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['General Health']
              return (
                <motion.a
                  key={article.title + i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '14px 16px',
                    transition: 'all 0.2s', cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = col.border; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = '' }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: col.bg,
                      border: `1px solid ${col.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                    }}>{article.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                          background: col.bg, border: `1px solid ${col.border}`, color: col.text
                        }}>{article.category}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 'auto', flexShrink: 0 }}>
                          {timeAgo(article.publishedAt)} · {article.source}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        {article.summary}
                      </div>
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
