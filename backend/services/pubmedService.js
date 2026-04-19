/**
 * PubMed Service
 * Step 1: esearch → get IDs
 * Step 2: efetch → get XML article details
 */
const axios = require('axios');
const xml2js = require('xml2js');

const PUBMED_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH  = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_URL    = 'https://pubmed.ncbi.nlm.nih.gov';

async function fetchPubMed(query, maxResults = 80) {
  try {
    // Step 1: Search
    const searchRes = await axios.get(PUBMED_SEARCH, {
      params: { db: 'pubmed', term: query, retmax: maxResults, sort: 'pub date', retmode: 'json' },
      timeout: 15000
    });

    const idList = searchRes.data?.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    // Fetch in batches of 25 to avoid URI too long errors
    const batchSize = 25;
    const batches = [];
    for (let i = 0; i < Math.min(idList.length, maxResults); i += batchSize) {
      batches.push(idList.slice(i, i + batchSize));
    }

    const allArticles = [];
    for (const batch of batches) {
      const articles = await fetchBatch(batch);
      allArticles.push(...articles);
    }

    return allArticles;
  } catch (err) {
    console.error('PubMed fetch error:', err.message);
    return [];
  }
}

async function fetchBatch(ids) {
  try {
    const fetchRes = await axios.get(PUBMED_FETCH, {
      params: { db: 'pubmed', id: ids.join(','), retmode: 'xml' },
      timeout: 15000
    });

    const parsed = await xml2js.parseStringPromise(fetchRes.data, { explicitArray: false });
    const articles = parsed?.PubmedArticleSet?.PubmedArticle;
    if (!articles) return [];

    const articleArray = Array.isArray(articles) ? articles : [articles];

    return articleArray.map(article => parsePubMedArticle(article)).filter(Boolean);
  } catch (err) {
    console.error('PubMed batch fetch error:', err.message);
    return [];
  }
}

function parsePubMedArticle(article) {
  try {
    const medline = article?.MedlineCitation;
    const art     = medline?.Article;
    if (!art) return null;

    const pmid = medline?.PMID?._ || medline?.PMID;

    // Title
    const title = art?.ArticleTitle?._ || art?.ArticleTitle || '';

    // Abstract
    let abstract = '';
    const absText = art?.Abstract?.AbstractText;
    if (typeof absText === 'string') {
      abstract = absText;
    } else if (Array.isArray(absText)) {
      abstract = absText.map(t => (t?._ || t || '')).join(' ');
    } else if (absText?._) {
      abstract = absText._;
    }

    // Authors
    const authorList = art?.AuthorList?.Author;
    const authorsRaw = authorList
      ? (Array.isArray(authorList) ? authorList : [authorList])
      : [];
    const authors = authorsRaw
      .map(a => {
        const last  = a?.LastName || '';
        const first = a?.ForeName || a?.Initials || '';
        return [last, first].filter(Boolean).join(' ');
      })
      .filter(Boolean)
      .slice(0, 5);

    // Year
    const pubDate = art?.Journal?.JournalIssue?.PubDate;
    const year = parseInt(pubDate?.Year || pubDate?.MedlineDate?.substring(0, 4) || '0') || null;

    // Journal
    const journal = art?.Journal?.Title || '';

    // Citation count (not available in basic fetch — set 0)
    const citationCount = 0;

    return {
      id: `pubmed_${pmid}`,
      pmid: String(pmid),
      title: cleanText(title),
      abstract: cleanText(abstract).slice(0, 600),
      authors,
      year,
      journal,
      source: 'PubMed',
      url: `${PUBMED_URL}/${pmid}`,
      citationCount,
      snippet: cleanText(abstract).slice(0, 200)
    };
  } catch (err) {
    return null;
  }
}

function cleanText(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, ' ').trim();
}

module.exports = { fetchPubMed };
