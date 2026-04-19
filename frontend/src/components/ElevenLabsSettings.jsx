import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STYLE_PRESETS = [
  { label: 'Natural', stability: 0.50, similarity: 0.80, style: 0.20, desc: 'Balanced & clear' },
  { label: 'Expressive', stability: 0.35, similarity: 0.82, style: 0.45, desc: 'Emotional, varied tone' },
  { label: 'Calm', stability: 0.70, similarity: 0.75, style: 0.10, desc: 'Steady & soothing' },
  { label: 'Energetic', stability: 0.30, similarity: 0.85, style: 0.60, desc: 'Dynamic & lively' },
  { label: 'Professional', stability: 0.65, similarity: 0.80, style: 0.15, desc: 'Clear & authoritative' },
]

export default function ElevenLabsSettings({ el, onClose }) {
  const [tab, setTab] = useState(el.apiKey ? 'voices' : 'setup')
  const [keyInput, setKeyInput] = useState(el.apiKey || '')
  const [saving, setSaving] = useState(false)
  const [testingVoice, setTestingVoice] = useState(null)

  const handleSaveKey = () => {
    setSaving(true)
    el.setApiKey(keyInput.trim())
    el.loadVoices()
    setTimeout(() => { setSaving(false); setTab('voices') }, 800)
  }

  const handlePreview = async (vid) => {
    setTestingVoice(vid)
    await el.previewVoice(vid)
    setTestingVoice(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      style={{
        background: 'rgba(10,10,20,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28, width: '100%', maxWidth: 540,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,109,250,0.15)'
      }}
    >
      {/* Header */}
      <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #f97316, #eab308)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>🎙️</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>ElevenLabs Voice AI</div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)' }}>
                  {el.apiKey ? '✅ Connected — Natural expressive voices' : '⚠️ Add free API key to unlock'}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
          {[
            { id: 'setup',  label: '🔑 Setup' },
            { id: 'voices', label: '🗣️ Voices' },
            { id: 'style',  label: '🎭 Style' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s',
              background: tab === t.id ? 'rgba(249,115,22,0.22)' : 'transparent',
              color: tab === t.id ? '#fb923c' : 'var(--text-tertiary)'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ── SETUP tab ── */}
        {tab === 'setup' && (
          <div>
            {/* Why ElevenLabs */}
            <div style={{
              padding: '14px 16px', borderRadius: 14, marginBottom: 20,
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fb923c', marginBottom: 8 }}>
                🌟 Why ElevenLabs?
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                ElevenLabs is the same neural voice AI used in premium apps. It produces truly human-like voices
                with natural emotion, expression, and tone — far beyond browser TTS.
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['😮 Expressive', '🤸 Natural pauses', '💬 Human intonation', '🌍 10+ voices', '🆓 Free 10K chars/month'].map(f => (
                  <span key={f} style={{
                    fontSize: '0.70rem', padding: '3px 10px', borderRadius: 100,
                    background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.22)', color: '#fb923c'
                  }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Get Your Free Key (2 minutes)
              </div>
              {[
                { step: '1', text: 'Go to elevenlabs.io', action: 'Open', url: 'https://elevenlabs.io/sign-up' },
                { step: '2', text: 'Sign up for free (no credit card needed)', action: null },
                { step: '3', text: 'Go to Profile → API Keys → Copy', action: null },
                { step: '4', text: 'Paste your key below', action: null },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: '#fb923c'
                  }}>{s.step}</div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>{s.text}</span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" style={{
                      fontSize: '0.72rem', padding: '4px 12px', borderRadius: 8,
                      background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)',
                      color: '#fb923c', textDecoration: 'none'
                    }}>{s.action} →</a>
                  )}
                </div>
              ))}
            </div>

            {/* Key input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Your ElevenLabs API Key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'monospace'
                }}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              />
              {el.keyError && (
                <div style={{ fontSize: '0.72rem', color: '#fda4af', marginTop: 6 }}>
                  ❌ Invalid API key. Please check and try again.
                </div>
              )}
              {el.quotaError && (
                <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 6 }}>
                  ⚠️ Monthly quota exceeded. Upgrade at elevenlabs.io or wait for reset.
                </div>
              )}
            </div>

            <button onClick={handleSaveKey} disabled={!keyInput.trim() || saving}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: keyInput.trim() ? 'linear-gradient(135deg, #f97316, #eab308)' : 'rgba(255,255,255,0.08)',
                color: keyInput.trim() ? '#fff' : 'var(--text-tertiary)',
                fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s'
              }}>
              {saving ? 'Connecting...' : '✓ Save & Connect'}
            </button>

            {el.apiKey && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)' }}>
                <span style={{ fontSize: '0.78rem', color: '#34d399' }}>
                  ✅ Key saved! Go to the Voices tab to choose your voice.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── VOICES tab ── */}
        {tab === 'voices' && (
          <div>
            {!el.apiKey ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Add your ElevenLabs API key in the Setup tab to unlock natural voices.
                </p>
                <button onClick={() => setTab('setup')} style={{
                  marginTop: 12, padding: '8px 20px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)', color: '#fb923c', fontSize: '0.82rem'
                }}>Go to Setup →</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Choose a Voice ({el.voices.length} available)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {el.voices.map(v => {
                    const isSelected = el.voiceId === v.id
                    const isTesting  = testingVoice === v.id
                    return (
                      <div key={v.id}
                        onClick={() => el.setVoiceId(v.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                          background: isSelected ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.15s'
                        }}
                      >
                        {/* Radio */}
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${isSelected ? '#fb923c' : 'rgba(255,255,255,0.20)'}`,
                          background: isSelected ? '#fb923c' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>

                        {/* Meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.85rem', fontWeight: 600,
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}>
                            {v.name}
                            {isSelected && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#fb923c' }}>● Active</span>}
                          </div>
                          <div style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{v.desc} · {v.lang}</div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {v.gender && (
                            <span style={{
                              fontSize: '0.62rem', padding: '2px 7px', borderRadius: 100,
                              background: 'rgba(255,255,255,0.07)', color: 'var(--text-tertiary)'
                            }}>{v.gender === 'female' ? '♀' : '♂'}</span>
                          )}
                          {/* Test button */}
                          <button
                            onClick={e => { e.stopPropagation(); handlePreview(v.id) }}
                            disabled={isTesting || el.isLoading}
                            style={{
                              padding: '3px 10px', borderRadius: 7, fontSize: '0.68rem', cursor: 'pointer',
                              background: isTesting ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.10)',
                              border: `1px solid ${isTesting ? 'rgba(52,211,153,0.30)' : 'rgba(34,211,238,0.20)'}`,
                              color: isTesting ? '#34d399' : '#67e8f9', flexShrink: 0
                            }}
                          >
                            {isTesting ? '▶ ...' : '▶ Test'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STYLE tab ── */}
        {tab === 'style' && (
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
              Speaking Style Presets
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {STYLE_PRESETS.map(p => (
                <div key={p.label}
                  onClick={() => el.updateSettings({ stability: p.stability, similarity: p.similarity, style: p.style })}
                  style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    background: Math.abs(el.settings.style - p.style) < 0.05 ? 'rgba(124,109,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${Math.abs(el.settings.style - p.style) < 0.05 ? 'rgba(124,109,250,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{p.desc}</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'right', lineHeight: 1.6 }}>
                    <div>Stability: {p.stability}</div>
                    <div>Style: {p.style}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fine-tune sliders */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
              Fine-Tune
            </div>
            {[
              { key: 'stability',  label: 'Stability', desc: 'Lower = more expressive & varied', min: 0.1, max: 1 },
              { key: 'similarity', label: 'Clarity',   desc: 'Higher = cleaner, more consistent', min: 0.5, max: 1 },
              { key: 'style',      label: 'Expression',desc: 'Higher = more emotional & dynamic', min: 0,   max: 1 },
            ].map(sl => (
              <div key={sl.key} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{sl.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-tertiary)', fontWeight: 700 }}>{el.settings[sl.key]?.toFixed(2)}</span>
                </div>
                <input type="range" min={sl.min} max={sl.max} step={0.05}
                  value={el.settings[sl.key] ?? 0.5}
                  onChange={e => el.updateSettings({ ...el.settings, [sl.key]: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sl.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {el.isSpeaking && (
            <button onClick={el.stop} style={{
              padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(251,113,133,0.30)',
              background: 'rgba(251,113,133,0.10)', color: '#fda4af', cursor: 'pointer', fontSize: '0.82rem'
            }}>⏹ Stop</button>
          )}
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #f97316, #eab308)',
            color: '#fff', fontWeight: 700, fontSize: '0.88rem'
          }}>✓ Done</button>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
          Free tier: 10,000 characters/month · <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: '#fb923c' }}>elevenlabs.io</a>
        </div>
      </div>
    </motion.div>
  )
}
