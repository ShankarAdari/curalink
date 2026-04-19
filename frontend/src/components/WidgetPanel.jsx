/**
 * WidgetPanel — Slide-in right panel with health calculators & stats
 * Enhanced: Drug Interaction, Sleep Calc, BP Classifier, TDEE, Weather
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchWeather } from '../services/api'

/* ─── Animated counter ─────────────────────────────────────── */
function AnimCounter({ value, suffix = '', color = 'var(--accent-tertiary)' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let start = 0
    const end = parseInt(value)
    if (start === end) { setDisplay(end); return }
    const step = Math.ceil(end / 24)
    const t = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(t) }
      else setDisplay(start)
    }, 28)
    return () => clearInterval(t)
  }, [value])
  return <span style={{ color }}>{display}{suffix}</span>
}

/* ─── Shared input style ─────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)', color: 'var(--text-primary)',
  fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit'
}

/* ─── BMI Calculator ───────────────────────────────────────── */
function BMICalc() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult]  = useState(null)

  const calc = () => {
    const h = parseFloat(height) / 100
    const w = parseFloat(weight)
    if (!h || !w || h <= 0) return
    const bmi = w / (h * h)
    let cat, color
    if      (bmi < 18.5) { cat = 'Underweight'; color = '#38bdf8' }
    else if (bmi < 25)   { cat = 'Normal weight'; color = '#34d399' }
    else if (bmi < 30)   { cat = 'Overweight'; color = '#fbbf24' }
    else                 { cat = 'Obese'; color = '#fb7185' }
    setResult({ bmi: bmi.toFixed(1), cat, color })
  }

  const pct = result ? Math.min(100, ((parseFloat(result.bmi) - 10) / 40) * 100) : 0

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        ⚖️ BMI Calculator
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Height (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="170" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" style={inputStyle} />
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={calc}
        style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.82rem',
          background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', color: '#fff', fontWeight: 600 }}>
        Calculate BMI
      </motion.button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: result.color, letterSpacing: '-0.04em' }}>
              {result.bmi}
            </div>
            <div style={{ fontSize: '0.78rem', color: result.color, fontWeight: 600, marginBottom: 10 }}>{result.cat}</div>
            <div style={{ height: 6, borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg,#38bdf8,#34d399,#fbbf24,#fb7185)`, borderRadius: 10 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.60rem', color: 'var(--text-tertiary)' }}>
              <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Water Intake Calculator ──────────────────────────────── */
function WaterCalc() {
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)

  const calc = () => {
    const w = parseFloat(weight)
    if (!w) return
    const liters = (w * 0.033).toFixed(1)
    const glasses = Math.ceil(w * 0.033 / 0.25)
    setResult({ liters, glasses })
  }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        💧 Daily Water Intake
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (kg)"
          style={{ ...inputStyle, flex: 1 }} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={calc}
          style={{ padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.82rem',
            background: 'rgba(56,189,248,0.20)', border: '1px solid rgba(56,189,248,0.35)', color: '#38bdf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Calculate
        </motion.button>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.20)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{result.liters}L</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>per day</div>
            </div>
            <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.20)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{result.glasses}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>glasses (250ml)</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Research Stats Card ──────────────────────────────────── */
function ResearchStats({ stats }) {
  if (!stats) return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>📊 Research Stats</div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>Send a query to see live research statistics.</p>
    </div>
  )
  const items = [
    { label: 'PubMed papers', val: stats.pubmed,        color: '#22d3ee' },
    { label: 'OpenAlex papers', val: stats.openalexCount, color: '#a78bfa' },
    { label: 'Clinical trials', val: stats.trials,       color: '#34d399' },
    { label: 'Top results shown', val: (stats.rankedPubs || 0) + (stats.rankedTrials || 0), color: '#fbbf24' },
  ]
  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>📊 Live Research Stats</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ padding: '8px 10px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}28`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              <AnimCounter value={item.val} color={item.color} />
            </div>
            <div style={{ fontSize: '0.60rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>
      {stats.source && (
        <div style={{ marginTop: 10, fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: stats.source === 'ollama' ? '#34d399' : '#fbbf24' }} />
          AI source: {stats.source === 'ollama' ? '🤖 Ollama (local LLM)' : '📋 Smart template'}
        </div>
      )}
    </div>
  )
}

/* ─── Quick Symptom Chips ──────────────────────────────────── */
const SYMPTOM_GROUPS = [
  { label: 'Cardiovascular', color: '#fb7185', chips: ['Chest pain', 'Shortness of breath', 'Irregular heartbeat', 'Swollen ankles'] },
  { label: 'Neurological', color: '#a78bfa', chips: ['Severe headache', 'Memory loss', 'Dizziness', 'Tremors'] },
  { label: 'Respiratory', color: '#22d3ee', chips: ['Persistent cough', 'Wheezing', 'Bloody mucus', 'Night sweats'] },
  { label: 'Digestive', color: '#34d399', chips: ['Unexplained weight loss', 'Blood in stool', 'Severe abdominal pain', 'Jaundice'] },
  { label: 'Oncology', color: '#fbbf24', chips: ['Unexplained lumps', 'Persistent fatigue', 'Unusual bleeding', 'Skin changes'] },
]

function SymptomChecker({ onSymptom }) {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>🩺 Symptom Quick-Ask</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SYMPTOM_GROUPS.map(g => (
          <div key={g.label}>
            <button onClick={() => setOpen(open === g.label ? null : g.label)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: open === g.label ? `${g.color}18` : 'var(--glass-bg)',
                color: open === g.label ? g.color : 'var(--text-secondary)',
                fontSize: '0.76rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.15s', fontFamily: 'inherit' }}>
              {g.label}
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{open === g.label ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence>
              {open === g.label && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 0 4px 4px' }}>
                    {g.chips.map(chip => (
                      <motion.button key={chip} whileTap={{ scale: 0.94 }}
                        onClick={() => onSymptom(`What causes ${chip.toLowerCase()} and when should I be concerned?`)}
                        style={{ padding: '4px 10px', borderRadius: 100, cursor: 'pointer', fontSize: '0.70rem',
                          background: `${g.color}18`, border: `1px solid ${g.color}35`, color: g.color, fontWeight: 500, fontFamily: 'inherit' }}>
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Heart Rate Zone Calculator ───────────────────────────── */
function HeartRateZones() {
  const [age, setAge] = useState('')
  const [zones, setZones] = useState(null)

  const calc = () => {
    const a = parseInt(age)
    if (!a || a < 10 || a > 120) return
    const max = 220 - a
    setZones([
      { name: 'Rest / Recovery', range: `< ${Math.round(max * 0.50)}`, color: '#38bdf8', pct: 50 },
      { name: 'Fat Burn',        range: `${Math.round(max * 0.50)}–${Math.round(max * 0.60)}`, color: '#34d399', pct: 60 },
      { name: 'Aerobic',         range: `${Math.round(max * 0.60)}–${Math.round(max * 0.70)}`, color: '#a78bfa', pct: 70 },
      { name: 'Threshold',       range: `${Math.round(max * 0.70)}–${Math.round(max * 0.85)}`, color: '#fbbf24', pct: 85 },
      { name: 'Peak VO₂',        range: `${Math.round(max * 0.85)}–${max}`, color: '#fb7185', pct: 100 },
    ])
  }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>❤️ Heart Rate Zones</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Your age"
          style={{ ...inputStyle, flex: 1 }} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={calc}
          style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(251,113,133,0.35)', cursor: 'pointer',
            background: 'rgba(251,113,133,0.15)', color: '#fb7185', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          Calculate
        </motion.button>
      </div>
      <AnimatePresence>
        {zones && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {zones.map((z, i) => (
              <motion.div key={z.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10,
                  background: `${z.color}12`, border: `1px solid ${z.color}25` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: z.color }}>{z.name}</div>
                </div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{z.range} bpm</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Blood Pressure Classifier ────────────────────────────── */
function BPClassifier() {
  const [systolic,  setSystolic]  = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [result, setResult] = useState(null)

  const BP_CATEGORIES = [
    { label: 'Normal',         sys: [0, 120],   dia: [0, 80],   color: '#34d399', icon: '✅', advice: 'Great! Maintain a healthy lifestyle to keep it this way.' },
    { label: 'Elevated',       sys: [120, 130], dia: [0, 80],   color: '#fbbf24', icon: '⚠️', advice: 'Lifestyle changes recommended. Monitor regularly.' },
    { label: 'High Stage 1',   sys: [130, 140], dia: [80, 90],  color: '#fb923c', icon: '⚠️', advice: 'Consult your doctor. Medication may be considered.' },
    { label: 'High Stage 2',   sys: [140, 180], dia: [90, 120], color: '#fb7185', icon: '🚨', advice: 'Seek medical attention soon. Lifestyle + medication needed.' },
    { label: 'Hypertensive Crisis', sys: [180, 999], dia: [120, 999], color: '#f43f5e', icon: '🚨', advice: 'EMERGENCY: Seek immediate medical care!' },
    { label: 'Low (Hypotension)', sys: [0, 90], dia: [0, 60],   color: '#38bdf8', icon: 'ℹ️', advice: 'Low BP. Stay hydrated, rise slowly. Consult doctor if symptomatic.' },
  ]

  const classify = () => {
    const s = parseInt(systolic)
    const d = parseInt(diastolic)
    if (!s || !d || s < 40 || d < 20) return

    if (s >= 180 || d >= 120) { setResult(BP_CATEGORIES[4]); return }
    if (s < 90 || d < 60)     { setResult(BP_CATEGORIES[5]); return }
    if (s < 120 && d < 80)    { setResult(BP_CATEGORIES[0]); return }
    if (s < 130 && d < 80)    { setResult(BP_CATEGORIES[1]); return }
    if (s < 140 || d < 90)    { setResult(BP_CATEGORIES[2]); return }
    setResult(BP_CATEGORIES[3])
  }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)', marginBottom: 10 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        🩺 Blood Pressure Classifier
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Systolic (mmHg)</label>
          <input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} placeholder="120" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Diastolic (mmHg)</label>
          <input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} placeholder="80" style={inputStyle} />
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={classify}
        style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.82rem',
          background: 'linear-gradient(135deg,#fb7185,#f97316)', color: '#fff', fontWeight: 600, fontFamily: 'inherit' }}>
        Classify Blood Pressure
      </motion.button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            style={{ marginTop: 14, padding: '12px', borderRadius: 12, background: `${result.color}12`, border: `1px solid ${result.color}30`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{result.icon}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: result.color, marginBottom: 4 }}>{result.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'monospace' }}>
              {systolic}/{diastolic} <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>mmHg</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.advice}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Reference table */}
      <div style={{ marginTop: 12, fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
        <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--text-secondary)' }}>AHA Reference Ranges:</div>
        {[
          ['Normal', '< 120 / < 80', '#34d399'],
          ['Elevated', '120–129 / < 80', '#fbbf24'],
          ['Stage 1', '130–139 / 80–89', '#fb923c'],
          ['Stage 2', '≥ 140 / ≥ 90', '#fb7185'],
        ].map(([cat, range, col]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, padding: '2px 6px', borderRadius: 6, background: `${col}08` }}>
            <span style={{ color: col }}>{cat}</span>
            <span style={{ fontFamily: 'monospace' }}>{range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Sleep Calculator ──────────────────────────────────────── */
function SleepCalc() {
  const [wakeTime, setWakeTime] = useState('07:00')
  const [bedTime,  setBedTime]  = useState('23:00')
  const [mode, setMode] = useState('bedtime') // 'bedtime' or 'wakeup'
  const [cycles, setCycles] = useState(null)

  const CYCLE_MIN = 90 // one sleep cycle = ~90 min
  const FALL_ASLEEP = 14 // avg minutes to fall asleep

  const calculate = () => {
    let results = []
    if (mode === 'bedtime') {
      // I want to wake at X, when should I sleep?
      const [wh, wm] = wakeTime.split(':').map(Number)
      const wakeMinutes = wh * 60 + wm
      for (let c = 6; c >= 4; c--) {
        const sleepMin = ((wakeMinutes - c * CYCLE_MIN - FALL_ASLEEP) + 1440) % 1440
        const h = Math.floor(sleepMin / 60).toString().padStart(2, '0')
        const m = (sleepMin % 60).toString().padStart(2, '0')
        results.push({ label: `${c} cycles (${c * 1.5}h)`, time: `${h}:${m}`, cycles: c, quality: c >= 6 ? 'Optimal' : c >= 5 ? 'Good' : 'Minimum' })
      }
    } else {
      // I'm sleeping at X, when should I wake?
      const [bh, bm] = bedTime.split(':').map(Number)
      const bedMinutes = bh * 60 + bm + FALL_ASLEEP
      for (let c = 4; c <= 6; c++) {
        const wakeMin = (bedMinutes + c * CYCLE_MIN) % 1440
        const h = Math.floor(wakeMin / 60).toString().padStart(2, '0')
        const m = (wakeMin % 60).toString().padStart(2, '0')
        results.push({ label: `${c} cycles (${c * 1.5}h)`, time: `${h}:${m}`, cycles: c, quality: c >= 6 ? 'Optimal' : c >= 5 ? 'Good' : 'Minimum' })
      }
    }
    setCycles(results)
  }

  const qualityColor = { Optimal: '#34d399', Good: '#fbbf24', Minimum: '#fb7185' }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        😴 Sleep Cycle Calculator
      </div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'var(--glass-bg)', borderRadius: 10, padding: 3, border: '1px solid var(--glass-border)' }}>
        {[['bedtime', 'Find Bedtime'], ['wakeup', 'Find Wake Time']].map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setCycles(null) }}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.70rem', fontWeight: 600, fontFamily: 'inherit',
              background: mode === m ? 'rgba(167,139,250,0.25)' : 'transparent',
              color: mode === m ? '#a78bfa' : 'var(--text-tertiary)', transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>

      {mode === 'bedtime' ? (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>I want to wake up at:</label>
          <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={inputStyle} />
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>I'm going to sleep at:</label>
          <input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} style={inputStyle} />
        </div>
      )}

      <motion.button whileTap={{ scale: 0.96 }} onClick={calculate}
        style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.82rem',
          background: 'linear-gradient(135deg,#a78bfa,#7c6dfa)', color: '#fff', fontWeight: 600, marginBottom: 10, fontFamily: 'inherit' }}>
        Calculate Sleep Times
      </motion.button>

      <AnimatePresence>
        {cycles && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', marginBottom: 7 }}>
              {mode === 'bedtime' ? '🛏️ Best times to go to sleep:' : '⏰ Best times to wake up:'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {cycles.map((c, i) => (
                <motion.div key={c.time} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10,
                    background: `${qualityColor[c.quality]}10`, border: `1px solid ${qualityColor[c.quality]}28` }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: qualityColor[c.quality], fontFamily: 'monospace' }}>{c.time}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{c.label}</div>
                  </div>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                    background: `${qualityColor[c.quality]}20`, color: qualityColor[c.quality] }}>{c.quality}</span>
                </motion.div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '0.62rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              ℹ️ Based on 90-min sleep cycles + ~14 min to fall asleep. Waking between cycles feels more refreshing.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── TDEE / Calorie Calculator ─────────────────────────────── */
function CalorieCalc() {
  const [weight, setWeight]   = useState('')
  const [height, setHeight]   = useState('')
  const [age,    setAge]      = useState('')
  const [sex,    setSex]      = useState('male')
  const [activity, setActivity] = useState('1.55')
  const [result, setResult]   = useState(null)

  const ACTIVITY = [
    { val: '1.2',  label: 'Sedentary (desk job)' },
    { val: '1.375',label: 'Light (1-3x/week)' },
    { val: '1.55', label: 'Moderate (3-5x/week)' },
    { val: '1.725',label: 'Active (6-7x/week)' },
    { val: '1.9',  label: 'Very active (athlete)' },
  ]

  const calc = () => {
    const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age), act = parseFloat(activity)
    if (!w || !h || !a) return
    // Mifflin-St Jeor
    const bmr = sex === 'male'
      ? (10 * w) + (6.25 * h) - (5 * a) + 5
      : (10 * w) + (6.25 * h) - (5 * a) - 161
    const tdee = bmr * act
    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      cut: Math.round(tdee - 500),
      bulk: Math.round(tdee + 300),
    })
  }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        🔥 TDEE / Calorie Calculator
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[['Weight (kg)', weight, setWeight, '70'], ['Height (cm)', height, setHeight, '170'],
          ['Age', age, setAge, '30']].map(([label, val, setter, ph], i) => i < 2 ? (
          <div key={label}>
            <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 3 }}>{label}</label>
            <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder={ph} style={inputStyle} />
          </div>
        ) : null)}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 3 }}>Age</label>
        <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" style={inputStyle} />
      </div>
      {/* Sex toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
        {[['male','♂ Male'], ['female','♀ Female']].map(([v, l]) => (
          <button key={v} onClick={() => setSex(v)}
            style={{ flex: 1, padding: '5px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.70rem', fontWeight: 600, fontFamily: 'inherit',
              background: sex === v ? 'rgba(251,191,36,0.22)' : 'transparent',
              color: sex === v ? '#fbbf24' : 'var(--text-tertiary)', transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 3 }}>Activity Level</label>
        <select value={activity} onChange={e => setActivity(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {ACTIVITY.map(a => <option key={a.val} value={a.val}>{a.label}</option>)}
        </select>
      </div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={calc}
        style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.82rem',
          background: 'linear-gradient(135deg,#fbbf24,#f97316)', color: '#fff', fontWeight: 600, fontFamily: 'inherit' }}>
        Calculate Calories
      </motion.button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'BMR', val: result.bmr, color: '#38bdf8', note: 'at rest' },
                { label: 'Maintenance', val: result.tdee, color: '#fbbf24', note: 'TDEE' },
                { label: 'Fat Loss', val: result.cut, color: '#34d399', note: '−500 kcal/day' },
                { label: 'Muscle Gain', val: result.bulk, color: '#a78bfa', note: '+300 kcal/day' },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px', borderRadius: 10, background: `${item.color}10`, border: `1px solid ${item.color}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: '0.60rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{item.note}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '0.60rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              📊 Based on Mifflin-St Jeor equation. Adjust based on your progress.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Weather Widget ────────────────────────────────────────── */
function WeatherWidget() {
  const [city,    setCity]   = useState('')
  const [weather, setWeather]= useState(null)
  const [loading, setLoading]= useState(false)
  const [error,   setError]  = useState(null)

  const fetch_ = async () => {
    if (!city.trim()) return
    setLoading(true); setError(null)
    try {
      const data = await fetchWeather(city)
      if (data.error && !data.temperature) { setError('City not found'); setWeather(null) }
      else setWeather(data)
    } catch { setError('Weather unavailable') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '14px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        🌤️ Health-Weather Check
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city name…"
          onKeyDown={e => e.key === 'Enter' && fetch_()}
          style={{ ...inputStyle, flex: 1 }} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={fetch_} disabled={loading}
          style={{ padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.82rem',
            background: 'rgba(34,211,238,0.18)', border: '1px solid rgba(34,211,238,0.35)',
            color: '#22d3ee', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1 }}>
          {loading ? '…' : 'Search'}
        </motion.button>
      </div>
      {error && <div style={{ fontSize: '0.76rem', color: '#fb7185', marginBottom: 8 }}>⚠️ {error}</div>}
      <AnimatePresence>
        {weather && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div style={{ textAlign: 'center', padding: '12px', borderRadius: 14, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.18)', marginBottom: 10 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>{weather.icon}</div>
              <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{weather.city}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#22d3ee', letterSpacing: '-0.04em' }}>
                {weather.temperature}{weather.unit}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{weather.condition}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Feels like {weather.feelsLike}°C</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { icon: '💧', label: 'Humidity', val: `${weather.humidity}%` },
                { icon: '💨', label: 'Wind', val: `${weather.windSpeed} km/h` },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px', borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.val}</div>
                  <div style={{ fontSize: '0.60rem', color: 'var(--text-tertiary)' }}>{item.label}</div>
                </div>
              ))}
            </div>
            {/* Health tips based on weather */}
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>💡 Health Advisory</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {weather.temperature > 35
                  ? '🔥 Extreme heat: Stay hydrated, avoid outdoor activity 11am–4pm. Heat stroke risk!'
                  : weather.temperature < 5
                  ? '❄️ Cold weather: Dress in layers. Hypothermia risk for elderly & children.'
                  : weather.humidity > 80
                  ? '💧 High humidity: Respiratory conditions may worsen. Stay indoors if asthmatic.'
                  : weather.condition?.includes('Storm') || weather.condition?.includes('Thunder')
                  ? '⛈️ Storm: Avoid outdoor activity. High accident risk.'
                  : '✅ Conditions are comfortable for outdoor activity and exercise.'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN WIDGET PANEL
═══════════════════════════════════════════════════════════════ */
export default function WidgetPanel({ isOpen, onClose, stats, onSymptom }) {
  const TABS = [
    { id: '📊 Stats',    label: '📊 Stats' },
    { id: '🩺 Symptoms', label: '🩺 Symptoms' },
    { id: '⚖️ BMI',      label: '⚖️ BMI' },
    { id: '🩺 BP',       label: '🩸 BP' },
    { id: '😴 Sleep',    label: '😴 Sleep' },
    { id: '🔥 Calories', label: '🔥 Calories' },
    { id: '❤️ HR',       label: '❤️ HR' },
    { id: '💧 Water',    label: '💧 Water' },
    { id: '🌤️ Weather',  label: '🌤️ Weather' },
  ]
  const [tab, setTab] = useState('📊 Stats')

  // Reset to stats tab when new stats arrive
  useEffect(() => { if (stats) setTab('📊 Stats') }, [stats])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div key="wp-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)' }} />

          {/* Panel */}
          <motion.div key="wp-panel"
            initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0, width: 330, zIndex: 50,
              background: 'var(--sidebar-bg, rgba(8,8,16,0.97))',
              backdropFilter: 'blur(40px)',
              borderLeft: '1px solid var(--glass-border)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
            }}>

            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>🏥 Health Widgets</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Calculators & live research data</div>
              </div>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
            </div>

            {/* Tab bar — horizontal scroll */}
            <div style={{ display: 'flex', gap: 4, padding: '10px 12px 0', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
              {TABS.map(t => (
                <motion.button key={t.id} whileTap={{ scale: 0.95 }} onClick={() => setTab(t.id)}
                  style={{ padding: '5px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: '0.70rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.15s',
                    background: tab === t.id ? 'rgba(124,109,250,0.22)' : 'var(--glass-bg)',
                    color: tab === t.id ? 'var(--accent-tertiary)' : 'var(--text-tertiary)',
                    outline: `1px solid ${tab === t.id ? 'rgba(124,109,250,0.35)' : 'var(--glass-border)'}`,
                    fontFamily: 'inherit' }}>
                  {t.label}
                </motion.button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 20px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}>
                  {tab === '📊 Stats'    && <ResearchStats stats={stats} />}
                  {tab === '🩺 Symptoms' && <SymptomChecker onSymptom={(q) => { onSymptom(q); onClose() }} />}
                  {tab === '⚖️ BMI'      && <BMICalc />}
                  {tab === '🩺 BP'       && <BPClassifier />}
                  {tab === '😴 Sleep'    && <SleepCalc />}
                  {tab === '🔥 Calories' && <CalorieCalc />}
                  {tab === '❤️ HR'       && <HeartRateZones />}
                  {tab === '💧 Water'    && <WaterCalc />}
                  {tab === '🌤️ Weather'  && <WeatherWidget />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
