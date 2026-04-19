/**
 * useElevenLabs — Natural expressive TTS via ElevenLabs API
 * Calls ElevenLabs directly from the browser — no backend needed.
 * Falls back to browser TTS if no API key or quota exceeded.
 */
import { useState, useRef, useCallback, useEffect } from 'react'

const EL_BASE = 'https://api.elevenlabs.io/v1'
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

  // Load voices directly from ElevenLabs
  const loadVoices = useCallback(async () => {
    if (!localStorage.getItem(KEY_STORAGE)) return
    try {
      const key = localStorage.getItem(KEY_STORAGE)
      const res = await fetch(`${EL_BASE}/voices`, {
        headers: { 'xi-api-key': key }
      })
      if (!res.ok) { setKeyError(true); return }
      const data = await res.json()
      const voiceList = (data.voices || []).map(v => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        labels: v.labels
      }))
      setVoices(voiceList)
      setHasKey(true)
    } catch (e) {
      console.warn('Could not load EL voices:', e.message)
    }
  }, [])

  useEffect(() => {
    if (apiKey) loadVoices()
  }, [apiKey, loadVoices])

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

  // Speak via ElevenLabs directly from browser
  const speak = useCallback(async (text, opts = {}) => {
    if (!apiKey) return false  // no key — caller falls back to browser TTS

    stop()
    setIsLoading(true)

    try {
      const vid = opts.voiceId || voiceId
      const res = await fetch(`${EL_BASE}/text-to-speech/${vid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key':   apiKey
        },
        body: JSON.stringify({
          text: text.slice(0, 2500), // ElevenLabs free tier limit
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability:        settings.stability,
            similarity_boost: settings.similarity,
            style:            settings.style,
            use_speaker_boost: true
          }
        })
      })

      if (res.status === 401) { setKeyError(true);   setIsLoading(false); return false }
      if (res.status === 429) { setQuotaError(true); setIsLoading(false); return false }
      if (!res.ok) { console.warn('EL TTS error:', res.status); setIsLoading(false); return false }

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

  // Preview a voice (using the ElevenLabs preview_url or synthesize)
  const previewVoice = useCallback(async (vid, previewText = 'Hello! I am your Curalink AI medical research companion. How can I help you today?') => {
    // Try to play the preview_url first (no quota used)
    const voice = voices.find(v => v.voice_id === vid)
    if (voice?.preview_url) {
      stop()
      const audio = new Audio(voice.preview_url)
      audioRef.current = audio
      setIsSpeaking(true)
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)
      await audio.play().catch(() => {})
      return
    }
    if (!apiKey) return
    stop()
    await speak(previewText, { voiceId: vid })
  }, [apiKey, speak, stop, voices])

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
