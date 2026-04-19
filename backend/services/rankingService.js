/**
 * Re-Ranking Service
 * Scores publications by relevance, recency, and citation count
 */

const { extractKeywords } = require('./queryExpander');

/**
 * Score and rank a list of publications
 * @param {Array} publications - Raw publications from APIs
 * @param {object} queryInfo - { expandedQuery, keywords, disease, intent }
 * @param {number} topN - Number of results to return
 * @returns {Array} - Sorted, scored publications
 */
function rankPublications(publications, queryInfo, topN = 8) {
  if (!publications || publications.length === 0) return [];

  const { keywords = [], disease = '', expandedQuery = '' } = queryInfo;
  const allKeywords = [...keywords, ...extractKeywords(disease)].filter(Boolean);
  const currentYear = new Date().getFullYear();

  const scored = publications.map(pub => {
    const relevanceScore = computeRelevanceScore(pub, allKeywords, expandedQuery);
    const recencyScore = computeRecencyScore(pub.year, currentYear);
    const citationScore = computeCitationScore(pub.citationCount);
    const sourceScore = computeSourceScore(pub.source);

    const totalScore = (
      0.45 * relevanceScore +
      0.30 * recencyScore +
      0.15 * citationScore +
      0.10 * sourceScore
    );

    return { ...pub, _score: totalScore, _relevance: relevanceScore, _recency: recencyScore };
  });

  return scored
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, topN);
}

/**
 * Score and rank clinical trials
 */
function rankTrials(trials, queryInfo, topN = 5) {
  if (!trials || trials.length === 0) return [];

  const { keywords = [], disease = '', location = '' } = queryInfo;
  const allKeywords = [...keywords, ...extractKeywords(disease)].filter(Boolean);

  const scored = trials.map(trial => {
    const relevanceScore = computeTrialRelevance(trial, allKeywords);
    const statusScore = computeStatusScore(trial.status);
    const locationScore = location ? computeLocationScore(trial, location) : 0;

    const totalScore = (
      0.50 * relevanceScore +
      0.35 * statusScore +
      0.15 * locationScore
    );

    return { ...trial, _score: totalScore };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, topN);
}

// ─── Scoring Functions ───────────────────────────────────────────────────────

function computeRelevanceScore(pub, keywords, expandedQuery) {
  if (!keywords || keywords.length === 0) return 0.5;

  const searchableText = [
    pub.title || '',
    pub.abstract || '',
    (pub.authors || []).join(' ')
  ].join(' ').toLowerCase();

  let matchCount = 0;
  let totalWeight = 0;

  keywords.forEach((kw, idx) => {
    const weight = 1 - (idx * 0.05); // Earlier keywords = more weight
    const occurrences = (searchableText.match(new RegExp(kw.toLowerCase(), 'g')) || []).length;
    if (occurrences > 0) {
      matchCount += Math.min(occurrences, 3) * weight;
    }
    totalWeight += weight;
  });

  // Bonus for title match
  const titleText = (pub.title || '').toLowerCase();
  keywords.forEach(kw => {
    if (titleText.includes(kw.toLowerCase())) matchCount += 0.5;
  });

  return Math.min(matchCount / Math.max(totalWeight, 1), 1);
}

function computeRecencyScore(pubYear, currentYear) {
  if (!pubYear) return 0.3;
  const age = currentYear - pubYear;
  if (age <= 0) return 1.0;
  if (age <= 1) return 0.95;
  if (age <= 2) return 0.85;
  if (age <= 3) return 0.75;
  if (age <= 5) return 0.60;
  if (age <= 10) return 0.40;
  if (age <= 15) return 0.25;
  return 0.10;
}

function computeCitationScore(citationCount) {
  if (!citationCount) return 0.3;
  // Log-normalized citation score
  if (citationCount >= 10000) return 1.0;
  if (citationCount >= 1000) return 0.85;
  if (citationCount >= 100) return 0.65;
  if (citationCount >= 10) return 0.45;
  if (citationCount >= 1) return 0.30;
  return 0.15;
}

function computeSourceScore(source) {
  const sourceScores = {
    'PubMed': 0.95,
    'OpenAlex': 0.85,
    'ClinicalTrials': 0.90
  };
  return sourceScores[source] || 0.70;
}

function computeTrialRelevance(trial, keywords) {
  const searchableText = [
    trial.title || '',
    trial.summary || '',
    trial.eligibility || '',
    (trial.conditions || []).join(' ')
  ].join(' ').toLowerCase();

  let matchCount = 0;
  keywords.forEach(kw => {
    if (searchableText.includes(kw.toLowerCase())) matchCount++;
  });

  return keywords.length > 0 ? Math.min(matchCount / keywords.length, 1) : 0.5;
}

function computeStatusScore(status) {
  const statusScores = {
    'RECRUITING': 1.0,
    'NOT_YET_RECRUITING': 0.85,
    'ENROLLING_BY_INVITATION': 0.75,
    'ACTIVE_NOT_RECRUITING': 0.60,
    'COMPLETED': 0.45,
    'TERMINATED': 0.10,
    'WITHDRAWN': 0.05
  };
  return statusScores[status] || 0.30;
}

function computeLocationScore(trial, desiredLocation) {
  if (!trial.locations || !desiredLocation) return 0;
  const locationStr = trial.locations.join(' ').toLowerCase();
  const desired = desiredLocation.toLowerCase();
  // Extract country/city from desired location
  const parts = desired.split(',').map(p => p.trim());
  let score = 0;
  parts.forEach(part => {
    if (locationStr.includes(part)) score += 0.5;
  });
  return Math.min(score, 1);
}

module.exports = { rankPublications, rankTrials };
