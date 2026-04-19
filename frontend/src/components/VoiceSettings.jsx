import { useState } from 'react'
import { motion } from 'framer-motion'

const RATE_LABELS  = { 0.70: 'Slow', 0.80: 'Relaxed', 0.92: 'Natural', 1.00: 'Brisk', 1.10: 'Fast' }
const PITCH_LABELS = { 0.85: 'Deep', 0.93: 'Low', 1.00: 'Normal', 1.08: 'High', 1.15: 'Light' }

export default function VoiceSettings({ voice, rate, pitch, onRateChange, onPitchChange, onClose }) {
  const [tab, setTab] = useState('voice') // 'voice' | 'speed' | 'pitch'

  // Show English voices first, then all others
  const allVoices     = voice.availableVoices
  const enVoices      = allVoices.filter(v => v.lang.startsWith('en'))
  const otherVoices   = allVoices.filter(v => !v.lang.startsWith('en'))
  const bestVoice     = voice.getBestVoice?.()

  const groups = [
    { label: '🇺🇸 English Voices (Recommended)', voices: enVoices,    highlight: true },
    { label: '🌍 Other Language Voices',          voices: otherVoices, highlight: false },
  ].filter(g => g.voices.length > 0)

  const testSpeak = (v) => {
    window.speechSynthesis?.cancel()
    const utt = new SpeechSynthesisUtterance(
      'Hello! I am Curalink, your AI medical research companion. How can I help you today?'
    )
    utt.voice  = v
    utt.rate   = rate
    utt.pitch  = pitch
    utt.lang   = v.lang
    utt.volume = 1
    window.speechSynthesis?.speak(utt)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 20 }}
      style={{
        background: 'var(--sidebar-bg, rgba(12,12,22,0.97))',
        border: '1px solid var(--glass-border)',
        borderRadius: 28, padding: 28,
        width: '100%', maxWidth: 500, maxHeight: '82vh',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>🎙️ Voice Settings</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {allVoices.length} voices loaded · {enVoices.length} English
            {bestVoice && <> · <span style={{ color: 'var(--accent-tertiary)' }}>Auto: {bestVoice.name.slice(0, 22)}</span></>}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 10,
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)', color: 'var(--text-tertiary)',
          cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'var(--glass-bg)', borderRadius: 12, padding: 4 }}>
        {[
          { id: 'voice', label: '🗣️ Voice Model' },
          { id: 'speed', label: '⏱️ Speed' },
          { id: 'pitch', label: '🎵 Pitch' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '7px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s',
            background: tab === t.id ? 'rgba(124,109,250,0.25)' : 'transparent',
            color: tab === t.id ? 'var(--accent-tertiary)' : 'var(--text-tertiary)'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Voice selector ── */}
      {tab === 'voice' && (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allVoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔇</div>
              <p style={{ fontSize: '0.85rem' }}>
                No voices loaded yet.<br />
                Try clicking the 🔊 audio button to trigger voice loading, then reopen this panel.
              </p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.label} style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', marginBottom: 8,
                  color: group.highlight ? 'var(--accent-tertiary)' : 'var(--text-tertiary)',
                }}>{group.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.voices.map(v => {
                    const isSelected = voice.selectedVoice?.name === v.name
                    const isAuto     = !voice.selectedVoice && bestVoice?.name === v.name
                    return (
                      <div key={v.name}
                        onClick={() => voice.setSelectedVoice(isSelected ? null : v)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                          background: isSelected ? 'rgba(124,109,250,0.15)' : isAuto ? 'rgba(124,109,250,0.07)' : 'var(--glass-bg)',
                          border: `1px solid ${isSelected ? 'rgba(124,109,250,0.40)' : isAuto ? 'rgba(124,109,250,0.20)' : 'var(--glass-border)'}`,
                        }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.12)',
                          border: `2px solid ${isSelected ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.22)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {v.name.replace('Microsoft', 'MS').replace('Online (Natural)', '✨').replace('(Natural)', '✨')}
                            {isAuto && <span style={{ fontSize: '0.65rem', color: 'var(--accent-tertiary)', marginLeft: 6 }}>● AUTO</span>}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>{v.lang}</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); testSpeak(v) }}
                          style={{ padding: '3px 10px', borderRadius: 7, fontSize: '0.7rem', cursor: 'pointer',
                            background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.25)',
                            color: '#67e8f9', flexShrink: 0 }}>
                          ▶ Test
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Speed slider ── */}
      {tab === 'speed' && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-tertiary)' }}>{rate}×</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {RATE_LABELS[rate] || 'Custom'} speed
            </div>
          </div>
          <input type="range" min="0.60" max="1.20" step="0.05" value={rate}
            onChange={e => onRateChange(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: 20 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(RATE_LABELS).map(([r, label]) => (
              <button key={r} onClick={() => onRateChange(parseFloat(r))} style={{
                padding: '8px 4px', borderRadius: 10, fontSize: '0.75rem', cursor: 'pointer',
                background: Math.abs(rate - parseFloat(r)) < 0.01 ? 'rgba(124,109,250,0.25)' : 'var(--glass-bg)',
                border: `1px solid ${Math.abs(rate - parseFloat(r)) < 0.01 ? 'rgba(124,109,250,0.40)' : 'var(--glass-border)'}`,
                color: Math.abs(rate - parseFloat(r)) < 0.01 ? 'var(--accent-tertiary)' : 'var(--text-secondary)'
              }}>
                <div>{r}×</div>
                <div style={{ fontSize: '0.62rem', marginTop: 2 }}>{label}</div>
              </button>
            ))}
          </div>
          <button onClick={() => {
            const utt = new SpeechSynthesisUtterance('This is how I sound at this speed. How can I help with your medical research today?')
            utt.rate = rate; utt.lang = 'en-US'
            const v = voice.selectedVoice || voice.getBestVoice?.()
            if (v) utt.voice = v
            window.speechSynthesis?.cancel(); window.speechSynthesis?.speak(utt)
          }} style={{ width: '100%', marginTop: 20, padding: '10px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.25)', color: '#67e8f9', fontSize: '0.85rem' }}>
            ▶ Preview this speed
          </button>
        </div>
      )}

      {/* ── Pitch slider ── */}
      {tab === 'pitch' && (
        <div style={{ padding: '10px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{pitch}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {PITCH_LABELS[pitch] || 'Custom'} pitch
            </div>
          </div>
          <input type="range" min="0.75" max="1.25" step="0.05" value={pitch}
            onChange={e => onPitchChange(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: 20 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(PITCH_LABELS).map(([p, label]) => (
              <button key={p} onClick={() => onPitchChange(parseFloat(p))} style={{
                padding: '8px 4px', borderRadius: 10, fontSize: '0.75rem', cursor: 'pointer',
                background: Math.abs(pitch - parseFloat(p)) < 0.01 ? 'rgba(167,139,250,0.25)' : 'var(--glass-bg)',
                border: `1px solid ${Math.abs(pitch - parseFloat(p)) < 0.01 ? 'rgba(167,139,250,0.40)' : 'var(--glass-border)'}`,
                color: Math.abs(pitch - parseFloat(p)) < 0.01 ? '#c4b5fd' : 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.62rem', marginTop: 2 }}>{p}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button onClick={() => { voice.setSelectedVoice(null); onRateChange(0.92); onPitchChange(1.0) }}
          className="btn btn-glass" style={{ flex: 1, fontSize: '0.82rem' }}>
          Reset Defaults
        </button>
        <button onClick={onClose} className="btn btn-primary" style={{ flex: 2, fontSize: '0.82rem' }}>
          ✓ Save & Close
        </button>
      </div>
    </motion.div>
  )
}
