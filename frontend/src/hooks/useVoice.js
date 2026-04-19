/**
 * useVoice — English-only robust TTS + STT
 * - Automatically selects best English voice (Google US > Microsoft > any EN)
 * - Explicit microphone permission request with feedback
 * - Chunked sentence delivery to avoid Chrome's 15s utterance limit
 * - Clean state management with proper cleanup
 */
import { useState, useRef, useCallback, useEffect } from 'react'

export function useVoice({ onFinalTranscript, onInterimTranscript, onEnd } = {}) {
  const [isListening,     setIsListening]     = useState(false)
  const [isSpeaking,      setIsSpeaking]      = useState(false)
  const [audioEnabled,    setAudioEnabled]    = useState(true)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice,   setSelectedVoice]   = useState(null)
  const [permissionState, setPermissionState] = useState('unknown') // 'unknown'|'granted'|'denied'

  const recognitionRef = useRef(null)
  const isSpeakingRef  = useRef(false)
  const onFinalRef     = useRef(onFinalTranscript)
  const onInterimRef   = useRef(onInterimTranscript)
  const onEndRef       = useRef(onEnd)

  useEffect(() => { onFinalRef.current   = onFinalTranscript   }, [onFinalTranscript])
  useEffect(() => { onInterimRef.current = onInterimTranscript }, [onInterimTranscript])
  useEffect(() => { onEndRef.current     = onEnd               }, [onEnd])

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
  const isSTTSupported = !!SpeechRecognitionCtor
  const isTTSSupported = 'speechSynthesis' in window
  const isSupported    = isSTTSupported || isTTSSupported

  // ── Load voices ───────────────────────────────────────────────────────────
  const loadVoices = useCallback(() => {
    if (!isTTSSupported) return
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) setAvailableVoices(v)
  }, [isTTSSupported])

  useEffect(() => {
    if (!isTTSSupported) return
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    // Some browsers (Edge/Safari) need a slight delay
    const t = setTimeout(loadVoices, 800)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      clearTimeout(t)
    }
  }, [isTTSSupported, loadVoices])

  // ── Best English voice ─────────────────────────────────────────────────────
  // Priority: manually selected → Google en-US → Microsoft Natural en-US → MS en-US → any en-US → any EN
  const getBestVoice = useCallback(() => {
    if (selectedVoice) return selectedVoice
    const voices = window.speechSynthesis?.getVoices() || availableVoices
    if (!voices.length) return null

    const tryFind = (predicate) => voices.find(predicate)

    return (
      tryFind(v => v.name.includes('Google') && v.lang === 'en-US')            ||
      tryFind(v => v.name.includes('Microsoft') && v.lang === 'en-US' && v.name.includes('Natural')) ||
      tryFind(v => v.name.includes('Microsoft') && v.lang === 'en-US')         ||
      tryFind(v => v.lang === 'en-US')                                          ||
      tryFind(v => v.lang.startsWith('en'))                                     ||
      voices[0]
    )
  }, [selectedVoice, availableVoices])

  // ── Text cleaning ──────────────────────────────────────────────────────────
  const cleanText = useCallback((raw) => {
    return raw
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, 'code block. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[^\x20-\x7E\n.,!?;:%$@]/g, ' ')
      .replace(/•\s*/g, '. ')
      .replace(/---+/g, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\.\s*\.\s*/g, '. ')
      .trim()
      .slice(0, 2500)
  }, [])

  // ── Sentence splitter ──────────────────────────────────────────────────────
  const splitSentences = (text) =>
    text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3)

  // ── Speak one chunk ────────────────────────────────────────────────────────
  const speakChunk = useCallback((text, opts = {}) => {
    return new Promise((resolve) => {
      if (!isTTSSupported || !text.trim()) { resolve(); return }

      const utt    = new SpeechSynthesisUtterance(text)
      utt.lang     = 'en-US'
      utt.rate     = opts.rate  ?? 0.92
      utt.pitch    = opts.pitch ?? 1.0
      utt.volume   = 1.0
      const voice  = getBestVoice()
      if (voice) utt.voice = voice

      utt.onend   = () => resolve()
      utt.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'cancelled') {
          console.warn('TTS chunk error:', e.error)
        }
        resolve()
      }

      // Chrome needs a brief gap between utterances
      setTimeout(() => {
        if (isSpeakingRef.current && isTTSSupported) {
          window.speechSynthesis.speak(utt)
        } else {
          resolve()
        }
      }, 60)
    })
  }, [isTTSSupported, getBestVoice])

  // ── Main speak function ────────────────────────────────────────────────────
  const speak = useCallback(async (rawText, opts = {}) => {
    if (!isTTSSupported) return
    if (!audioEnabled && !opts.force) return

    // Cancel any ongoing speech cleanly
    isSpeakingRef.current = false
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    await new Promise(r => setTimeout(r, 180))

    const clean = cleanText(rawText)
    if (!clean) return

    const sentences = splitSentences(clean)
    if (!sentences.length) return

    isSpeakingRef.current = true
    setIsSpeaking(true)

    for (const sentence of sentences) {
      if (!isSpeakingRef.current) break
      await speakChunk(sentence, opts)
      if (isSpeakingRef.current) await new Promise(r => setTimeout(r, 90))
    }

    isSpeakingRef.current = false
    setIsSpeaking(false)
    opts.onDone?.()
  }, [isTTSSupported, audioEnabled, cleanText, speakChunk])

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  const toggleAudio = useCallback(() => {
    if (isSpeakingRef.current) stopSpeaking()
    setAudioEnabled(a => !a)
  }, [stopSpeaking])

  // ── STT — English only ─────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isSTTSupported) return
    if (isListening) { recognitionRef.current?.stop(); return }

    stopSpeaking()

    // Request mic permission explicitly for clear UX feedback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop()) // release stream — we only needed permission
      setPermissionState('granted')
    } catch (err) {
      console.warn('Mic permission denied:', err.message)
      setPermissionState('denied')
      return
    }

    const rec           = new SpeechRecognitionCtor()
    rec.lang            = 'en-US'
    rec.continuous      = false
    rec.interimResults  = true
    rec.maxAlternatives = 3

    rec.onresult = (ev) => {
      let interim = '', final = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript
        ev.results[i].isFinal ? (final += t) : (interim += t)
      }
      if (final)        onFinalRef.current?.(final.trim())
      else if (interim) onInterimRef.current?.(interim)
    }

    rec.onend   = () => { setIsListening(false); onEndRef.current?.() }
    rec.onerror = (e) => {
      console.warn('STT error:', e.error)
      if (e.error === 'not-allowed') setPermissionState('denied')
      setIsListening(false)
      onEndRef.current?.()
    }

    recognitionRef.current = rec
    try {
      rec.start()
      setIsListening(true)
    } catch (err) {
      console.warn('Recognition start failed:', err)
      setIsListening(false)
    }
  }, [isSTTSupported, isListening, stopSpeaking, SpeechRecognitionCtor])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    recognitionRef.current?.stop()
    isSpeakingRef.current = false
    window.speechSynthesis?.cancel()
  }, [])

  return {
    isListening, isSpeaking, isSupported,
    isSTTSupported, isTTSSupported,
    audioEnabled, availableVoices, selectedVoice, permissionState,
    startListening, stopListening,
    speak, stopSpeaking, toggleAudio,
    setSelectedVoice, getBestVoice,
  }
}
