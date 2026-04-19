import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WeatherWidget from '../components/WeatherWidget'
import HealthNews from '../components/HealthNews'
import HealthTipWidget from '../components/HealthTipWidget'
import ReviewsSection from '../components/ReviewsSection'

// ─── Animated stat counter ────────────────────────────────────
function AnimStat({ target, suffix = '', color, label }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const end = parseInt(target.replace(/[^0-9]/g, ''))
    let start = 0
    const inc = Math.ceil(end / 60)
    const timer = setInterval(() => {
      start = Math.min(start + inc, end)
      setVal(start)
      if (start >= end) clearInterval(timer)
    }, 24)
    return () => clearInterval(timer)
  }, [])
  const display = target.includes('M') ? val + 'M+' : target.includes('K') ? val + 'K+' : target.includes('<') ? target : target.includes('★') ? val + '★' : val + (target.includes('+') ? '+' : '')
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, letterSpacing: '-0.03em' }}>{display}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── Ticker strip ─────────────────────────────────────────────
const TICKER_ITEMS = [
  '🧬 200M+ medical publications indexed',
  '🔬 500K+ active clinical trials tracked',
  '🤖 AI synthesis in < 5 seconds',
  '📊 Real-time PubMed · OpenAlex · ClinicalTrials data',
  '🏥 4.9★ rated by physicians & patients',
  '⚡ Streaming responses — no waiting',
  '💊 Drug interactions · BMI · Sleep · BP calculators',
  '🛡️ Every response is source-backed — zero hallucinations',
  '📋 Structured: Overview → Research → Trials → Takeaways',
]
function TickerStrip() {
  const full = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{ overflow: 'hidden', background: 'rgba(124,109,250,0.07)', borderTop: '1px solid rgba(124,109,250,0.15)', borderBottom: '1px solid rgba(124,109,250,0.15)', padding: '10px 0' }}>
      <motion.div
        animate={{ x: [0, -50 * TICKER_ITEMS.length + '%'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', willChange: 'transform' }}>
        {full.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', paddingInline: 32, fontSize: '0.80rem', color: 'var(--text-secondary)', fontWeight: 500, gap: 8 }}>
            {item}
            <span style={{ marginLeft: 24, color: 'rgba(124,109,250,0.4)', fontSize: '0.9rem' }}>•</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

const DEMO_QUERIES = [
  'Latest treatment for lung cancer',
  "Clinical trials for Parkinson's disease",
  "Top researchers in Alzheimer's",
  'Recent studies on heart disease',
  'Deep brain stimulation therapy',
  'Immunotherapy breakthroughs 2025',
]

const FEATURES = [
  { icon: '🔬', title: 'Real Research', desc: 'Live data from PubMed, OpenAlex & ClinicalTrials.gov — 200M+ papers indexed', color: '#7c6dfa' },
  { icon: '🧠', title: 'AI Reasoning', desc: 'Open-source LLM synthesizes evidence into personalized, cited answers with streaming', color: '#22d3ee' },
  { icon: '📍', title: 'Context-Aware', desc: 'Remembers your disease, name & location across the full multi-turn conversation', color: '#fb7185' },
  { icon: '⚡', title: 'Smart Ranking', desc: 'Retrieves 50–300 results, ranks by relevance, recency, citations & disease match', color: '#fbbf24' },
  { icon: '🛡️', title: 'Source-Backed', desc: 'Every claim cites a real paper or trial — zero hallucination, full transparency', color: '#a78bfa' },
  { icon: '🏥', title: 'Health Widgets', desc: 'BMI, Blood Pressure, Sleep, Calorie (TDEE), Heart Rate & Water intake calculators', color: '#34d399' },
  { icon: '📤', title: 'Export & Share', desc: 'Export full conversations as .txt or .json — share with your doctor or care team', color: '#38bdf8' },
  { icon: '🔍', title: 'Query Expansion', desc: 'Automatically expands your question into optimized research terms for better results', color: '#a78bfa' },
]

const PIPELINE_STEPS = [
  { n: '01', label: 'Query Expansion', desc: '"DBS therapy" → "deep brain stimulation + Parkinson\'s disease treatment"', icon: '🔍' },
  { n: '02', label: 'Parallel Retrieval', desc: '80 PubMed + 100 OpenAlex + 50 ClinicalTrials results fetched simultaneously', icon: '📡' },
  { n: '03', label: 'Smart Re-Ranking', desc: 'Scored by relevance, year, citations, source credibility & disease match', icon: '🏆' },
  { n: '04', label: 'LLM Synthesis', desc: 'Mistral/Ollama generates structured, personalized, non-hallucinated insights', icon: '🤖' },
  { n: '05', label: 'Structured Output', desc: 'Overview → Research Insights → Trials → Takeaways → Sources', icon: '📋' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [queryIdx, setQueryIdx]   = useState(0)
  const [displayText, setDisplay] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeCount, setActiveCount] = useState(1_247)

  // Typewriter
  useEffect(() => {
    const target = DEMO_QUERIES[queryIdx]
    let t
    if (!isDeleting && displayText.length < target.length) {
      t = setTimeout(() => setDisplay(target.slice(0, displayText.length + 1)), 55)
    } else if (!isDeleting && displayText.length === target.length) {
      t = setTimeout(() => setIsDeleting(true), 2400)
    } else if (isDeleting && displayText.length > 0) {
      t = setTimeout(() => setDisplay(displayText.slice(0, -1)), 28)
    } else {
      setIsDeleting(false)
      setQueryIdx(i => (i + 1) % DEMO_QUERIES.length)
    }
    return () => clearTimeout(t)
  }, [displayText, isDeleting, queryIdx])

  // Simulated live user count
  useEffect(() => {
    const t = setInterval(() => {
      setActiveCount(c => c + Math.floor(Math.random() * 3))
    }, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Animated orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(32px)',
        background: 'rgba(10,10,15,0.70)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg, #7c6dfa, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>⚕️</div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.03em' }}>Curalink</span>
          <span className="badge badge-purple" style={{ marginLeft: 4 }}>Beta</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {['Pipeline', 'Features', 'News', 'Reviews'].map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={{
                fontSize: '0.875rem', color: 'var(--text-secondary)',
                textDecoration: 'none', transition: 'color 0.15s'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Live users */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {activeCount.toLocaleString()} researching now
            </span>
          </div>
          <button className="btn btn-glass" style={{ fontSize: '0.85rem' }} onClick={() => navigate('/chat')}>
            Open App
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            Get Started →
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 5 }}>

        {/* ── TICKER STRIP ──────────────────────────────────────── */}
        <TickerStrip />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="badge badge-cyan" style={{ marginBottom: 22, fontSize: '0.8rem' }}>
              🏥 AI-Powered Medical Research Assistant
            </div>

            <h1 style={{ marginBottom: 24, lineHeight: 1.15 }}>
              Your Personal{' '}
              <span className="gradient-text">Medical Research</span>{' '}
              Companion
            </h1>

            <p style={{ fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 44px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              Ask anything. Get structured, evidence-based answers from live PubMed papers,
              OpenAlex publications, and ClinicalTrials.gov — synthesized by an open-source AI.
            </p>

            {/* Typewriter search bar */}
            <div
              className="glass"
              style={{
                maxWidth: 600, margin: '0 auto 44px',
                padding: '18px 24px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', transition: 'all 0.2s',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)'
              }}
              onClick={() => navigate('/chat')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = '' }}
            >
              <span style={{ fontSize: 20 }}>🔍</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.97rem', flex: 1, textAlign: 'left' }}>
                {displayText}
                <span style={{
                  display: 'inline-block', width: 2, height: '1.1em',
                  background: 'var(--accent-secondary)',
                  marginLeft: 2, verticalAlign: 'text-bottom',
                  animation: 'pulse-dot 0.8s ease-in-out infinite'
                }} />
              </span>
              <span style={{
                fontSize: '0.78rem', color: 'var(--text-tertiary)',
                background: 'var(--glass-bg)', padding: '4px 10px', borderRadius: 8,
                border: '1px solid var(--glass-border)', flexShrink: 0
              }}>Enter</span>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '1rem', padding: '14px 36px' }}
                onClick={() => navigate('/chat')}
              >
                Start Researching →
              </button>
              <button
                className="btn btn-glass"
                style={{ fontSize: '0.95rem' }}
                onClick={() => navigate('/onboarding')}
              >
                📋 Set Patient Context
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 72, flexWrap: 'wrap' }}
          >
            {[
              { val: '200M+', label: 'Publications', color: '#7c6dfa' },
              { val: '500K+', label: 'Clinical Trials', color: '#22d3ee' },
              { val: '22',    label: 'Languages', color: '#34d399' },
              { val: '<5s',   label: 'Avg. Response', color: '#fbbf24' },
              { val: '4.9★',  label: 'User Rating', color: '#fb7185' },
              { val: '9',     label: 'Health Widgets', color: '#a78bfa' },
            ].map(s => (
              <AnimStat key={s.label} target={s.val} color={s.color} label={s.label} />
            ))}
          </motion.div>
        </section>

        {/* ── HEALTH TIP BANNER ─────────────────────────────────── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 32px' }}>
          <HealthTipWidget />
        </div>

        {/* ── WEATHER + NEWS GRID ───────────────────────────────── */}
        <section id="news" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 24 }}>
            {/* Left: Weather */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <WeatherWidget />
            </div>
            {/* Right: Health News */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24, padding: 24,
              backdropFilter: 'blur(32px)'
            }}>
              <HealthNews />
            </div>
          </div>
        </section>

        {/* ── PIPELINE ─────────────────────────────────────────── */}
        <section id="pipeline" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div className="badge badge-purple" style={{ marginBottom: 16 }}>⚙️ How It Works</div>
            <h2>The <span className="gradient-text">Research Pipeline</span></h2>
            <p style={{ maxWidth: 520, margin: '12px auto 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              Five intelligent stages transform your question into research-grade, personalized insights.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.10 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '20px 24px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = '' }}
              >
                <div style={{
                  fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                  color: 'var(--accent-primary)', width: 28, flexShrink: 0
                }}>{step.n}</div>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                  background: 'rgba(124,109,250,0.12)', border: '1px solid rgba(124,109,250,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div className="badge badge-green" style={{ marginBottom: 16 }}>✨ Features</div>
            <h2>Built for <span className="gradient-text">Serious Research</span></h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass"
                style={{ padding: 26, transition: 'all 0.22s', cursor: 'default' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = f.color + '40'
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = `0 16px 48px ${f.color}18`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 15, marginBottom: 18,
                  background: f.color + '18', border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                }}>{f.icon}</div>
                <h3 style={{ marginBottom: 10, fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── DEMO USE CASES ───────────────────────────────────── */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <div className="badge badge-cyan" style={{ marginBottom: 14 }}>🧪 Try These</div>
            <h2>Example <span className="gradient-text">Queries</span></h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { q: 'Latest treatment for lung cancer', icon: '🫁', color: '#fb7185' },
              { q: 'Clinical trials for diabetes in New York', icon: '💉', color: '#22d3ee' },
              { q: "Top researchers in Alzheimer's disease", icon: '🧠', color: '#a78bfa' },
              { q: 'Recent studies on heart disease', icon: '❤️', color: '#fb7185' },
              { q: "Deep brain stimulation Parkinson's", icon: '⚡', color: '#fbbf24' },
              { q: 'Immunotherapy breakthroughs 2025', icon: '🔬', color: '#34d399' },
            ].map((item, i) => (
              <motion.button
                key={item.q}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate(`/chat?q=${encodeURIComponent(item.q)}`)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '16px 18px', borderRadius: 16, textAlign: 'left',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = item.color + '40'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = '' }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.q}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── REVIEWS ──────────────────────────────────────────── */}
        <section id="reviews">
          <ReviewsSection />
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section style={{ padding: '60px 24px 100px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 32, padding: '52px 64px',
              backdropFilter: 'blur(32px)',
              maxWidth: 600
            }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>⚕️</div>
              <h2 style={{ marginBottom: 16 }}>Ready to Research Smarter?</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: 32 }}>
                No account required · Free access · Real medical data
              </p>
              <button
                className="btn btn-primary"
                style={{ fontSize: '1rem', padding: '16px 40px', width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/chat')}
              >
                Launch Curalink →
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid var(--glass-border)',
          padding: '24px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>⚕️</div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Curalink</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Powered by PubMed · OpenAlex · ClinicalTrials.gov · Ollama
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            ⚠️ For research purposes only — not medical advice
          </div>
        </footer>
      </main>
    </div>
  )
}
