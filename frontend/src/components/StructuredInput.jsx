import { useState } from 'react'
import { motion } from 'framer-motion'

const DISEASES = [
  'Lung Cancer', "Parkinson's Disease", "Alzheimer's Disease",
  'Heart Disease', 'Type 2 Diabetes', 'Multiple Sclerosis',
  'Breast Cancer', 'Prostate Cancer', 'Rheumatoid Arthritis', 'Other'
]

export default function StructuredInput({ initialContext = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initialContext.name || '',
    disease: initialContext.disease || '',
    customDisease: '',
    query: initialContext.query || '',
    location: initialContext.location || '',
    age: initialContext.age || '',
    gender: initialContext.gender || '',
  })
  const [useCustom, setUseCustom] = useState(
    initialContext.disease && !DISEASES.includes(initialContext.disease)
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    const disease = useCustom ? form.customDisease : form.disease
    onSave({ ...form, disease })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 20 }}
      style={{
        background: 'rgba(15,15,26,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28, padding: 32,
        width: '100%', maxWidth: 480,
        backdropFilter: 'blur(40px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>👤 Patient Context</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Personalize research for better results
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Patient Name (optional)
          </label>
          <input
            id="ctx-name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. John Smith"
          />
        </div>

        {/* Disease */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Disease / Condition *
          </label>
          {!useCustom ? (
            <select
              id="ctx-disease"
              value={form.disease}
              onChange={e => { if (e.target.value === 'Other') setUseCustom(true); else set('disease', e.target.value) }}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: form.disease ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '0.95rem', cursor: 'pointer',
                fontFamily: 'var(--font)', outline: 'none', appearance: 'none'
              }}
            >
              <option value="" style={{ background: '#0f0f1a' }}>Select condition...</option>
              {DISEASES.map(d => (
                <option key={d} value={d} style={{ background: '#0f0f1a' }}>{d}</option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="ctx-disease-custom"
                value={form.customDisease}
                onChange={e => set('customDisease', e.target.value)}
                placeholder="Type disease name..."
                autoFocus
                style={{ flex: 1 }}
              />
              <button
                onClick={() => { setUseCustom(false); set('disease', '') }}
                style={{
                  padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem'
                }}
              >↩</button>
            </div>
          )}
        </div>

        {/* Additional query */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Specific Query / Treatment
          </label>
          <input
            id="ctx-query"
            value={form.query}
            onChange={e => set('query', e.target.value)}
            placeholder="e.g. Deep Brain Stimulation"
          />
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Location (for trial matching)
          </label>
          <input
            id="ctx-location"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="e.g. Toronto, Canada"
          />
        </div>

        {/* Age + Gender row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Age</label>
            <input
              id="ctx-age"
              type="number"
              value={form.age}
              onChange={e => set('age', e.target.value)}
              placeholder="e.g. 52"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Gender</label>
            <select
              id="ctx-gender"
              value={form.gender}
              onChange={e => set('gender', e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: form.gender ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '0.95rem', fontFamily: 'var(--font)', outline: 'none', appearance: 'none'
              }}
            >
              <option value="" style={{ background: '#0f0f1a' }}>Select...</option>
              <option style={{ background: '#0f0f1a' }}>Male</option>
              <option style={{ background: '#0f0f1a' }}>Female</option>
              <option style={{ background: '#0f0f1a' }}>Non-binary</option>
              <option style={{ background: '#0f0f1a' }}>Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          className="btn btn-glass"
          onClick={onClose}
          style={{ flex: 1 }}
        >Cancel</button>
        <button
          id="ctx-save-btn"
          className="btn btn-primary"
          onClick={handleSave}
          style={{ flex: 2 }}
          disabled={!form.disease && !form.customDisease}
        >
          Save Context →
        </button>
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 12 }}>
        🔒 Your context is stored locally only
      </p>
    </motion.div>
  )
}
