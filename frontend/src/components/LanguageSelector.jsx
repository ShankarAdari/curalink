import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INDIAN_LANGUAGES } from '../config/languages'

export default function LanguageSelector({ selected, onSelect, compact = false }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const curr = INDIAN_LANGUAGES.find(l => l.code === selected) || INDIAN_LANGUAGES[0]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = INDIAN_LANGUAGES.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.native.includes(search)
  )

  const handleSelect = (lang) => {
    onSelect(lang.code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 50 }}>
      {/* Trigger */}
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 4 : 7,
          padding: compact ? '5px 10px' : '7px 14px', borderRadius: 100,
          background: open ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? curr.color + '60' : 'rgba(255,255,255,0.12)'}`,
          cursor: 'pointer', transition: 'all 0.2s'
        }}
      >
        <span style={{ fontSize: compact ? '0.9rem' : '1rem' }}>{curr.flag}</span>
        <span style={{ fontSize: compact ? '0.70rem' : '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {curr.native}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}
        >▼</motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)',
              right: 0, width: 260, maxHeight: 380, overflowY: 'auto',
              background: 'rgba(10,10,20,0.97)', backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
              boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
              padding: '10px 8px'
            }}
          >
            {/* Search */}
            <div style={{ padding: '0 4px 8px' }}>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search language..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10, boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text-primary)', fontSize: '0.80rem', outline: 'none'
                }}
              />
            </div>

            {/* Language list */}
            {filtered.map((lang, i) => {
              const isActive = lang.code === selected
              return (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleSelect(lang)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isActive ? `${lang.color}18` : 'transparent',
                    textAlign: 'left', transition: 'all 0.12s', marginBottom: 2
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center', flexShrink: 0 }}>{lang.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                      color: isActive ? lang.color : 'var(--text-secondary)'
                    }}>{lang.name}</div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{lang.native}</div>
                  </div>
                  {isActive && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, flexShrink: 0 }} />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
