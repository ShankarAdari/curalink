import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

// Animated waveform for speaking messages
function MiniWaveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[0.5, 1, 0.7, 1, 0.4].map((h, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [h, 1, h * 0.3, 0.8, h] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
          style={{ width: 2, height: 12, borderRadius: 1, background: '#67e8f9', transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

export default function ChatBubble({ message, isTyping = false, isSpeaking = false }) {
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}
      >
        {/* Avatar */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 0 16px rgba(124,109,250,0.4)'
          }}
        >⚕️</motion.div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '18px 18px 18px 4px',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            Researching & analyzing...
          </span>
        </div>
      </motion.div>
    )
  }

  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12, marginBottom: 22,
        alignItems: 'flex-end'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: isUser
          ? 'rgba(255,255,255,0.10)'
          : 'linear-gradient(135deg,#7c6dfa,#22d3ee)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isUser ? 15 : 18,
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: isUser ? 'none' : '0 0 12px rgba(124,109,250,0.25)'
      }}>
        {isUser ? '👤' : '⚕️'}
      </div>

      <div style={{ maxWidth: '76%', minWidth: 0 }}>
        {/* Label */}
        <div style={{
          fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 500,
          marginBottom: 5, paddingInline: 4,
          textAlign: isUser ? 'right' : 'left'
        }}>
          {isUser ? 'You' : 'Curalink AI'}
          {!isUser && isSpeaking && (
            <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#67e8f9' }}>
              <MiniWaveform /> Speaking...
            </span>
          )}
        </div>

        {/* Bubble */}
        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(124,109,250,0.25), rgba(167,139,250,0.18))'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isUser ? 'rgba(124,109,250,0.30)' : 'rgba(255,255,255,0.09)'}`,
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          padding: '14px 18px',
          backdropFilter: 'blur(20px)',
        }}>
          {isUser ? (
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
              {message.content}
            </p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
          flexDirection: isUser ? 'row-reverse' : 'row',
          paddingInline: 4
        }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && message.llmSource && (
            <span className="badge badge-purple" style={{ fontSize: '0.60rem', padding: '1px 7px' }}>
              🤖 {message.llmSource === 'ollama' ? 'Ollama AI' : message.llmSource === 'huggingface' ? 'HuggingFace' : 'Curalink AI'}
            </span>
          )}
          {!isUser && message.queryInfo?.disease && (
            <span className="badge badge-cyan" style={{ fontSize: '0.60rem', padding: '1px 7px' }}>
              🔬 {message.queryInfo.disease}
            </span>
          )}
          {!isUser && message.publications?.length > 0 && (
            <span className="badge badge-green" style={{ fontSize: '0.60rem', padding: '1px 7px' }}>
              📚 {message.publications.length} papers
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
