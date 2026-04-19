/**
 * Research route — standalone fetch and rank without LLM
 */
const express = require('express');
const router  = express.Router();

const { expandQuery }          = require('../services/queryExpander');
const { fetchPubMed }          = require('../services/pubmedService');
const { fetchOpenAlex }        = require('../services/openalexService');
const { fetchClinicalTrials }  = require('../services/clinicalTrialsService');
const { rankPublications, rankTrials } = require('../services/rankingService');

// GET /api/research?q=...&disease=...&location=...
router.get('/', async (req, res) => {
  try {
    const { q = '', disease = '', location = '' } = req.query;
    if (!q && !disease) return res.status(400).json({ error: 'Query or disease required' });

    const queryInfo = expandQuery(q, { disease, location });

    const [pubmed, openalex, trials] = await Promise.all([
      fetchPubMed(queryInfo.expandedQuery, 50),
      fetchOpenAlex(queryInfo.expandedQuery, 50),
      fetchClinicalTrials(disease || q, q, location, 30)
    ]);

    const allPubs     = [...pubmed, ...openalex].filter((v, i, a) =>
      a.findIndex(x => x.title === v.title) === i
    );
    const ranked      = rankPublications(allPubs, queryInfo, 10);
    const rankedTrials = rankTrials(trials, queryInfo, 6);

    res.json({
      query: queryInfo.expandedQuery,
      publications: ranked,
      trials: rankedTrials,
      totalFetched: { pubmed: pubmed.length, openalex: openalex.length, trials: trials.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
