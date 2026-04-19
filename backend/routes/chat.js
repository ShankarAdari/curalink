/**
 * Main chat route — orchestrates pipeline:
 * Query Expand → Parallel Fetch → Re-Rank → LLM → Respond
 */
const express = require('express');
const router  = express.Router();

const { expandQuery }        = require('../services/queryExpander');
const { fetchPubMed }        = require('../services/pubmedService');
const { fetchOpenAlex }      = require('../services/openalexService');
const { fetchClinicalTrials} = require('../services/clinicalTrialsService');
const { rankPublications, rankTrials } = require('../services/rankingService');
const { generateResponse, callOllamaStream, buildPrompt, buildConversationalResponse } = require('../services/llmService');

// In-memory conversation store (used when MongoDB is unavailable)
const memoryStore = new Map();

// Helper: get/create session
function getSession(sessionId) {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {
      sessionId,
      patientContext: {},
      messages: [],
      createdAt: new Date()
    });
  }
  return memoryStore.get(sessionId);
}

// POST /api/chat
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      message,
      sessionId = `session_${Date.now()}`,
      patientContext = {},
      languagePrompt = ''
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load session
    let session;
    try {
      const Conversation = require('../models/Conversation');
      session = await Conversation.findOne({ sessionId });
      if (!session) {
        session = new Conversation({ sessionId, patientContext, messages: [] });
      } else if (patientContext.disease || patientContext.name) {
        session.patientContext = { ...session.patientContext, ...patientContext };
      }
    } catch {
      session = getSession(sessionId);
      if (patientContext.disease || patientContext.name) {
        session.patientContext = { ...session.patientContext, ...patientContext };
      }
    }

    const history = session.messages || [];
    const ctx     = session.patientContext || {};

    // 1. Expand query
    const queryInfo = expandQuery(message, ctx, history);
    console.log(`\n📡 Query: "${queryInfo.expandedQuery}" | Intent: ${queryInfo.intent}`);

    // 2. Parallel retrieval — reduced counts for speed
    const disease = queryInfo.disease || ctx.disease || queryInfo.expandedQuery;
    const [pubmedResults, openalexResults, trialResults] = await Promise.all([
      fetchPubMed(queryInfo.expandedQuery, 20),
      fetchOpenAlex(queryInfo.expandedQuery, 30),
      fetchClinicalTrials(disease, queryInfo.expandedQuery, ctx.location || queryInfo.location, 10)
    ]);

    console.log(`📚 Retrieved: ${pubmedResults.length} PubMed | ${openalexResults.length} OpenAlex | ${trialResults.length} ClinicalTrials`);

    // 3. Merge & deduplicate publications
    const allPublications = mergeAndDeduplicate([...pubmedResults, ...openalexResults]);

    // 4. Re-rank
    const rankedPubs   = rankPublications(allPublications, queryInfo, 8);
    const rankedTrials = rankTrials(trialResults, queryInfo, 5);

    console.log(`✅ Ranked: ${rankedPubs.length} pubs | ${rankedTrials.length} trials`);

    // 5. Generate LLM response
    const llmResult = await generateResponse(
      message, queryInfo, rankedPubs, rankedTrials, ctx, history, languagePrompt
    );

    // 6. Save to history
    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    const assistantMsg = {
      role: 'assistant',
      content: llmResult.text,
      publications: rankedPubs,
      trials: rankedTrials,
      timestamp: new Date()
    };

    session.messages.push(userMsg, assistantMsg);

    // Keep last 20 messages to avoid bloat
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    try {
      await session.save();
    } catch {
      memoryStore.set(sessionId, session);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⚡ Response in ${elapsed}ms | LLM: ${llmResult.source}`);

    res.json({
      sessionId,
      message: llmResult.text,
      publications: rankedPubs,
      trials: rankedTrials,
      queryInfo: {
        expanded: queryInfo.expandedQuery,
        intent: queryInfo.intent,
        disease: queryInfo.disease
      },
      stats: {
        pubmedCount: pubmedResults.length,
        openalexCount: openalexResults.length,
        trialsCount: trialResults.length,
        rankedPubs: rankedPubs.length,
        rankedTrials: rankedTrials.length,
        llmSource: llmResult.source,
        responseTimeMs: elapsed
      }
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ══ STREAMING ENDPOINT ─ POST /api/chat/stream (SSE) ══
router.post('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      message,
      sessionId = `s_${Date.now()}`,
      patientContext = {},
      languagePrompt = ''
    } = req.body;

    if (!message?.trim()) { send({ type: 'error', message: 'Message required' }); res.end(); return; }

    // Load session
    let session;
    try {
      const Conversation = require('../models/Conversation');
      session = await Conversation.findOne({ sessionId });
      if (!session) session = new Conversation({ sessionId, patientContext, messages: [] });
    } catch { session = getSession(sessionId); }

    const history = session.messages || [];
    const ctx     = session.patientContext || {};

    // 1. Query expansion
    const queryInfo = expandQuery(message, ctx, history);
    send({ type: 'thinking', stage: 'expanding', query: queryInfo.expandedQuery });

    // 2. Fast parallel fetch
    const disease = queryInfo.disease || ctx.disease || queryInfo.expandedQuery;
    const [pubmedResults, openalexResults, trialResults] = await Promise.all([
      fetchPubMed(queryInfo.expandedQuery, 20),
      fetchOpenAlex(queryInfo.expandedQuery, 30),
      fetchClinicalTrials(disease, queryInfo.expandedQuery, ctx.location, 10)
    ]);

    // 3. Merge + rank
    const allPubs      = mergeAndDeduplicate([...pubmedResults, ...openalexResults]);
    const rankedPubs   = rankPublications(allPubs, queryInfo, 8);
    const rankedTrials = rankTrials(trialResults, queryInfo, 4);

    // Send research metadata immediately — UI shows stats before text
    send({
      type: 'meta',
      pubmed: pubmedResults.length,
      openalexCount: openalexResults.length,
      trials: trialResults.length,
      rankedPubs: rankedPubs.length,
      rankedTrials: rankedTrials.length,
    });

    // 4. Build prompt
    const prompt = buildPrompt(message, queryInfo, rankedPubs, rankedTrials, ctx, history, languagePrompt);

    // 5. Stream from Ollama, fallback to template
    let fullText = '';
    let source   = 'template';

    try {
      fullText = await callOllamaStream(prompt, (token) => send({ type: 'token', text: token }));
      source = 'ollama';
    } catch {
      // Template fallback — stream word-by-word for same UX feel
      const templateText = buildConversationalResponse(message, queryInfo, rankedPubs, rankedTrials, ctx, history);
      const words = templateText.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        const chunk = words.slice(i, i + 4).join(' ') + ' ';
        fullText += chunk;
        send({ type: 'token', text: chunk });
        await new Promise(r => setTimeout(r, 12));
      }
    }

    // 6. Persist
    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    const asstMsg = { role: 'assistant', content: fullText, publications: rankedPubs, trials: rankedTrials, timestamp: new Date() };
    session.messages.push(userMsg, asstMsg);
    if (session.messages.length > 20) session.messages = session.messages.slice(-20);
    try { await session.save(); } catch { memoryStore.set(sessionId, session); }

    send({ type: 'done', sessionId, publications: rankedPubs, trials: rankedTrials, source });
    res.end();

  } catch (err) {
    console.error('Stream error:', err);
    send({ type: 'error', message: err.message });
    res.end();
  }
});

// GET /api/chat/:sessionId — Get conversation history
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let session;
    try {
      const Conversation = require('../models/Conversation');
      session = await Conversation.findOne({ sessionId });
    } catch {
      session = memoryStore.get(sessionId);
    }
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/:sessionId — Clear conversation
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    try {
      const Conversation = require('../models/Conversation');
      await Conversation.deleteOne({ sessionId });
    } catch {}
    memoryStore.delete(sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mergeAndDeduplicate(publications) {
  const seen = new Set();
  return publications.filter(pub => {
    const key = normalizeTitle(pub.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeTitle(title) {
  if (!title) return Math.random().toString();
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
}

module.exports = router;
