/**
 * ElevenLabs TTS proxy endpoint
 * GET  /api/tts/voices        — list available voices
 * POST /api/tts/speak         — convert text to MP3 audio stream
 */
const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVEN_BASE    = 'https://api.elevenlabs.io/v1';

// Curated natural voices with personality descriptions
const VOICE_CATALOG = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',    desc: 'Natural, warm & expressive — great for medical info', lang: 'en-US', gender: 'female', style: 'conversational' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',     desc: 'Calm, professional male voice', lang: 'en-US', gender: 'male', style: 'professional' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Expressive, natural female voice', lang: 'en-GB', gender: 'female', style: 'expressive' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',    desc: 'Deep, trustworthy male voice', lang: 'en-US', gender: 'male', style: 'deep' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',   desc: 'Authoritative British male', lang: 'en-GB', gender: 'male', style: 'authoritative' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya',    desc: 'Bright, friendly female voice', lang: 'en-US', gender: 'female', style: 'friendly' },
  { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole',   desc: 'Soft, empathetic whisper voice', lang: 'en-US', gender: 'female', style: 'empathetic' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',     desc: 'Warm, British female voice', lang: 'en-GB', gender: 'female', style: 'warm' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie',  desc: 'Natural, Australian male', lang: 'en-AU', gender: 'male', style: 'casual' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda',  desc: 'Warm, American female', lang: 'en-US', gender: 'female', style: 'warm' },
];

// GET /api/tts/voices — return voice catalog + user's actual voices if key set
router.get('/voices', async (req, res) => {
  if (!ELEVEN_API_KEY) {
    return res.json({ voices: VOICE_CATALOG, hasKey: false });
  }

  try {
    const resp = await axios.get(`${ELEVEN_BASE}/voices`, {
      headers: { 'xi-api-key': ELEVEN_API_KEY }
    });
    const voices = (resp.data.voices || [])
      .filter(v => v.fine_tuning?.language === 'en' || !v.fine_tuning?.language)
      .slice(0, 20)
      .map(v => ({
        id: v.voice_id,
        name: v.name,
        desc: v.labels?.description || v.labels?.use_case || 'Natural voice',
        lang: 'en-US',
        gender: v.labels?.gender || 'unknown',
        style: v.labels?.use_case || 'general',
        preview: v.preview_url
      }));
    return res.json({ voices: [...VOICE_CATALOG, ...voices], hasKey: true });
  } catch (err) {
    return res.json({ voices: VOICE_CATALOG, hasKey: true, error: 'Could not fetch your voices' });
  }
});

// POST /api/tts/speak — stream MP3 audio from ElevenLabs
router.post('/speak', async (req, res) => {
  const { text, voiceId, stability, similarity, style } = req.body;
  const apiKey = req.headers['x-elevenlabs-key'] || ELEVEN_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'NO_KEY',
      message: 'ElevenLabs API key required. Get a free key at elevenlabs.io'
    });
  }

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const vid = voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Sarah default

  // Clean and limit text
  const clean = text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[🧬🔬💊🌿🏥💡⚠️📚📊💙🔗✅🟢🔵🟡📍📧🎯🔍🧪⚡🫁🧠❤️💉💪👁️🗣️😔😤😮‍💨🩸🤧🙏]/gu, '')
    .replace(/•/g, '. ')
    .replace(/\n\n/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 3000);

  try {
    const response = await axios.post(
      `${ELEVEN_BASE}/text-to-speech/${vid}/stream`,
      {
        text: clean,
        model_id: 'eleven_turbo_v2_5',  // fastest, most natural
        voice_settings: {
          stability:         stability   ?? 0.45,  // lower = more expressive
          similarity_boost:  similarity  ?? 0.82,
          style:             style       ?? 0.35,  // adds emotional expression
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key':   apiKey,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg'
        },
        responseType: 'stream',
        timeout: 30000
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    response.data.pipe(res);
  } catch (err) {
    console.error('ElevenLabs error:', err.response?.status, err.response?.data?.detail || err.message);
    const status = err.response?.status;
    if (status === 401) return res.status(401).json({ error: 'INVALID_KEY', message: 'Invalid API key' });
    if (status === 429) return res.status(429).json({ error: 'QUOTA', message: 'Monthly quota exceeded. Upgrade or wait for reset.' });
    return res.status(500).json({ error: 'TTS_FAILED', message: err.message });
  }
});

module.exports = router;
