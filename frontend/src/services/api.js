import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const api  = axios.create({ baseURL: BASE, timeout: 90000 })

/* ── Chat (non-streaming) ───────────────────────────────────── */
export async function sendMessage(message, sessionId, patientContext = {}, languagePrompt = '') {
  const { data } = await api.post('/chat', { message, sessionId, patientContext, languagePrompt })
  return data
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/chat/${sessionId}`)
  return data
}

export async function clearSession(sessionId) {
  const { data } = await api.delete(`/chat/${sessionId}`)
  return data
}

/* ── Streaming chat (SSE generator) ────────────────────────── */
// Usage: for await (const event of sendMessageStream(...)) { ... }
export async function* sendMessageStream(message, sessionId, patientContext = {}, languagePrompt = '') {
  const response = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, patientContext, languagePrompt }),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep incomplete last line

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try { yield JSON.parse(line.slice(6)) } catch {}
      }
    }
  }
}

/* ── Widgets ────────────────────────────────────────────────── */
export async function fetchWeather(city = '') {
  const { data } = await api.get('/widgets/weather', { params: { city } })
  return data
}

export async function fetchHealthNews() {
  const { data } = await api.get('/widgets/news')
  return data
}

export async function fetchHealthTip() {
  const { data } = await api.get('/widgets/healthtip')
  return data
}

export async function fetchReviews() {
  const { data } = await api.get('/widgets/reviews')
  return data
}

export async function checkHealth() {
  const { data } = await api.get('/health')
  return data
}
