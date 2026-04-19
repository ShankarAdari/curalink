/**
 * Query Expander Service
 * Intelligently merges user query with disease context for better retrieval
 */

/**
 * Expand a raw user query using the patient's disease context
 * @param {string} userQuery - Raw user message
 * @param {object} patientContext - { disease, name, location, additionalInfo }
 * @param {array} conversationHistory - Previous messages for context
 * @returns {object} - { expandedQuery, disease, intent, keywords }
 */
function expandQuery(userQuery, patientContext = {}, conversationHistory = []) {
  const disease = patientContext.disease || extractDiseaseFromHistory(conversationHistory) || '';
  const intent = detectIntent(userQuery);

  // Merge query with disease context
  let expandedQuery = userQuery.trim();

  if (disease && !queryContainsDisease(expandedQuery, disease)) {
    expandedQuery = `${expandedQuery} ${disease}`;
  }

  // Add intent-specific terms
  const intentTerms = getIntentTerms(intent);
  if (intentTerms && !expandedQuery.toLowerCase().includes(intentTerms.toLowerCase())) {
    expandedQuery = `${expandedQuery} ${intentTerms}`;
  }

  // Location filter for clinical trials
  const location = patientContext.location || '';

  // Extract keywords for ranking
  const keywords = extractKeywords(expandedQuery);

  return {
    expandedQuery: expandedQuery.trim(),
    originalQuery: userQuery,
    disease: disease,
    intent,
    location,
    keywords
  };
}

function detectIntent(query) {
  const q = query.toLowerCase();
  if (q.includes('trial') || q.includes('study') || q.includes('recruit'))
    return 'clinical_trial';
  if (q.includes('treatment') || q.includes('therapy') || q.includes('drug') || q.includes('medication'))
    return 'treatment';
  if (q.includes('symptom') || q.includes('sign') || q.includes('diagnos'))
    return 'diagnosis';
  if (q.includes('researcher') || q.includes('scientist') || q.includes('expert') || q.includes('top'))
    return 'researcher';
  if (q.includes('latest') || q.includes('recent') || q.includes('new') || q.includes('2024') || q.includes('2025'))
    return 'recent_research';
  if (q.includes('vitamin') || q.includes('supplement') || q.includes('diet') || q.includes('exercise'))
    return 'lifestyle';
  if (q.includes('side effect') || q.includes('risk') || q.includes('complication'))
    return 'side_effects';
  return 'general';
}

function getIntentTerms(intent) {
  const terms = {
    clinical_trial: 'clinical trial',
    treatment: 'treatment therapy',
    diagnosis: 'diagnosis',
    researcher: 'research study',
    recent_research: 'recent study 2024',
    lifestyle: 'lifestyle intervention',
    side_effects: 'adverse effects safety',
    general: ''
  };
  return terms[intent] || '';
}

function extractDiseaseFromHistory(history) {
  // Look for disease mentions in recent messages
  const recentMessages = history.slice(-6);
  const diseasePatterns = [
    /\b(cancer|tumor|carcinoma|leukemia|lymphoma)\b/i,
    /\b(diabetes|diabetic)\b/i,
    /\b(parkinson|alzheimer|dementia)\b/i,
    /\b(heart disease|cardiovascular|cardiac)\b/i,
    /\b(asthma|copd|lung disease)\b/i,
    /\b(arthritis|rheumatoid|lupus)\b/i,
    /\b(depression|anxiety|bipolar|schizophrenia)\b/i,
    /\b(hypertension|blood pressure)\b/i,
    /\b(stroke|cerebrovascular)\b/i,
    /\b(hiv|aids)\b/i
  ];

  for (const msg of recentMessages) {
    const content = msg.content || '';
    for (const pattern of diseasePatterns) {
      const match = content.match(pattern);
      if (match) return match[0];
    }
  }
  return '';
}

function queryContainsDisease(query, disease) {
  if (!disease) return true;
  return query.toLowerCase().includes(disease.toLowerCase());
}

function extractKeywords(text) {
  // Remove stopwords and extract meaningful terms
  const stopwords = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'can','i','you','he','she','it','we','they','what','how','when','where',
    'why','which','who','tell','me','about','latest','recent','show','find',
    'give','get','please','want','need','ask'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .slice(0, 12);
}

module.exports = { expandQuery, detectIntent, extractKeywords };
