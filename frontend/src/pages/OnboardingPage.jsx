/**
 * CURALINK — Onboarding / Intake Page
 * First thing the user sees. Collects patient context then launches research.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const DISEASES = [
  "Parkinson's Disease", "Alzheimer's Disease", 'Lung Cancer', 'Breast Cancer',
  'Prostate Cancer', 'Heart Disease', 'Type 2 Diabetes', 'Multiple Sclerosis',
  'Rheumatoid Arthritis', 'COPD', 'Stroke', 'Epilepsy', 'Other'
]

const EXAMPLE_QUERIES = [
  'Deep Brain Stimulation', 'Immunotherapy', 'Gene Therapy',
  'Clinical trials near me', 'Latest treatments 2025', 'Side effects of medication',
]

const FEATURES = [
  { icon: '🔬', text: '100+ papers analyzed per query' },
  { icon: '🏥', text: 'Live ClinicalTrials.gov matching' },
  { icon: '🧠', text: 'AI synthesis — no hallucinations' },
  { icon: '📍', text: 'Location-aware trial filtering' },
  { icon: '📋', text: 'Structured, source-backed answers' },
  { icon: '📤', text: 'Export as .txt or .json for your doctor' },
]

// Animated floating orbs
function Orbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {[
        { size: 600, top: '-15%', left: '-10%', color: 'rgba(124,109,250,0.18)', duration: 22 },
        { size: 500, bottom: '-20%', right: '-12%', color: 'rgba(34,211,238,0.14)', duration: 28 },
        { size: 350, top: '30%',  right: '5%',   color: 'rgba(167,139,250,0.12)', duration: 18 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', borderRadius: '50%',
            width: orb.size, height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(60px)',
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
          }}
        />
      ))}
    </div>
  )
}

// Floating step indicator
function StepDot({ active, done }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%', transition: 'all 0.35s',
      background: done ? '#22d3ee' : active ? '#7c6dfa' : 'rgba(255,255,255,0.15)',
      boxShadow: active ? '0 0 12px rgba(124,109,250,0.7)' : done ? '0 0 8px rgba(34,211,238,0.5)' : 'none',
    }} />
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0) // 0=name, 1=disease, 2=query, 3=location
  const [form, setForm]         = useState({ name: '', disease: '', customDisease: '', query: '', location: '' })
  const [useCustom, setUseCustom] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const disease = useCustom ? form.customDisease : form.disease

  // Field configs per step
  const steps = [
    { field: 'name', label: 'What is your name?', placeholder: 'e.g. John Smith', hint: 'We use this to personalize your research experience', icon: '👤', required: false },
    { field: 'disease', label: 'What condition are you researching?', placeholder: '', hint: 'We\'ll search 100+ publications tailored to this condition', icon: '🧬', required: true },
    { field: 'query', label: 'Any specific treatment or topic?', placeholder: 'e.g. Deep Brain Stimulation', hint: 'Optional — helps narrow the research focus', icon: '🔍', required: false },
    { field: 'location', label: 'Where are you located?', placeholder: 'e.g. Toronto, Canada', hint: 'Used to find nearby clinical trials', icon: '📍', required: false },
  ]

  const currentStep = steps[step]
  const isLastStep  = step === steps.length - 1
  const canProceed  = step === 1 ? !!disease : true // disease is required

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => setStep(s => s - 1)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && canProceed) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleSubmit = () => {
    setSubmitting(true)
    const ctx = {
      name:     form.name.trim(),
      disease:  disease.trim(),
      query:    form.query.trim(),
      location: form.location.trim(),
    }
    // Build the initial query
    const queryParts = []
    if (ctx.query)   queryParts.push(ctx.query)
    if (ctx.disease) queryParts.push(`for ${ctx.disease}`)
    if (ctx.location) queryParts.push(`in ${ctx.location}`)
    const autoQuery = queryParts.length
      ? queryParts.join(' ')
      : `Latest research and treatments for ${ctx.disease || 'my condition'}`

    setTimeout(() => {
      navigate('/chat', { state: { patientCtx: ctx, autoQuery } })
    }, 600)
  }

  // Stagger entrance animation
  useEffect(() => {
    setShowExamples(false)
    const t = setTimeout(() => setShowExamples(true), 350)
    return () => clearTimeout(t)
  }, [step])

  return (
    <div style={{
      minHeight: '100vh', background: '#09090f',
      color: '#e2e8f0', fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex', alignItems: 'stretch', position: 'relative', overflow: 'hidden'
    }}>
      <Orbs />

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '42%', minWidth: 340,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', zIndex: 1,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.015)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 60 }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, #7c6dfa, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 32px rgba(124,109,250,0.45)'
          }}>⚕️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Curalink
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
              AI Medical Research Assistant
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 style={{
            fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.04em', marginBottom: 16,
            background: 'linear-gradient(135deg, #fff 30%, #7c6dfa 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Your personal<br />medical research<br />companion.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.75, maxWidth: 340, marginBottom: 48 }}>
            Answer 4 quick questions and we'll search 100+ research papers,
            match clinical trials to your location, and deliver structured,
            source-backed insights in seconds.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(124,109,250,0.12)', border: '1px solid rgba(124,109,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>{f.icon}</div>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom disclaimer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ position: 'absolute', bottom: 32, fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)', maxWidth: 320 }}
        >
          🔒 All data stays local · For research purposes only — not medical advice
        </motion.p>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', zIndex: 1
      }}>

        {/* Step progress dots */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 52 }}>
          {steps.map((_, i) => (
            <StepDot key={i} active={i === step} done={i < step} />
          ))}
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 480 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Step header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px', borderRadius: 100,
                  background: 'rgba(124,109,250,0.12)', border: '1px solid rgba(124,109,250,0.25)',
                  color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18
                }}>
                  <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>●</span>
                  Step {step + 1} of {steps.length}
                </div>

                <h2 style={{
                  fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.25,
                  letterSpacing: '-0.035em', marginBottom: 10,
                  background: 'linear-gradient(135deg, #fff, #c4b5fd)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {currentStep.icon} {currentStep.label}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  {currentStep.hint}
                  {!currentStep.required && <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>(optional)</span>}
                </p>
              </div>

              {/* Disease step — dropdown */}
              {step === 1 ? (
                <div style={{ marginBottom: 28 }}>
                  {!useCustom ? (
                    <div style={{ position: 'relative' }}>
                      <select
                        id="ob-disease"
                        value={form.disease}
                        onChange={e => {
                          if (e.target.value === 'Other') { setUseCustom(true); set('disease', '') }
                          else set('disease', e.target.value)
                        }}
                        autoFocus
                        style={{
                          width: '100%', padding: '18px 20px', borderRadius: 18,
                          background: 'rgba(255,255,255,0.05)',
                          border: `2px solid ${form.disease ? 'rgba(124,109,250,0.55)' : 'rgba(255,255,255,0.10)'}`,
                          color: form.disease ? '#fff' : 'rgba(255,255,255,0.35)',
                          fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
                          appearance: 'none', cursor: 'pointer', transition: 'border-color 0.2s',
                          boxShadow: form.disease ? '0 0 0 3px rgba(124,109,250,0.12)' : 'none'
                        }}
                      >
                        <option value="" style={{ background: '#13131f' }}>Select a condition…</option>
                        {DISEASES.map(d => (
                          <option key={d} value={d} style={{ background: '#13131f' }}>{d}</option>
                        ))}
                      </select>
                      <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>▼</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        id="ob-disease-custom"
                        value={form.customDisease}
                        onChange={e => set('customDisease', e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your condition…"
                        autoFocus
                        style={inputStyle(!!form.customDisease)}
                      />
                      <button
                        onClick={() => { setUseCustom(false); set('customDisease', '') }}
                        style={{ padding: '0 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >↩</button>
                    </div>
                  )}
                </div>
              ) : step === 2 ? (
                // Query step with example chips
                <div style={{ marginBottom: 28 }}>
                  <input
                    id="ob-query"
                    value={form.query}
                    onChange={e => set('query', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    autoFocus
                    style={inputStyle(!!form.query)}
                  />
                  <AnimatePresence>
                    {showExamples && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ marginTop: 14 }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Quick examples
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {EXAMPLE_QUERIES.map(q => (
                            <button
                              key={q}
                              onClick={() => set('query', q)}
                              style={{
                                padding: '6px 13px', borderRadius: 100, cursor: 'pointer',
                                fontSize: '0.74rem', fontWeight: 500, fontFamily: 'inherit',
                                background: form.query === q ? 'rgba(124,109,250,0.25)' : 'rgba(255,255,255,0.06)',
                                color: form.query === q ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                                border: `1px solid ${form.query === q ? 'rgba(124,109,250,0.40)' : 'rgba(255,255,255,0.08)'}`,
                                transition: 'all 0.15s'
                              }}
                            >{q}</button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Name / Location steps — simple text input
                <div style={{ marginBottom: 28 }}>
                  <input
                    id={`ob-${currentStep.field}`}
                    value={form[currentStep.field]}
                    onChange={e => set(currentStep.field, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    autoFocus
                    style={inputStyle(!!form[currentStep.field])}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {step > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleBack}
                    style={{
                      padding: '15px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)',
                      cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: 600
                    }}
                  >← Back</motion.button>
                )}

                <motion.button
                  id="ob-next-btn"
                  whileHover={canProceed ? { scale: 1.02, y: -1 } : {}}
                  whileTap={canProceed ? { scale: 0.97 } : {}}
                  onClick={handleNext}
                  disabled={!canProceed || submitting}
                  style={{
                    flex: 1, padding: '16px 28px', borderRadius: 16, border: 'none',
                    cursor: canProceed && !submitting ? 'pointer' : 'not-allowed',
                    fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit',
                    background: canProceed
                      ? 'linear-gradient(135deg, #7c6dfa, #22d3ee)'
                      : 'rgba(255,255,255,0.07)',
                    color: canProceed ? '#fff' : 'rgba(255,255,255,0.25)',
                    boxShadow: canProceed ? '0 8px 28px rgba(124,109,250,0.40)' : 'none',
                    transition: 'all 0.25s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                      />
                      Launching Research…
                    </>
                  ) : isLastStep ? (
                    <>🚀 Begin My Research</>
                  ) : (
                    <>Continue →</>
                  )}
                </motion.button>

                {!currentStep.required && !isLastStep && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    style={{
                      padding: '15px 18px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.10)',
                      background: 'transparent', color: 'rgba(255,255,255,0.30)',
                      cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >Skip</motion.button>
                )}
              </div>

              {/* Press Enter hint */}
              {canProceed && !submitting && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', marginTop: 14, fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)' }}
                >
                  Press <kbd style={{ padding: '1px 7px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', fontSize: '0.66rem' }}>Enter ↵</kbd> to continue
                </motion.p>
              )}

              {/* Summary preview (final step) */}
              {isLastStep && (form.name || disease || form.query) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 24, padding: '16px 20px', borderRadius: 16,
                    background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.18)'
                  }}
                >
                  <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Research Profile Preview
                  </div>
                  {[
                    { label: 'Patient', value: form.name || '—' },
                    { label: 'Condition', value: disease || '—' },
                    { label: 'Focus', value: form.query || 'General research' },
                    { label: 'Location', value: form.location || '—' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</span>
                      <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Skip all → go directly to chat */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          onClick={() => navigate('/chat')}
          style={{
            position: 'absolute', bottom: 28,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.22)',
            fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3
          }}
        >
          Skip setup — go straight to chat
        </motion.button>
      </div>
    </div>
  )
}

// Shared input style helper
function inputStyle(hasValue) {
  return {
    width: '100%', padding: '18px 20px', borderRadius: 18,
    background: 'rgba(255,255,255,0.05)',
    border: `2px solid ${hasValue ? 'rgba(124,109,250,0.55)' : 'rgba(255,255,255,0.10)'}`,
    color: '#fff', fontSize: '1rem', fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    boxShadow: hasValue ? '0 0 0 3px rgba(124,109,250,0.12)' : 'none',
  }
}
