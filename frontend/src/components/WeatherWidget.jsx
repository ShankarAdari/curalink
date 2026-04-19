import { useState, useEffect, useCallback } from 'react'
import { fetchWeather } from '../services/api'
import { motion } from 'framer-motion'

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity]     = useState('')
  const [input, setInput]   = useState('')
  const [editing, setEditing] = useState(false)

  const load = useCallback(async (c = '') => {
    setLoading(true)
    try {
      const data = await fetchWeather(c)
      setWeather(data)
      if (c) setCity(c)
    } catch { /* use cached */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    // Auto-detect city via IP geolocation (ipapi.co free)
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { const c = `${d.city},${d.country_code}`; setCity(c); load(c) })
      .catch(() => load('New York'))
  }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    if (input.trim()) { load(input.trim()); setCity(input.trim()); setInput(''); setEditing(false) }
  }

  const getHealthNote = (w) => {
    if (!w) return ''
    if (w.condition.includes('Thunderstorm')) return '⚡ Stay indoors. High risk for asthma triggers.'
    if (w.condition.includes('Snow'))         return '🧥 Cold weather worsens joint pain & COPD symptoms.'
    if (w.condition.includes('Rain'))         return '☔ Damp conditions can trigger rheumatoid arthritis flares.'
    if (w.humidity > 75)                      return '💧 High humidity — risk of mold-related respiratory issues.'
    if (w.temperature > 35)                   return '🌡️ Heat alert! Ensure hydration. Risk of heat stroke.'
    if (w.temperature < 5)                    return '🧤 Cold air can trigger asthma and cardiovascular stress.'
    return '✅ Conditions are health-friendly today.'
  }

  if (compact) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: '14px 18px',
        backdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center', gap: 12
      }}
    >
      {loading ? (
        <div className="spinner" style={{ width: 18, height: 18 }} />
      ) : weather ? (
        <>
          <span style={{ fontSize: 28 }}>{weather.icon}</span>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{weather.temperature}{weather.unit}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{weather.condition}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
            📍 {weather.city?.split(',')[0]}
          </div>
        </>
      ) : null}
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.10) 0%, rgba(124,109,250,0.08) 100%)',
        border: '1px solid rgba(34,211,238,0.18)',
        borderRadius: 24,
        padding: 24,
        backdropFilter: 'blur(32px)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Decorative bg */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(34,211,238,0.06)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌍</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Health Weather</span>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
        >
          📍 Change
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter city name..."
            autoFocus
            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: '0.85rem' }}
          />
          <button type="submit" style={{
            padding: '8px 14px', borderRadius: 10, border: 'none',
            background: 'rgba(34,211,238,0.25)', color: '#67e8f9', cursor: 'pointer', fontSize: '0.85rem'
          }}>Go</button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Fetching weather...</span>
        </div>
      ) : weather && !weather.error ? (
        <>
          {/* Main reading */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 56, lineHeight: 1 }}>{weather.icon}</span>
            <div>
              <div style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {weather.temperature}<span style={{ fontSize: '1.4rem', color: 'var(--text-tertiary)' }}>{weather.unit}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 2 }}>{weather.condition}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>📍 {weather.city}</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Feels Like', value: `${weather.feelsLike}°C`, icon: '🌡️' },
              { label: 'Humidity', value: `${weather.humidity}%`, icon: '💧' },
              { label: 'Wind', value: `${weather.windSpeed} km/h`, icon: '🌬️' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 12px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Health note */}
          <div style={{
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 12, padding: '10px 14px',
            fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5
          }}>
            {getHealthNote(weather)}
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '12px 0' }}>
          ⚠️ Could not load weather. Check your connection.
        </div>
      )}
    </motion.div>
  )
}
