/**
 * CURALINK — Chat Page (Speech-free, theme-aware)
 * All TTS / STT / mic features removed to prevent browser blank-screen bugs.
 */
import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import ReactMarkdown from 'react-markdown'
import { sendMessageStream } from '../services/api'
import WidgetPanel from '../components/WidgetPanel'
import StructuredInput from '../components/StructuredInput'

// ─── Export conversation helper ─────────────────────────────
function exportConversation(messages, format = 'txt') {
  const ts = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `curalink_${ts}.json`; a.click()
  } else {
    const text = messages.map(m =>
      `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'user' ? 'You' : 'Curalink'}:\n${m.content}`
    ).join('\n\n' + '─'.repeat(60) + '\n\n')
    const blob = new Blob([`CURALINK — AI Medical Research Conversation\nExported: ${new Date().toLocaleString()}\n\n${'═'.repeat(60)}\n\n${text}`], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `curalink_${ts}.txt`; a.click()
  }
}

// ─── Suggestions ───────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '🫁', text: 'Lung cancer latest treatments 2025',    color: '#fb7185' },
  { icon: '🧠', text: "Parkinson's deep brain stimulation",    color: '#a78bfa' },
  { icon: '💉', text: 'Diabetes clinical trials near me',      color: '#22d3ee' },
  { icon: '❤️', text: 'Heart disease breakthroughs 2025',      color: '#f43f5e' },
  { icon: '🧬', text: "Alzheimer's prevention research",       color: '#34d399' },
  { icon: '💊', text: 'Immunotherapy side effect management',  color: '#fbbf24' },
]

// ─── Themes ────────────────────────────────────────────────────
const THEMES = [
  { id: 'dark',   label: '🌑 Dark',   icon: '🌑' },
  { id: 'light',  label: '☀️ Light',  icon: '☀️' },
  { id: 'ocean',  label: '🌊 Ocean',  icon: '🌊' },
  { id: 'sunset', label: '🌅 Sunset', icon: '🌅' },
]

const THEME_VARS = {
  dark: {
    '--bg-primary':     '#0a0a0f',
    '--text-primary':   'rgba(255,255,255,0.95)',
    '--text-secondary': 'rgba(255,255,255,0.65)',
    '--text-tertiary':  'rgba(255,255,255,0.40)',
    '--glass-bg':       'rgba(255,255,255,0.05)',
    '--glass-bg-hover': 'rgba(255,255,255,0.08)',
    '--glass-border':   'rgba(255,255,255,0.10)',
    '--sidebar-bg':     'rgba(6,6,12,0.93)',
    '--topbar-bg':      'rgba(6,6,12,0.88)',
    '--inputbar-bg':    'rgba(6,6,12,0.92)',
    '--bubble-user':    'rgba(124,109,250,0.22)',
    '--bubble-ai':      'rgba(255,255,255,0.05)',
    '--accent-primary': '#7c6dfa',
    '--accent-secondary':'#a78bfa',
    '--accent-tertiary':'#c4b5fd',
  },
  light: {
    '--bg-primary':     '#f0f2fc',
    '--text-primary':   'rgba(15,15,40,0.95)',
    '--text-secondary': 'rgba(30,30,80,0.68)',
    '--text-tertiary':  'rgba(60,60,120,0.48)',
    '--glass-bg':       'rgba(255,255,255,0.75)',
    '--glass-bg-hover': 'rgba(255,255,255,0.90)',
    '--glass-border':   'rgba(100,100,180,0.18)',
    '--sidebar-bg':     'rgba(230,232,248,0.97)',
    '--topbar-bg':      'rgba(230,233,250,0.94)',
    '--inputbar-bg':    'rgba(225,228,248,0.97)',
    '--bubble-user':    'rgba(124,109,250,0.18)',
    '--bubble-ai':      'rgba(255,255,255,0.80)',
    '--accent-primary': '#6d5ff5',
    '--accent-secondary':'#9175f0',
    '--accent-tertiary':'#7c6dfa',
  },
  ocean: {
    '--bg-primary':     '#020d1a',
    '--text-primary':   'rgba(218,245,255,0.95)',
    '--text-secondary': 'rgba(140,215,255,0.70)',
    '--text-tertiary':  'rgba(90,190,255,0.48)',
    '--glass-bg':       'rgba(0,55,110,0.25)',
    '--glass-bg-hover': 'rgba(0,75,150,0.32)',
    '--glass-border':   'rgba(0,200,255,0.16)',
    '--sidebar-bg':     'rgba(2,15,32,0.96)',
    '--topbar-bg':      'rgba(2,14,30,0.92)',
    '--inputbar-bg':    'rgba(2,16,34,0.96)',
    '--bubble-user':    'rgba(14,165,233,0.22)',
    '--bubble-ai':      'rgba(0,60,120,0.30)',
    '--accent-primary': '#0ea5e9',
    '--accent-secondary':'#38bdf8',
    '--accent-tertiary':'#7dd3fc',
  },
  sunset: {
    '--bg-primary':     '#0f0508',
    '--text-primary':   'rgba(255,242,228,0.96)',
    '--text-secondary': 'rgba(255,198,158,0.72)',
    '--text-tertiary':  'rgba(255,168,128,0.50)',
    '--glass-bg':       'rgba(80,18,28,0.28)',
    '--glass-bg-hover': 'rgba(120,28,38,0.34)',
    '--glass-border':   'rgba(255,100,70,0.18)',
    '--sidebar-bg':     'rgba(15,5,8,0.96)',
    '--topbar-bg':      'rgba(14,5,8,0.92)',
    '--inputbar-bg':    'rgba(15,5,10,0.96)',
    '--bubble-user':    'rgba(249,115,22,0.22)',
    '--bubble-ai':      'rgba(80,18,28,0.40)',
    '--accent-primary': '#f97316',
    '--accent-secondary':'#fb923c',
    '--accent-tertiary':'#fdba74',
  },
}

function applyThemeVars(themeId) {
  const vars = THEME_VARS[themeId] || THEME_VARS.dark
  const root = document.documentElement
  root.setAttribute('data-theme', themeId)
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  document.body.style.background = vars['--bg-primary']
}

// ─── Particles ─────────────────────────────────────────────────
function Particles() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i}
          animate={{ y: [-20, -80, -20], opacity: [0, 0.35, 0], x: [0, (i % 2 ? 28 : -28), 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${5 + (i * 4.7) % 90}%`,
            top:  `${10 + (i * 7.3) % 80}%`,
            width: 4 + (i % 4) * 2, height: 4 + (i % 4) * 2,
            borderRadius: '50%',
            background: ['#7c6dfa','#22d3ee','#f97316','#34d399','#ec4899'][i % 5],
            filter: 'blur(1px)',
          }}
        />
      ))}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,109,250,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
    </div>
  )
}

// ─── Waveform (typing indicator only) ─────────────────────────
function Waveform({ color = '#22d3ee', bars = 8, height = 24 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i}
          animate={{ scaleY: [0.3, 1, 0.2, 0.8, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }}
          style={{ width: 3, height, background: color, borderRadius: 2, transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ─────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser     = msg.role === 'user'
  const isStreaming = msg.streaming && !isUser

  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ display: 'flex', gap: 12, marginBottom: 22, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>

      <div
        style={{ width: 40, height: 40, borderRadius: 14, flexShrink: 0,
          background: isUser ? 'var(--glass-bg)' : 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: '1px solid var(--glass-border)' }}>
        {isUser ? '👤' : '⚕️'}
      </div>

      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 5, paddingInline: 4,
          display: 'flex', alignItems: 'center', gap: 7, flexDirection: isUser ? 'row-reverse' : 'row' }}>
          {isUser ? 'You' : '⚕️ Curalink AI'}
          {isStreaming && <span style={{ color: '#a78bfa', fontSize: '0.60rem' }}>Composing...</span>}
          <span style={{ fontWeight: 400 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div style={{ padding: '14px 18px', lineHeight: 1.7,
          background: isUser ? 'var(--bubble-user)' : 'var(--bubble-ai)',
          border: `1px solid ${isUser ? 'rgba(124,109,250,0.35)' : 'var(--glass-border)'}`,
          borderRadius: isUser ? '20px 20px 5px 20px' : '5px 20px 20px 20px',
          backdropFilter: 'blur(20px)', fontSize: isUser ? '0.93rem' : '0.875rem',
          color: 'var(--text-primary)', position: 'relative' }}>
          {isUser
            ? msg.content
            : (
              <div className="markdown-body">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                {isStreaming && (
                  <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                    style={{ display: 'inline-block', width: 2, height: '1em', background: '#a78bfa',
                      borderRadius: 2, marginLeft: 2, verticalAlign: 'middle' }}/>
                )}
              </div>
            )
          }
        </div>

        {!isUser && !isStreaming && (msg.pubs > 0 || msg.trials > 0) && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 5, marginTop: 5, paddingInline: 4 }}>
            {msg.pubs   > 0 && <span className="badge badge-cyan"  style={{ fontSize: '0.60rem' }}>📚 {msg.pubs} papers</span>}
            {msg.trials > 0 && <span className="badge badge-green" style={{ fontSize: '0.60rem' }}>🔬 {msg.trials} trials</span>}
            {msg.source === 'ollama' && <span className="badge" style={{ fontSize: '0.60rem', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.24)', color: '#6ee7b7' }}>🤖 Ollama</span>}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Sources panel ──────────────────────────────────────────────
function SourcesPanel({ pubs = [], trials = [] }) {
  const [open, setOpen] = useState(false)
  if (!pubs.length && !trials.length) return null
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 18, marginLeft: 52 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10,
          padding: '5px 14px', fontSize: '0.72rem', color: 'var(--text-tertiary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6 }}>
        {open ? '▲' : '▼'} {open ? 'Hide' : 'Show'} sources
        {pubs.length > 0 && <span style={{ color: '#67e8f9' }}>📚 {pubs.length}</span>}
        {trials.length > 0 && <span style={{ color: '#6ee7b7' }}>🔬 {trials.length}</span>}
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pubs.map((p, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.title}</div>
              {p.authors && <div style={{ opacity: 0.7 }}>{Array.isArray(p.authors) ? p.authors.slice(0,3).join(', ') : p.authors}</div>}
              {p.year && <div style={{ opacity: 0.55, fontSize: '0.68rem' }}>{p.journal || ''} {p.year}</div>}
              {p.url && <a href={p.url} target="_blank" rel="noreferrer"
                style={{ color: '#67e8f9', fontSize: '0.68rem' }}>View →</a>}
            </div>
          ))}
          {trials.map((t, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--glass-bg)',
              border: '1px solid rgba(52,211,153,0.18)', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: '#6ee7b7', marginBottom: 2 }}>{t.title || t.briefTitle}</div>
              {t.status && <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Status: {t.status}</span>}
              {t.url && <> · <a href={t.url} target="_blank" rel="noreferrer"
                style={{ color: '#6ee7b7', fontSize: '0.68rem' }}>Details →</a></>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Typing indicator ──────────────────────────────────────────
function Typing() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
      <motion.div animate={{ boxShadow: ['0 0 0 rgba(124,109,250,0)', '0 0 18px rgba(124,109,250,0.6)', '0 0 0 rgba(124,109,250,0)'] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#7c6dfa,#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚕️</motion.div>
      <div style={{ background: 'var(--bubble-ai)', border: '1px solid var(--glass-border)', borderRadius: '5px 20px 20px 20px', padding: '14px 20px', minWidth: 200 }}>
        <Waveform bars={10} color="#7c6dfa" height={20} />
        <TypingStages />
      </div>
    </motion.div>
  )
}

function TypingStages() {
  const STAGES = [
    '🔍 Expanding your query…',
    '📚 Searching PubMed · OpenAlex…',
    '🔬 Fetching ClinicalTrials.gov…',
    '📊 Ranking by relevance…',
    '🤖 Generating AI response…',
  ]
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStage(s => (s + 1) % STAGES.length), 1800)
    return () => clearInterval(t)
  }, [])
  return (
    <AnimatePresence mode="wait">
      <motion.div key={stage}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32 }}
        style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', marginTop: 7, fontStyle: 'italic' }}>
        {STAGES[stage]}
      </motion.div>
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ChatPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const location       = useLocation()
  const routeState     = location.state || {}
  const [sessionId]    = useState(uuidv4)

  const [messages,        setMessages]       = useState([])
  const [input,           setInput]          = useState('')
  const [loading,         setLoading]        = useState(false)
  const [error,           setError]          = useState(null)
  const [showSidebar,     setShowSidebar]    = useState(false)
  const [showThemes,      setShowThemes]     = useState(false)
  const [showWidgets,     setShowWidgets]    = useState(false)
  const [lastStats,       setLastStats]      = useState(null)
  const [theme,           setTheme]          = useState(() => localStorage.getItem('cl_theme') || 'dark')
  const [patientCtx,      setPatientCtx]     = useState(() => routeState.patientCtx || {})
  const [showPatientCtx,  setShowPatientCtx] = useState(false)

  const autoSentRef = useRef(false)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const sendRef     = useRef(null)

  // ── Apply theme ────────────────────────────────────────────────
  useEffect(() => {
    applyThemeVars(theme)
    localStorage.setItem('cl_theme', theme)
  }, [theme])

  // ── Auto-send from onboarding ──────────────────────────────────
  useEffect(() => {
    const fromOnboarding = routeState.autoQuery
    const fromUrl        = searchParams.get('q')
    const q = fromOnboarding || fromUrl
    if (q?.trim() && !autoSentRef.current) {
      autoSentRef.current = true
      setTimeout(() => sendRef.current?.(q.trim()), 800)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto scroll ─────────────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // ── Send message ────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput(''); setError(null)

    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }])
    setLoading(true)

    const streamId = Date.now()
    setMessages(prev => [...prev, {
      id: streamId, role: 'assistant', content: '',
      pubs: 0, trials: 0, streaming: true, timestamp: new Date()
    }])

    try {
      let fullText  = ''
      let finalMeta = null

      for await (const event of sendMessageStream(msg, sessionId, patientCtx, '')) {
        if (event.type === 'meta') {
          finalMeta = event
          setLastStats(event)
          setMessages(prev => prev.map(m =>
            m.id === streamId ? { ...m, pubs: event.rankedPubs || 0, trials: event.rankedTrials || 0 } : m
          ))
        } else if (event.type === 'token') {
          fullText += event.text
          const captured = fullText
          setMessages(prev => prev.map(m =>
            m.id === streamId ? { ...m, content: captured } : m
          ))
        } else if (event.type === 'done') {
          setLastStats(s => ({ ...(s || {}), source: event.source }))
          finalMeta = { ...(finalMeta || {}), ...event }
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, content: fullText, streaming: false,
              pubs:         finalMeta?.rankedPubs   ?? m.pubs,
              trials:       finalMeta?.rankedTrials ?? m.trials,
              source:       finalMeta?.source,
              publications: finalMeta?.publications || [],
              trialCards:   finalMeta?.trials       || [],
            }
          : m
      ))

    } catch (e) {
      console.error('Streaming error:', e)
      setError('⚠️ Could not reach Curalink backend. Make sure the server is running on port 5000.')
      setMessages(prev => prev.filter(m => m.id !== streamId))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, sessionId, patientCtx])

  useEffect(() => { sendRef.current = send }, [send])

  const handleClear = () => setMessages([])

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); if (messages.length) handleClear() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); if (messages.length) exportConversation(messages) }
      if (e.key === 'Escape') { setShowThemes(false); setShowWidgets(false); setShowSidebar(false); setShowPatientCtx(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [messages])

  // ─────────────────────────────────────────────────────────────
  // SIDEBAR inner content
  // ─────────────────────────────────────────────────────────────
  const SidebarContent = ({ onAction }) => (
    <>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div whileHover={{ rotate: 10 }}
            style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              boxShadow: '0 4px 20px rgba(124,109,250,0.4)', flexShrink: 0 }}>⚕️</motion.div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--text-primary), var(--accent-tertiary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Curalink</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>AI Medical Research</div>
          </div>
          <button onClick={() => navigate('/')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}>🏠</button>
        </div>
      </div>

      {/* Quick ask */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>💡 Quick Ask</div>
        {SUGGESTIONS.map(s => (
          <motion.button key={s.text} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
            onClick={() => { send(s.text); onAction?.() }} disabled={loading}
            style={{ width: '100%', padding: '7px 10px', marginBottom: 4, borderRadius: 10, border: 'none',
              cursor: 'pointer', background: 'var(--glass-bg)', textAlign: 'left', fontSize: '0.73rem',
              lineHeight: 1.4, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start',
              gap: 7, transition: 'all 0.15s', opacity: loading ? 0.5 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.borderLeft = `3px solid ${s.color}`; e.currentTarget.style.background = 'var(--glass-bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.borderLeft = 'none'; e.currentTarget.style.background = 'var(--glass-bg)' }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{s.icon}</span>
            <span>{s.text}</span>
          </motion.button>
        ))}
        {messages.length > 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleClear(); onAction?.() }}
            style={{ width: '100%', marginTop: 8, padding: '7px', borderRadius: 9, fontSize: '0.72rem',
              cursor: 'pointer', background: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.15)', color: '#fda4af' }}>
            🗑️ Clear conversation
          </motion.button>
        )}
      </div>
    </>
  )

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <Particles />

      {/* ── Mobile overlay backdrop ─────────────────────────────── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div key="mob-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP SIDEBAR ────────────────────────────────────── */}
      <aside id="cura-sidebar" style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--sidebar-bg)', backdropFilter: 'blur(40px)',
        borderRight: '1px solid var(--glass-border)', zIndex: 10, position: 'relative'
      }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ──────────────────────────────── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div id="mob-sidebar" key="mob-sidebar"
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 120,
              width: 260, display: 'flex', flexDirection: 'column',
              background: 'var(--sidebar-bg)', backdropFilter: 'blur(40px)',
              borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderBottom: '1px solid var(--glass-border)' }}>
              <button onClick={() => setShowSidebar(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-tertiary)' }}>✕</button>
            </div>
            <SidebarContent onAction={() => setShowSidebar(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 5 }}>

        {/* TOP BAR */}
        <div id="cura-topbar" style={{
          background: 'var(--topbar-bg)', backdropFilter: 'blur(40px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
        }}>
          {/* Hamburger — mobile only */}
          <button id="hamburger-btn" className="hamburger-btn"
            onClick={() => setShowSidebar(s => !s)}
            style={{ padding: '5px 9px', borderRadius: 8, border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>
            ☰
          </button>

          {/* Live status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Live — PubMed · OpenAlex · ClinicalTrials
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Patient context button */}
            <motion.button
              id="patient-ctx-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
              onClick={() => setShowPatientCtx(s => !s)}
              title={patientCtx.disease ? `Context: ${patientCtx.name || ''} • ${patientCtx.disease}` : 'Set patient context'}
              style={{
                padding: '5px 12px', borderRadius: 9, cursor: 'pointer',
                border: `1px solid ${patientCtx.disease ? 'rgba(52,211,153,0.40)' : 'var(--glass-border)'}`,
                background: patientCtx.disease ? 'rgba(52,211,153,0.12)' : 'var(--glass-bg)',
                color: patientCtx.disease ? '#6ee7b7' : 'var(--text-tertiary)',
                fontSize: '0.78rem', fontWeight: 600
              }}
            >
              👤 {patientCtx.name ? patientCtx.name.split(' ')[0] : 'Patient'}
              {patientCtx.disease && <span style={{ opacity: 0.7, marginLeft: 4, fontSize: '0.68rem' }}>• {patientCtx.disease.slice(0, 12)}</span>}
            </motion.button>

            {/* Theme picker */}
            <div style={{ position: 'relative' }}>
              <motion.button id="theme-toggle" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                onClick={() => setShowThemes(s => !s)}
                style={{ padding: '5px 12px', borderRadius: 9, border: `1px solid ${showThemes ? 'rgba(124,109,250,0.4)' : 'var(--glass-border)'}`,
                  background: showThemes ? 'rgba(124,109,250,0.15)' : 'var(--glass-bg)',
                  color: showThemes ? 'var(--accent-tertiary)' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                {THEMES.find(t => t.id === theme)?.icon} Theme
              </motion.button>
              <AnimatePresence>
                {showThemes && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--sidebar-bg)',
                      border: '1px solid var(--glass-border)', borderRadius: 14, padding: 8,
                      zIndex: 100, minWidth: 140, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => { setTheme(t.id); setShowThemes(false) }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                          borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                          background: theme === t.id ? 'rgba(124,109,250,0.20)' : 'transparent',
                          color: theme === t.id ? 'var(--accent-tertiary)' : 'var(--text-secondary)' }}>
                        {t.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Widget panel toggle */}
            <motion.button id="widget-panel-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
              onClick={() => setShowWidgets(s => !s)}
              style={{ padding: '5px 12px', borderRadius: 9,
                border: `1px solid ${showWidgets ? 'rgba(52,211,153,0.40)' : 'var(--glass-border)'}`,
                background: showWidgets ? 'rgba(52,211,153,0.12)' : 'var(--glass-bg)',
                color: showWidgets ? '#6ee7b7' : 'var(--text-tertiary)',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                position: 'relative' }}>
              🏥 Widgets
              {lastStats && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', top: -5, right: -5, width: 8, height: 8,
                    borderRadius: '50%', background: '#34d399', border: '1.5px solid var(--topbar-bg)' }} />
              )}
            </motion.button>

          </div>
        </div>

        {/* Patient Context Modal */}
        <AnimatePresence>
          {showPatientCtx && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 55,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)'
              }}
              onClick={e => { if (e.target === e.currentTarget) setShowPatientCtx(false) }}
            >
              <StructuredInput
                initialContext={patientCtx}
                onSave={(ctx) => { setPatientCtx(ctx); setShowPatientCtx(false) }}
                onClose={() => setShowPatientCtx(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Panel */}
        <WidgetPanel
          isOpen={showWidgets}
          onClose={() => setShowWidgets(false)}
          stats={lastStats}
          onSymptom={(q) => { send(q); setShowWidgets(false) }}
        />

        {/* ── MESSAGE AREA ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Welcome screen */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', paddingTop: 40 }}>

              <motion.div
                animate={{ scale: [1, 1.04, 1], boxShadow: ['0 0 40px rgba(124,109,250,0.3)', '0 0 70px rgba(124,109,250,0.6)', '0 0 40px rgba(124,109,250,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 110, height: 110, borderRadius: 32, margin: '0 auto 24px',
                  background: 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
                ⚕️
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.04em',
                  background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--accent-tertiary))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🙏 Namaste!
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ maxWidth: 440, margin: '0 auto 32px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.8 }}>
                I'm <strong style={{ color: 'var(--text-primary)' }}>Curalink</strong> — your AI medical research companion.<br />
                Type your question below to search PubMed, OpenAlex &amp; ClinicalTrials.
              </motion.p>

              {/* Suggestion chips */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Popular Questions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 580, margin: '0 auto' }}>
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button key={s.text}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }}
                      whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }}
                      onClick={() => send(s.text)}
                      style={{ padding: '9px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: 500, background: 'var(--glass-bg)',
                        outline: `1px solid ${s.color}25`, color: 'var(--text-secondary)',
                        display: 'flex', gap: 7, alignItems: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${s.color}15`; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                      {s.icon}{s.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <Fragment key={i}>
              <Bubble msg={msg} />
              {msg.role === 'assistant' && !msg.streaming &&
               (msg.publications?.length > 0 || msg.trialCards?.length > 0) && (
                <SourcesPanel pubs={msg.publications || []} trials={msg.trialCards || []} />
              )}
            </Fragment>
          ))}
          {loading && <Typing />}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 16,
                background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
              <p style={{ margin: 0, color: '#fda4af', fontSize: '0.86rem' }}>{error}</p>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── INPUT BAR ──────────────────────────────────────────── */}
        <div id="cura-inputbar" style={{
          background: 'var(--inputbar-bg)', backdropFilter: 'blur(40px)',
          borderTop: '1px solid var(--glass-border)',
          padding: '14px 22px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea id="chat-input" ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about symptoms, treatments, clinical trials…"
                disabled={loading}
                rows={1}
                style={{ resize: 'none', width: '100%', boxSizing: 'border-box', padding: '13px 16px',
                  borderRadius: 16, fontSize: '0.92rem', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                  background: 'var(--glass-bg)',
                  border: `1px solid ${input.trim() ? 'rgba(124,109,250,0.4)' : 'var(--glass-border)'}`,
                  color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              />
            </div>

            {/* Send button */}
            <motion.button id="send-btn" className="btn-icon"
              whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
              onClick={() => send()} disabled={!input.trim() || loading}
              style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#7c6dfa,#22d3ee)' : 'var(--glass-bg)', borderColor: 'transparent', transition: 'all 0.2s' }}>
              {loading
                ? <div className="spinner" />
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              }
            </motion.button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.65rem', color: 'var(--text-tertiary)', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>↵ Send</span>
              <span>⌘L Clear</span>
              <span>⌘E Export</span>
              {messages.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => exportConversation(messages)}
                  style={{ background: 'rgba(124,109,250,0.10)', border: '1px solid rgba(124,109,250,0.25)',
                    color: 'var(--accent-tertiary)', borderRadius: 6, padding: '1px 8px', cursor: 'pointer',
                    fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  ⬇️ Export
                </motion.button>
              )}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {input.length > 0 && (
                <span style={{ color: input.length > 500 ? '#fb7185' : 'var(--text-tertiary)' }}>{input.length}/1000</span>
              )}
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>🌐 AI Research</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
