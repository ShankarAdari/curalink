import { motion, AnimatePresence } from 'framer-motion'

// Animated audio waveform while speaking
function SpeakingWaveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
      {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 1, 0.6, 0.3].map((h, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [h, 1, h * 0.4, 0.9, h] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
          style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--accent-cyan)', transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

export default function VoiceButton({
  isListening, isSpeaking, isSupported,
  audioEnabled, onStart, onStop, onStopSpeaking, onToggleAudio
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Audio on/off toggle */}
      {isSupported && (
        <motion.button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Audio ON — click to mute' : 'Audio OFF — click to enable'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: audioEnabled ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
            borderColor: audioEnabled ? 'rgba(34,211,238,0.30)' : 'rgba(255,255,255,0.10)',
            outline: '1px solid',
            fontSize: 16, transition: 'all 0.2s'
          }}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </motion.button>
      )}

      {/* Speaking state */}
      {isSpeaking ? (
        <motion.button
          onClick={onStopSpeaking}
          title="Stop reading aloud"
          animate={{ boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 16px rgba(34,211,238,0.5)', '0 0 0 rgba(34,211,238,0)'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            height: 44, paddingInline: 14, borderRadius: 10,
            border: '1px solid rgba(34,211,238,0.40)',
            background: 'rgba(34,211,238,0.15)',
            color: '#67e8f9', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 600
          }}
        >
          <SpeakingWaveform />
          <span>Speaking</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>
        </motion.button>
      ) : isListening ? (
        <motion.button
          onClick={onStop}
          title="Stop listening"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 0.85 }}
          style={{
            height: 44, paddingInline: 16, borderRadius: 10,
            border: '1px solid rgba(251,113,133,0.45)',
            background: 'rgba(251,113,133,0.15)',
            color: '#fda4af', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600,
            boxShadow: '0 0 16px rgba(251,113,133,0.35)'
          }}
        >
          <span style={{ fontSize: 18 }}>🎙️</span>
          <span>Listening...</span>
        </motion.button>
      ) : isSupported ? (
        <motion.button
          className="btn-icon"
          onClick={onStart}
          title="Click to speak your question"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          style={{ width: 44, height: 44 }}
        >
          🎙️
        </motion.button>
      ) : null}
    </div>
  )
}
