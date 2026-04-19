/**
 * useElevenLabs — Natural expressive TTS via ElevenLabs API
 * Falls back to browser TTS if no API key or quota exceeded
 */
import { useState, useRef, useCallback, useEffect } from 'react'

const TTS_BASE = 'http://localhost:5000/api/tts'
const KEY_STORAGE = 'curalink_el_key'
const VOICE_STORAGE = 'curalink_el_voice'
const SETTINGS_STORAGE = 'curalink_el_settings'

export function useElevenLabs() {
  const [apiKey,    setApiKeyState]  = useState(() => localStorage.getItem(KEY_STORAGE)  || '')
  const [voiceId,   setVoiceIdState] = useState(() => localStorage.getItem(VOICE_STORAGE) || 'EXAVITQu4vr4xnSDxMaL')
  const [settings,  setSettingsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SETTINGS_STORAGE)) || { stability: 0.45, similarity: 0.82, style: 0.35 } }
    catch { return { stability: 0.45, similarity: 0.82, style: 0.35 } }
  })
  const [isSpeaking,   setIsSpeaking]   = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [voices,       setVoices]       = useState([])
  const [quotaError,   setQuotaError]   = useState(false)
  const [keyError,     setKeyError]     = useState(false)
  const [hasKey,       setHasKey]       = useState(false)

  const audioRef    = useRef(null)
  const currentSrcRef = useRef(null)

  const setApiKey = useCallback((key) => {
    setApiKeyState(key)
    localStorage.setItem(KEY_STORAGE, key)
    setKeyError(false)
    setQuotaError(false)
  }, [])

  const setVoiceId = useCallback((id) => {
    setVoiceIdState(id)
    localStorage.setItem(VOICE_STORAGE, id)
  }, [])

  const updateSettings = useCallback((s) => {
    setSettingsState(s)
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(s))
  }, [])

  // Load voices
  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch(`${TTS_BASE}/voices`)
      const data = await res.json()
      setVoices(data.voices || [])
      setHasKey(data.hasKey || false)
    } catch (e) {
      console.warn('Could not load EL voices:', e.message)
    }
  }, [])

  useEffect(() => { loadVoices() }, [loadVoices])

  // Stop any current audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (currentSrcRef.current) {
      URL.revokeObjectURL(currentSrcRef.current)
      currentSrcRef.current = null
    }
    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  // Speak via ElevenLabs
  const speak = useCallback(async (text, opts = {}) => {
    if (!apiKey) return false  // no key — tell caller to use browser TTS

    stop()
    setIsLoading(true)

    try {
      const res = await fetch(`${TTS_BASE}/speak`, {
        method: 'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-elevenlabs-key':   apiKey
        },
        body: JSON.stringify({
          text,
          voiceId: opts.voiceId || voiceId,
          stability:  settings.stability,
          similarity: settings.similarity,
          style:      settings.style,
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.error === 'INVALID_KEY') { setKeyError(true);   return false }
        if (err.error === 'QUOTA')       { setQuotaError(true); return false }
        if (err.error === 'NO_KEY')      { return false }
        console.warn('TTS error:', err.message)
        return false
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      currentSrcRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio
      audio.playbackRate = opts.rate ?? 1.0

      setIsLoading(false)
      setIsSpeaking(true)

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        currentSrcRef.current = null
        opts.onDone?.()
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        setIsLoading(false)
        opts.onDone?.()
      }

      await audio.play()
      return true
    } catch (e) {
      console.warn('ElevenLabs speak error:', e.message)
      setIsLoading(false)
      setIsSpeaking(false)
      return false
    }
  }, [apiKey, voiceId, settings, stop])

  // Preview a voice
  const previewVoice = useCallback(async (vid, previewText = 'Hello! I am your Curalink AI medical research companion. How can I help you today?') => {
    if (!apiKey) return
    stop()
    await speak(previewText, { voiceId: vid })
  }, [apiKey, speak, stop])

  return {
    apiKey, setApiKey,
    voiceId, setVoiceId,
    settings, updateSettings,
    isSpeaking, isLoading,
    voices, hasKey,
    quotaError, keyError,
    speak, stop,
    previewVoice, loadVoices
  }
}
