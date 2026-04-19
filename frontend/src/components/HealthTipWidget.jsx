import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchHealthTip } from '../services/api'

export default function HealthTipWidget() {
  const [tip, setTip]       = useState(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    fetchHealthTip().then(setTip).catch(() => {})
  }, [])

  if (!tip || !visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(34,211,238,0.07) 100%)',
          border: '1px solid rgba(52,211,153,0.20)',
          borderRadius: 20, padding: '16px 20px',
          backdropFilter: 'blur(24px)',
          position: 'relative'
        }}
      >
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'transparent', border: 'none',
            color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16, lineHeight: 1
          }}
          aria-label="Close"
        >×</button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>{tip.icon}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#6ee7b7'
              }}>Daily Health Tip · {tip.category}</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {tip.tip}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
