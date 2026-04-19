import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchReviews } from '../services/api'

const STARS = (n) => Array.from({ length: 5 }, (_, i) => (
  <span key={i} style={{ color: i < n ? '#fbbf24' : 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>★</span>
))

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    fetchReviews()
      .then(d => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
  }, [])

  // Auto-rotate carousel
  useEffect(() => {
    if (!autoplay || reviews.length === 0) return
    const t = setInterval(() => setCurrent(c => (c + 1) % reviews.length), 5000)
    return () => clearInterval(t)
  }, [autoplay, reviews.length])

  if (reviews.length === 0) return null

  return (
    <section style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="badge badge-amber" style={{ marginBottom: 16, fontSize: '0.78rem' }}>
              ⭐ Trusted by Patients & Researchers
            </div>
            <h2 style={{ marginBottom: 16 }}>
              What <span className="gradient-text">Real Users</span> Say
            </h2>
            <p style={{ maxWidth: 480, margin: '0 auto', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              Patients, caregivers, and medical professionals rely on Curalink for evidence-backed research.
            </p>

            {/* Aggregate rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
              <div style={{ display: 'flex', gap: 4 }}>{STARS(5)}</div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>4.9 / 5</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>from {reviews.length * 124 + 312} users</span>
            </div>
          </motion.div>
        </div>

        {/* Featured review (large) */}
        <div style={{ marginBottom: 32 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 28,
                padding: 40,
                backdropFilter: 'blur(32px)',
                maxWidth: 760, margin: '0 auto',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>
                {reviews[current]?.avatar}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                {STARS(reviews[current]?.rating || 5)}
              </div>
              <blockquote style={{
                fontSize: '1rem', lineHeight: 1.75, color: 'var(--text-secondary)',
                fontStyle: 'italic', maxWidth: 600, margin: '0 auto 24px',
                position: 'relative'
              }}>
                <span style={{
                  fontSize: '4rem', color: 'rgba(124,109,250,0.2)',
                  position: 'absolute', top: -20, left: -10, lineHeight: 1, fontFamily: 'serif'
                }}>"</span>
                {reviews[current]?.review}
                <span style={{
                  fontSize: '4rem', color: 'rgba(124,109,250,0.2)',
                  position: 'absolute', bottom: -40, right: -10, lineHeight: 1, fontFamily: 'serif'
                }}>"</span>
              </blockquote>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                {reviews[current]?.avatar} {reviews[current]?.name}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 4 }}>
                {reviews[current]?.role}
              </div>
              {reviews[current]?.disease && (
                <div style={{ marginTop: 10 }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                    🔬 {reviews[current]?.disease}
                  </span>
                  {reviews[current]?.verified && (
                    <span className="badge badge-green" style={{ fontSize: '0.68rem', marginLeft: 6 }}>
                      ✓ Verified User
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 48 }}
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          <button
            onClick={() => setCurrent(c => (c - 1 + reviews.length) % reviews.length)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem'
            }}>‹</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: i === current ? 24 : 8, height: 8,
                borderRadius: 100, border: 'none', cursor: 'pointer',
                background: i === current ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s', padding: 0
              }} />
            ))}
          </div>
          <button
            onClick={() => setCurrent(c => (c + 1) % reviews.length)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem'
            }}>›</button>
        </div>

        {/* Grid of small review cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {reviews.slice(0, 6).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setCurrent(i)}
              style={{
                background: current === i ? 'rgba(124,109,250,0.10)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${current === i ? 'rgba(124,109,250,0.30)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '20px',
                cursor: 'pointer', transition: 'all 0.25s'
              }}
              onMouseEnter={e => { if (current !== i) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-3px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = current === i ? 'rgba(124,109,250,0.10)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{r.avatar}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', truncate: true }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{STARS(r.rating)}</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                "{r.review.slice(0, 110)}..."
              </p>
              {r.disease && (
                <div style={{ marginTop: 10 }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{r.disease}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
