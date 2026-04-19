/**
 * OpenAlex Service
 * Fetches research publications with relevance + date sorting
 * Reconstructs abstracts from inverted index format
 */
const axios = require('axios');

const OPENALEX_BASE = 'https://api.openalex.org/works';

/**
 * Fetch publications from OpenAlex
 * @param {string} query - Search query
 * @param {number} maxResults - Total results to retrieve (up to 200)
 */
async function fetchOpenAlex(query, maxResults = 100) {
  try {
    const perPage = Math.min(maxResults, 100);
    const pages   = maxResults > 100 ? 2 : 1;

    const requests = [];
    for (let page = 1; page <= pages; page++) {
      requests.push(
        axios.get(OPENALEX_BASE, {
          params: {
            search: query,
            'per-page': perPage,
            page,
            sort: 'relevance_score:desc',
            filter: 'from_publication_date:2015-01-01',
            select: 'id,doi,title,display_name,publication_year,publication_date,authorships,primary_location,abstract_inverted_index,cited_by_count,open_access,primary_topic'
          },
          headers: { 'User-Agent': 'Curalink/1.0 (mailto:contact@curalink.ai)' },
          timeout: 15000
        })
      );
    }

    const responses = await Promise.allSettled(requests);
    const allResults = [];

    for (const resp of responses) {
      if (resp.status === 'fulfilled') {
        const results = resp.value.data?.results || [];
        allResults.push(...results.map(parseOpenAlexWork).filter(Boolean));
      }
    }

    // Deduplicate by DOI
    const seen = new Set();
    return allResults.filter(pub => {
      const key = pub.doi || pub.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error('OpenAlex fetch error:', err.message);
    return [];
  }
}

function parseOpenAlexWork(work) {
  try {
    if (!work || !work.title) return null;

    // Reconstruct abstract from inverted index
    const abstract = reconstructAbstract(work.abstract_inverted_index);

    // Authors
    const authors = (work.authorships || [])
      .slice(0, 5)
      .map(a => a?.author?.display_name)
      .filter(Boolean);

    // URL
    const url = work.doi
      ? work.doi
      : (work.primary_location?.landing_page_url || `https://openalex.org/${work.id?.split('/').pop()}`);

    // Journal
    const journal = work.primary_location?.source?.display_name || '';

    return {
      id: work.id,
      doi: work.doi || null,
      title: work.display_name || work.title,
      abstract: abstract.slice(0, 600),
      authors,
      year: work.publication_year || null,
      journal,
      source: 'OpenAlex',
      url,
      citationCount: work.cited_by_count || 0,
      isOpenAccess: work.open_access?.is_oa || false,
      topic: work.primary_topic?.display_name || '',
      snippet: abstract.slice(0, 200)
    };
  } catch (err) {
    return null;
  }
}

/**
 * Reconstruct readable abstract from OpenAlex inverted index format
 * { "word": [position1, position2, ...], ... }
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  try {
    const positions = [];
    for (const [word, indices] of Object.entries(invertedIndex)) {
      for (const idx of indices) {
        positions[idx] = word;
      }
    }
    return positions.filter(Boolean).join(' ').trim();
  } catch {
    return '';
  }
}

module.exports = { fetchOpenAlex };
