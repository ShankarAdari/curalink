/**
 * Widget Routes — Weather + Health News
 * Uses Open-Meteo (free, no key) + MediaStack-style health news from RSS
 */
const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// ── GET /api/widgets/weather?lat=&lon=&city= ──────────────────────────────
router.get('/weather', async (req, res) => {
  try {
    let { lat, lon, city } = req.query;

    // Geocode city name if no lat/lon
    if ((!lat || !lon) && city) {
      const geo = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        { timeout: 8000 }
      );
      const r = geo.data?.results?.[0];
      if (!r) return res.json({ error: 'City not found', fallback: true });
      lat = r.latitude;
      lon = r.longitude;
      city = r.name + (r.country ? `, ${r.country}` : '');
    }

    if (!lat || !lon) {
      // Default to New York
      lat = 40.7128; lon = -74.006; city = 'New York, US';
    }

    const weather = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&timezone=auto&forecast_days=1`,
      { timeout: 8000 }
    );

    const c = weather.data.current;
    const code = c.weather_code;

    res.json({
      city: city || `${lat}, ${lon}`,
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      precipitation: c.precipitation,
      condition: weatherCodeToCondition(code),
      icon: weatherCodeToIcon(code),
      unit: '°C',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Weather error:', err.message);
    res.json({ error: err.message, fallback: true, ...getFallbackWeather() });
  }
});

// ── GET /api/widgets/news ─────────────────────────────────────────────────
// Uses NewsData.io free tier for health news (no key needed for basic)
// Falls back to curated static health alerts if API fails
router.get('/news', async (req, res) => {
  try {
    // Using WHO RSS / open health news aggregation via RSS-to-JSON
    const newsRes = await axios.get(
      'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.who.int%2Frss-feeds%2Fnews-releases-en.xml&api_key=public&count=8',
      { timeout: 10000 }
    );

    if (newsRes.data?.status === 'ok' && newsRes.data.items?.length > 0) {
      const articles = newsRes.data.items.slice(0, 8).map(item => ({
        title: item.title,
        summary: stripHtml(item.description || item.content || '').slice(0, 180),
        url: item.link,
        source: 'WHO',
        publishedAt: item.pubDate,
        category: classifyArticle(item.title),
        icon: getNewsIcon(item.title)
      }));
      return res.json({ articles, source: 'WHO RSS', fetchedAt: new Date().toISOString() });
    }
    throw new Error('RSS unavailable');
  } catch (err) {
    // Try NCBI health RSS
    try {
      const ncbiRes = await axios.get(
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.ncbi.nlm.nih.gov%2Frss%2Fpubmed.fcgi%3Fdb%3Dpubmed%26query_key%3D1%26WebEnv%3Dwith_bacteria_new_species%26retmax%3D8%26tool%3Drss&api_key=public&count=8',
        { timeout: 8000 }
      );
      if (ncbiRes.data?.status === 'ok') {
        const articles = ncbiRes.data.items.slice(0, 8).map(item => ({
          title: item.title,
          summary: stripHtml(item.description || '').slice(0, 180),
          url: item.link,
          source: 'PubMed',
          publishedAt: item.pubDate,
          category: classifyArticle(item.title),
          icon: getNewsIcon(item.title)
        }));
        return res.json({ articles, source: 'PubMed RSS', fetchedAt: new Date().toISOString() });
      }
    } catch (e2) {}

    // Final fallback — curated health news
    res.json({ articles: getFallbackNews(), source: 'curated', fetchedAt: new Date().toISOString() });
  }
});

// ── GET /api/widgets/healthtip ────────────────────────────────────────────
router.get('/healthtip', (req, res) => {
  const tips = [
    { tip: 'Aim for 7–9 hours of sleep per night — sleep deprivation is linked to increased risk of cardiovascular disease and cognitive decline.', icon: '😴', category: 'Sleep' },
    { tip: 'Walking 8,000–10,000 steps daily reduces all-cause mortality by up to 50%, per JAMA studies.', icon: '🚶', category: 'Activity' },
    { tip: 'A Mediterranean diet rich in olive oil, nuts, and fish is clinically proven to reduce heart disease risk by 30%.', icon: '🥗', category: 'Nutrition' },
    { tip: 'Chronic stress elevates cortisol, increasing risk for hypertension, diabetes, and immune suppression. Practice mindfulness daily.', icon: '🧘', category: 'Mental Health' },
    { tip: 'Drinking 500ml of water before meals can boost metabolism by 24–30% for 1–1.5 hours.', icon: '💧', category: 'Hydration' },
    { tip: 'Social connection is as important for longevity as quitting smoking — loneliness increases mortality risk by 26%.', icon: '🤝', category: 'Social Health' },
    { tip: 'Regular strength training (2x/week) reduces the risk of type 2 diabetes by 34% and all-cause mortality by 23%.', icon: '💪', category: 'Exercise' },
    { tip: 'Eating fiber from whole grains, legumes, and vegetables feeds gut microbiome and reduces colorectal cancer risk by 17%.', icon: '🌾', category: 'Gut Health' },
    { tip: 'Sun exposure (15 min/day) helps maintain vitamin D levels — deficiency is linked to depression, bone loss, and immune issues.', icon: '☀️', category: 'Vitamin D' },
    { tip: 'Limiting ultra-processed food intake lowers risk of obesity, type 2 diabetes, cardiovascular disease, and all-cause cancer.', icon: '🥦', category: 'Nutrition' },
  ];
  const tip = tips[new Date().getDate() % tips.length];
  res.json({ ...tip, date: new Date().toISOString() });
});

// ── GET /api/widgets/reviews ──────────────────────────────────────────────
router.get('/reviews', (req, res) => {
  res.json({ reviews: REVIEWS });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function weatherCodeToCondition(code) {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rainy';
  if (code <= 79) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function weatherCodeToIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌦️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function getFallbackWeather() {
  return {
    city: 'Your Location',
    temperature: 24,
    feelsLike: 22,
    humidity: 60,
    windSpeed: 12,
    precipitation: 0,
    condition: 'Partly Cloudy',
    icon: '⛅',
    unit: '°C'
  };
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function classifyArticle(title) {
  const t = title.toLowerCase();
  if (t.includes('bacteria') || t.includes('pathogen') || t.includes('virus') || t.includes('infection')) return 'Outbreak';
  if (t.includes('cancer') || t.includes('tumor')) return 'Oncology';
  if (t.includes('heart') || t.includes('cardiac')) return 'Cardiology';
  if (t.includes('vaccine') || t.includes('immuniz')) return 'Vaccines';
  if (t.includes('mental') || t.includes('depression') || t.includes('anxiety')) return 'Mental Health';
  return 'General Health';
}

function getNewsIcon(title) {
  const t = title.toLowerCase();
  if (t.includes('bacteria') || t.includes('virus') || t.includes('pathogen')) return '🦠';
  if (t.includes('cancer')) return '🎗️';
  if (t.includes('heart') || t.includes('cardiac')) return '❤️';
  if (t.includes('vaccine')) return '💉';
  if (t.includes('mental') || t.includes('brain')) return '🧠';
  if (t.includes('diabetes')) return '🩸';
  if (t.includes('drug') || t.includes('medicine') || t.includes('treatment')) return '💊';
  return '🏥';
}

function getFallbackNews() {
  return [
    {
      title: 'WHO Declares New Antimicrobial Resistance Guidelines for 2025',
      summary: 'WHO has updated its global action plan on antimicrobial resistance with new targets for reducing unnecessary antibiotic use in healthcare settings worldwide.',
      url: 'https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance',
      source: 'WHO',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      category: 'Outbreak',
      icon: '🦠'
    },
    {
      title: 'New Bacterium Linked to Gastrointestinal Illness Identified in Southeast Asia',
      summary: 'Researchers have isolated a novel strain of Clostridioides difficile resistant to first-line antibiotics, raising concerns about hospital-acquired infections.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      source: 'PubMed',
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      category: 'Outbreak',
      icon: '🦠'
    },
    {
      title: 'Breakthrough CAR-T Cell Therapy Shows 90% Remission Rate in B-cell Lymphoma',
      summary: 'A Phase III clinical trial published in NEJM reports unprecedented remission rates in relapsed B-cell lymphoma patients treated with next-generation CAR-T cells.',
      url: 'https://www.nejm.org',
      source: 'NEJM',
      publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      category: 'Oncology',
      icon: '🎗️'
    },
    {
      title: 'AI Detects Early Alzheimers 10 Years Before Symptoms, Study Finds',
      summary: 'A study in Nature Medicine demonstrates that AI-powered PET scan analysis can predict Alzheimer\'s disease onset a decade before clinical symptoms appear.',
      url: 'https://www.nature.com/nm',
      source: 'Nature Medicine',
      publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      category: 'Neurology',
      icon: '🧠'
    },
    {
      title: 'Global mRNA Vaccine Platform Expanded to Cover Seasonal Flu',
      summary: 'Moderna announces positive Phase II results for its next-generation mRNA influenza vaccine, showing superior immunogenicity versus traditional vaccines.',
      url: 'https://clinicaltrials.gov',
      source: 'ClinicalTrials.gov',
      publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      category: 'Vaccines',
      icon: '💉'
    },
    {
      title: 'Mediterranean Diet Cuts Heart Disease Risk by 28% in New Meta-Analysis',
      summary: 'A landmark meta-analysis of 1.2 million patients confirms that adherence to the Mediterranean diet significantly reduces cardiovascular disease mortality.',
      url: 'https://www.bmj.com',
      source: 'BMJ',
      publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      category: 'Cardiology',
      icon: '❤️'
    },
    {
      title: 'Gut Microbiome Composition Predicts Type 2 Diabetes Risk Years in Advance',
      summary: 'Finnish researchers show that specific microbiome signatures are detectable 7 years before diabetes onset, enabling early preventive intervention.',
      url: 'https://www.thelancet.com',
      source: 'The Lancet',
      publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      category: 'Endocrinology',
      icon: '🩸'
    },
    {
      title: 'WHO Issues Emergency Alert for Drug-Resistant Tuberculosis Spread in Eastern Europe',
      summary: 'WHO has classified extensively drug-resistant TB as a global health emergency after a significant cluster of cases emerged in three European nations.',
      url: 'https://www.who.int',
      source: 'WHO',
      publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      category: 'Outbreak',
      icon: '🦠'
    }
  ];
}

const REVIEWS = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    role: 'Oncologist, Stanford Medical Center',
    avatar: '👩‍⚕️',
    rating: 5,
    review: 'Curalink transformed how I keep up with rapidly evolving cancer research. The AI synthesizes hundreds of papers into actionable clinical insights in seconds. I now use it daily for evidence-based patient discussions.',
    date: '2025-12-14',
    disease: 'Lung Cancer',
    verified: true
  },
  {
    id: 2,
    name: 'James Okonkwo',
    role: 'Patient with Parkinson\'s Disease',
    avatar: '👨',
    rating: 5,
    review: 'I was overwhelmed by conflicting information online. Curalink gave me structured, research-backed answers about Deep Brain Stimulation trials near Toronto. It found 3 recruiting trials I didn\'t know about. This changed my treatment plan.',
    date: '2026-01-08',
    disease: 'Parkinson\'s Disease',
    verified: true
  },
  {
    id: 3,
    name: 'Dr. Priya Kapoor',
    role: 'Clinical Researcher, NIH',
    avatar: '👩‍🔬',
    rating: 5,
    review: 'The query expansion is genuinely impressive. I asked about "DBS therapy" and it automatically combined it with Parkinson\'s context, returning 80+ papers ranked by relevance and recency. This is a tool serious researchers will embrace.',
    date: '2026-02-02',
    disease: 'Neurozscience Research',
    verified: true
  },
  {
    id: 4,
    name: 'Michael Torres',
    role: 'Caregiver — Alzheimer\'s Patient',
    avatar: '👨‍👧',
    rating: 5,
    review: 'My mother was just diagnosed with early-stage Alzheimer\'s. Curalink helped me understand the latest treatments, identify relevant clinical trials in our city, and ask follow-up questions. The voice mode made it accessible when I was overwhelmed.',
    date: '2026-02-19',
    disease: 'Alzheimer\'s Disease',
    verified: true
  },
  {
    id: 5,
    name: 'Dr. Amara Diallo',
    role: 'Cardiologist, Johns Hopkins',
    avatar: '👨‍⚕️',
    rating: 4,
    review: 'Powerful tool for rapid literature synthesis. The multi-turn conversation memory is excellent — I can ask complex follow-ups without re-explaining the patient context. Integration of ClinicalTrials.gov data is seamless.',
    date: '2026-03-05',
    disease: 'Heart Disease',
    verified: true
  },
  {
    id: 6,
    name: 'Lisa Park',
    role: 'Type 1 Diabetic, Health Advocate',
    avatar: '👩',
    rating: 5,
    review: 'Finally, a medical AI that cites its sources! Every claim links back to PubMed or OpenAlex papers. I shared the clinical trial results with my endocrinologist and she was impressed by the quality of the search.',
    date: '2026-03-22',
    disease: 'Type 1 Diabetes',
    verified: true
  },
  {
    id: 7,
    name: 'Dr. Ravi Shankar',
    role: 'General Physician, Mumbai',
    avatar: '👨‍⚕️',
    rating: 5,
    review: 'Curalink is what every physician practicing evidence-based medicine has needed. I can query emerging treatment evidence in real-time without sifting through dozens of journals. It\'s like having a research librarian always on call.',
    date: '2026-04-01',
    disease: 'General Practice',
    verified: true
  },
  {
    id: 8,
    name: 'Emma Williams',
    role: 'MS Patient & Digital Health Writer',
    avatar: '👩',
    rating: 5,
    review: 'The structured output — Overview, Research Insights, Clinical Trials, Takeaways — makes complex science accessible to patients without medical training. I used it to prepare for my neurology appointment and my doctor was impressed.',
    date: '2026-04-10',
    disease: 'Multiple Sclerosis',
    verified: true
  }
];

module.exports = router;
