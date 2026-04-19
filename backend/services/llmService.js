/**
 * LLM Service — Streaming + Non-streaming
 * Priority: Ollama streaming → HuggingFace → Smart Template
 */
const axios = require('axios');

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
const HF_TOKEN     = process.env.HF_API_TOKEN || '';
const HF_MODEL     = process.env.HF_MODEL     || 'mistralai/Mistral-7B-Instruct-v0.2';

async function generateResponse(userQuery, queryInfo, publications, trials, patientContext, conversationHistory, languagePrompt = '') {
  const prompt = buildPrompt(userQuery, queryInfo, publications, trials, patientContext, conversationHistory, languagePrompt);

  try {
    const ollamaResp = await callOllama(prompt);
    if (ollamaResp) return { text: ollamaResp, source: 'ollama' };
  } catch (e) {
    console.log('Ollama unavailable, trying HuggingFace...');
  }

  if (HF_TOKEN) {
    try {
      const hfResp = await callHuggingFace(prompt);
      if (hfResp) return { text: hfResp, source: 'huggingface' };
    } catch (e) {
      console.log('HuggingFace unavailable, using conversational template...');
    }
  }

  return { text: buildConversationalResponse(userQuery, queryInfo, publications, trials, patientContext, conversationHistory), source: 'template' };
}

async function callOllama(prompt) {
  const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.4, top_p: 0.9, num_predict: 900 }
  }, { timeout: 20000 });
  return res.data?.response?.trim() || null;
}

// Streaming Ollama — calls onToken(text) per token, returns full text
async function callOllamaStream(prompt, onToken) {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: OLLAMA_MODEL, prompt, stream: true,
    options: { temperature: 0.4, top_p: 0.9, num_predict: 900 }
  }, { responseType: 'stream', timeout: 60000 });

  let fullText = '';
  await new Promise((resolve, reject) => {
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) { fullText += parsed.response; onToken(parsed.response); }
          if (parsed.done) resolve();
        } catch {}
      }
    });
    response.data.on('end', resolve);
    response.data.on('error', reject);
  });
  return fullText;
}

async function callHuggingFace(prompt) {
  const res = await axios.post(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    { inputs: prompt, parameters: { max_new_tokens: 900, temperature: 0.4 } },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` }, timeout: 45000 }
  );
  const output = res.data?.[0]?.generated_text || '';
  return output.replace(prompt, '').trim() || null;
}

function buildPrompt(userQuery, queryInfo, publications, trials, patientContext, history, languagePrompt = '') {
  const disease    = queryInfo.disease || patientContext?.disease || 'the condition';
  const patientName = patientContext?.name ? `Patient: ${patientContext.name}. ` : '';
  const location   = patientContext?.location ? `Location: ${patientContext.location}. ` : '';

  const pubSummaries = publications.slice(0, 6).map((p, i) =>
    `[${i+1}] "${p.title}" — ${p.authors?.slice(0,2).join(', ') || 'Unknown'} (${p.year || 'N/A'})\nAbstract: ${p.abstract?.slice(0,280) || 'No abstract'}`
  ).join('\n\n');

  const trialSummaries = trials.slice(0, 4).map((t, i) =>
    `[T${i+1}] "${t.title}" — Status: ${t.statusLabel} | ${t.locations?.slice(0,2).join('; ') || 'N/A'}`
  ).join('\n\n');

  const recentHistory = history.slice(-4).map(m =>
    `${m.role === 'user' ? 'Patient' : 'Curalink'}: ${m.content?.slice(0, 200)}`
  ).join('\n');

  return `You are Curalink, a warm, knowledgeable, and empathetic AI medical research companion. You speak in a conversational, caring tone — like a knowledgeable doctor friend. You explain medical concepts clearly, acknowledge how difficult health issues can be, and always provide hope alongside facts.${languagePrompt}

${patientName}${location}Disease context: ${disease}

RECENT CONVERSATION:
${recentHistory || 'This is the start of the conversation.'}

USER QUESTION: "${userQuery}"

RETRIEVED PUBLICATIONS (${publications.length} found):
${pubSummaries || 'No publications retrieved.'}

RETRIEVED CLINICAL TRIALS (${trials.length} found):
${trialSummaries || 'No clinical trials retrieved.'}

INSTRUCTIONS:
Respond in this exact warm, conversational format:

## 🧬 What This Means For You
Start with empathy. Briefly explain what ${disease} is or how it relates to their question. Make it personal and easy to understand.

## 🔬 What the Latest Research Shows
Walk through the key findings conversationally. Use phrases like "Interestingly, researchers found...", "Great news — a 2024 study showed...", "Something to discuss with your doctor is...". Reference specific studies by author and year.

## 💊 Symptoms & What to Watch For
If relevant, explain the symptoms clearly. Use bullet points. Explain what each symptom means in plain language.

## 🌿 Treatment Options & Cures
Explain available treatments including medications, therapies, lifestyle changes, and emerging options. Be specific about what the research shows works best.

## 🏥 Clinical Trials (Your Opportunities)
Present trials as opportunities. Explain what each trial is testing and who might qualify. Make it exciting and hopeful.

## 💡 My Personalized Recommendations For You
Give 4-5 specific, actionable, personalized takeaways based on their disease and question. Reference the research.

## ⚠️ Important Note
Remind them this is research information and they should consult their healthcare team. Keep this warm, not clinical.

Be conversational, warm, and encouraging throughout. This person needs both facts AND hope.

RESPONSE:`;
}

// ─── Conversational Template ──────────────────────────────────────────────────
function buildConversationalResponse(userQuery, queryInfo, publications, trials, patientContext, history) {
  const disease  = queryInfo.disease || patientContext?.disease || 'your condition';
  const name     = patientContext?.name;
  const nameGreet = name ? `${name}, ` : '';
  const intent   = queryInfo.intent || 'general';
  const year     = new Date().getFullYear();

  const topPubs   = publications.slice(0, 6);
  const topTrials = trials.slice(0, 4);

  // Previous disease context for multi-turn
  const prevMessages = history.filter(m => m.role === 'user');
  const isFollowUp   = prevMessages.length > 1;
  const followUpNote = isFollowUp
    ? `I'm continuing from our earlier conversation about **${disease}**, and this is a great follow-up question. `
    : '';

  // ── Section 1: What This Means ──────────────────────────────────────────
  const diseaseContext = getDiseaseContext(disease);
  const intro = name
    ? `${followUpNote}${nameGreet}I understand living with **${disease}** can be challenging, and I'm here to help with the most current research. `
    : `${followUpNote}I've analyzed ${topPubs.length} recent publications and ${topTrials.length} clinical trials to give you the best information on **${disease.toLowerCase()}**. `;

  const whatItMeans = `${intro}${diseaseContext}`;

  // ── Section 2: Research Findings ────────────────────────────────────────
  let researchText = '';
  if (topPubs.length > 0) {
    researchText = topPubs.slice(0, 4).map((p, i) => {
      const authorStr = p.authors?.slice(0,2).join(' & ') || 'Research teams';
      const yearStr   = p.year ? ` (${p.year})` : ` (${year})`;
      const snippet   = p.abstract?.slice(0, 220) || 'This study explores important aspects of treatment and outcomes.';
      const prefix = i === 0
        ? `🔬 **Most relevant finding:** `
        : i === 1
          ? `📊 **Additionally, ` : i === 2 ? `💡 **Interestingly, ` : `🧪 **Another study found: `;
      const suffix = i === 1 || i === 2 ? '**' : '';
      return `**${authorStr}${yearStr}** published in *${p.source}*: "${p.title}"\n${prefix}${snippet}...${suffix}`;
    }).join('\n\n');
  } else {
    researchText = `While my retrieval didn't find highly specific papers for this exact query right now, the broader research on ${disease} is quite active. I'd recommend checking PubMed directly for the latest updates.`;
  }

  // ── Section 3: Symptoms ─────────────────────────────────────────────────
  const symptomsText = getSymptomsText(disease, intent);

  // ── Section 4: Treatments ───────────────────────────────────────────────
  const treatmentText = getTreatmentText(disease, intent, topPubs);

  // ── Section 5: Trials ───────────────────────────────────────────────────
  let trialsText = '';
  if (topTrials.length > 0) {
    trialsText = topTrials.map((t, i) => {
      const locationStr = t.locations?.slice(0,2).join(' · ') || 'Multiple locations';
      const statusEmoji = t.status === 'RECRUITING' ? '🟢' : t.status === 'COMPLETED' ? '🔵' : '🟡';
      return `${statusEmoji} **Trial ${i+1}: ${t.title}**\n**Status:** ${t.statusLabel} | **Where:** ${locationStr}\n${t.summary?.slice(0, 180) || ''}...\n🔗 [View full details & enrollment](${t.url || 'https://clinicaltrials.gov'})`;
    }).join('\n\n');
  } else {
    trialsText = `No active trials matched exactly right now, but new trials open frequently. I'd suggest checking [ClinicalTrials.gov](https://clinicaltrials.gov) directly and setting up email alerts for "${disease}".`;
  }

  // ── Section 6: Takeaways ─────────────────────────────────────────────────
  const takeaways = buildPersonalizedTakeaways(intent, disease, topPubs, topTrials, patientContext);

  return `## 🧬 What This Means For You
${whatItMeans}

## 🔬 What the Latest Research Shows
${researchText}

## 💊 Symptoms & What to Watch For
${symptomsText}

## 🌿 Treatment Options & What's Working
${treatmentText}

## 🏥 Clinical Trials — Your Opportunities
${trialsText}

## 💡 My Personalized Recommendations
${takeaways}

## ⚠️ Important Note
This research summary is for educational purposes. Every patient's situation is unique — please discuss these findings with your healthcare team before making any changes to your treatment plan. You're doing the right thing by staying informed! 💙`;
}

// ─── Disease-specific context ─────────────────────────────────────────────────
function getDiseaseContext(disease) {
  const d = disease.toLowerCase();
  if (d.includes('lung cancer') || d.includes('lung'))
    return `Lung cancer is one of the most researched areas in oncology today. The good news is that treatment options have expanded dramatically in recent years, especially with immunotherapy and targeted therapies showing remarkable results.`;
  if (d.includes('parkinson'))
    return `Parkinson's disease affects dopamine-producing neurons, but research is moving rapidly. Deep Brain Stimulation, gene therapies, and neuroprotective agents are exciting frontiers being actively studied.`;
  if (d.includes('alzheimer') || d.includes('dementia'))
    return `Alzheimer's is a complex neurodegenerative disease, but 2024-2025 has seen breakthrough FDA approvals for disease-modifying therapies. Early detection and intervention are key themes in current research.`;
  if (d.includes('diabetes'))
    return `Diabetes management has been revolutionized in recent years with continuous glucose monitors, new GLP-1 medications, and research into potential cures via islet cell transplantation and artificial pancreas systems.`;
  if (d.includes('heart') || d.includes('cardiac'))
    return `Cardiovascular disease remains a leading health challenge, but cardiologists now have powerful tools — from PCSK9 inhibitors reducing cholesterol dramatically to structural heart repair techniques that avoid open surgery.`;
  if (d.includes('cancer'))
    return `Cancer research is advancing at an unprecedented pace. Precision oncology, immunotherapy, CAR-T cell therapy, and targeted molecular treatments are transforming outcomes across many cancer types.`;
  return `This is an active area of medical research with new findings emerging regularly. I've pulled the most recent and relevant publications to give you a comprehensive picture.`;
}

// ─── Symptom explainer ────────────────────────────────────────────────────────
function getSymptomsText(disease, intent) {
  const d = disease.toLowerCase();
  if (intent === 'treatment' || intent === 'recent_research') {
    // For treatment queries, mention when to seek help
    return `**Key warning signs to discuss with your doctor:**
• Any new or worsening symptoms since your last check-up
• Side effects from current medications that affect daily life
• Changes in energy levels, sleep, or cognitive function
• Any sudden changes that feel different from your usual baseline

📌 **Track your symptoms** in a journal — noting when they occur, severity (1-10), and potential triggers. This data is invaluable for your care team.`;
  }
  if (d.includes('lung cancer')) {
    return `**Common symptoms to monitor:**
• 🫁 Persistent cough lasting more than 3 weeks (especially if it changes character)
• 🩸 Coughing up blood or rust-colored sputum
• 😮‍💨 Shortness of breath even with mild activity
• 🤧 Repeated respiratory infections (pneumonia, bronchitis)
• ⚖️ Unexplained weight loss and loss of appetite
• 💪 Bone pain (if cancer has spread to bones)
• 🧠 Headaches with vision changes (if spread to brain)

📌 **Important:** Many people with early lung cancer have NO symptoms — this is why regular screening (low-dose CT) is recommended for high-risk individuals.`;
  }
  if (d.includes('parkinson')) {
    return `**Classic Parkinson's symptoms (remember TRAP):**
• 🤲 **T**remor — Resting tremor, often "pill-rolling" motion in hands
• 🦾 **R**igidity — Muscle stiffness and resistance to movement
• 🐌 **A**kinesia/Bradykinesia — Slowness of movement, small shuffling steps
• ⚖️ **P**ostural instability — Balance problems, increased fall risk

**Non-motor symptoms (often overlooked):**
• 😴 Sleep disturbances and REM sleep behavior disorder
• 👃 Loss of smell (often years before motor symptoms)
• 😔 Depression and anxiety
• 🍽️ Constipation and autonomic dysfunction
• 🧠 Cognitive changes in later stages`;
  }
  if (d.includes('alzheimer') || d.includes('dementia')) {
    return `**Early warning signs of Alzheimer's:**
• 🧠 Memory lapses that disrupt daily life (forgetting recent events, names)
• 🗓️ Difficulty with planning and problem-solving (e.g., losing track of finances)
• 😕 Confusion with time, place, or sequence of events
• 👁️ Visual-spatial difficulties (misjudging distances, reading difficulties)
• 🗣️ Word-finding problems in conversations
• 📍 Getting lost in familiar places
• 😤 Personality changes — increased anxiety, suspicion, or withdrawal

📌 **Critical:** Early diagnosis enables access to the newest disease-modifying therapies (like Leqembi/lecanemab) which are most effective in early stages.`;
  }
  return `**General symptoms to monitor and discuss with your doctor:**
• Any new symptoms or changes in existing symptoms
• Changes in energy, sleep, or appetite
• Side effects from current medications
• Mental health changes (mood, anxiety, cognitive function)
• Physical changes like unexplained weight changes

📌 Keep a symptom diary — note timing, severity, and what makes it better or worse.`;
}

// ─── Treatment explainer ──────────────────────────────────────────────────────
function getTreatmentText(disease, intent, pubs) {
  const d = disease.toLowerCase();
  const recentPub = pubs.find(p => p.year >= new Date().getFullYear() - 2);
  const pubNote = recentPub
    ? `\n\n📰 **Recent finding (${recentPub.year}):** "${recentPub.title?.slice(0,100)}..." — this aligns with current treatment guidelines.`
    : '';

  if (d.includes('lung cancer')) {
    return `**Current treatment landscape (2024-2025):**

🎯 **Targeted Therapy** (if mutation-positive — EGFR, ALK, ROS1, etc.)
• Osimertinib (Tagrisso), Alectinib — remarkable response rates with fewer side effects
• Get molecular profiling of your tumor — it determines which drugs work best for YOU

🛡️ **Immunotherapy**
• PD-1/PD-L1 inhibitors (Pembrolizumab/Keytruda, Atezolizumab) — now 1st-line for many patients
• Works best if PD-L1 expression > 50% on your tumor tissue test

🔬 **Chemotherapy** — still effective, often combined with immunotherapy for synergy

🔆 **Radiation Therapy** — Stereotactic Body Radiation (SBRT) for early-stage; palliative for advanced

✂️ **Surgery** — Gold standard for Stage I-II; Video-Assisted Thoracoscopic Surgery (VATS) is minimally invasive${pubNote}`;
  }
  if (d.includes('parkinson')) {
    return `**Current treatment approaches:**

💊 **Medications (cornerstone of treatment)**
• **Levodopa/Carbidopa** (Sinemet) — most effective for motor symptoms, still the gold standard
• **Dopamine agonists** (Pramipexole, Ropinirole) — used early or as add-on
• **MAO-B inhibitors** (Rasagiline, Selegiline) — slow disease progression modestly
• **COMT inhibitors** — extend levodopa's effect, reduce "off" time

⚡ **Deep Brain Stimulation (DBS)**
• Electrodes implanted in subthalamic nucleus or globus pallidus
• Most effective for patients with good response to levodopa & no cognitive decline
• Can reduce "off" periods by up to 70%!

🏃 **Exercise — Critically important**
• High-intensity aerobic exercise may slow progression (not just symptom relief)
• Tai chi, dance (tango especially!), and boxing specifically studied with positive results
• Rock Steady Boxing has excellent evidence for Parkinson's${pubNote}`;
  }
  if (d.includes('diabetes')) {
    return `**Cutting-edge diabetes management:**

💉 **GLP-1 Receptor Agonists (Game-changers)**
• Semaglutide (Ozempic/Wegovy) — reduces HbA1c AND causes significant weight loss
• Tirzepatide (Mounjaro) — dual GIP/GLP-1 action, even more effective
• Cardiovascular protection is a bonus benefit!

📱 **Technology**
• Continuous Glucose Monitors (CGM) — Dexcom, Libre — real-time glucose tracking
• Closed-loop insulin delivery ("artificial pancreas") — dramatically improves control
• Smart insulin pens with dose memory

🧬 **Emerging Therapies**
• Stem cell-derived islet cell transplantation (Phase II trials showing promise)
• Oral insulin formulations in development
• SGLT2 inhibitors (Empagliflozin) — kidney and heart protective effects${pubNote}`;
  }
  return `**Evidence-based treatment approaches:**

The research shows a multi-modal approach works best:

🔬 **Medical/Pharmacological**
• First-line medications based on your specific disease subtype and severity
• Regular medication reviews to optimize without over-medicating

🏋️ **Lifestyle Interventions** (often underestimated!)
• Exercise — 150 min/week moderate aerobic activity has strong evidence
• Anti-inflammatory diet (Mediterranean pattern) benefits multiple conditions
• Sleep optimization — poor sleep worsens virtually every chronic condition

🧠 **Mental Health Support**
• Psychological support is NOT optional — it's part of medical care
• Cognitive Behavioral Therapy has proven benefits alongside medical treatment

📋 **Monitoring**
• Regular biomarker monitoring to track disease progression
• Shared decision-making with your care team${pubNote}`;
}

// ─── Personalized takeaways ────────────────────────────────────────────────────
function buildPersonalizedTakeaways(intent, disease, pubs, trials, ctx) {
  const lines = [];
  const name = ctx?.name;

  if (name) lines.push(`• **${name}, your most important step:** Bring these research findings to your next specialist appointment and ask specifically about the treatments mentioned above.`);

  if (pubs.length > 0) {
    const recent = pubs.filter(p => p.year >= new Date().getFullYear() - 2);
    if (recent.length > 0) {
      lines.push(`• **Very recent evidence (${recent[0].year}):** "${recent[0].title?.slice(0,80)}..." — this is cutting-edge and worth discussing with your doctor.`);
    }
    lines.push(`• **${pubs.length} publications** were analyzed and ranked by relevance, scientific recency, and citation impact for your specific query.`);
  }

  if (trials.length > 0) {
    const recruiting = trials.filter(t => t.status === 'RECRUITING');
    if (recruiting.length > 0) {
      lines.push(`• **🟢 ${recruiting.length} clinical trial(s) are actively recruiting** right now — these represent access to cutting-edge treatments not yet available commercially. Click the trial links above to check your eligibility.`);
    }
    if (ctx?.location) {
      lines.push(`• **Trials near ${ctx.location}** have been prioritized in the results above — ask your doctor for a referral if you qualify.`);
    }
  }

  lines.push(`• **Get a second opinion** from a specialist at an academic medical center — they have access to the newest treatments and clinical trials.`);
  lines.push(`• **Join a patient community** (Patient Advocate Foundation, disease-specific non-profits) — peer support has measurable health benefits and members often share trial opportunities.`);

  return lines.join('\n') || `• Stay engaged with your care team\n• Review these research findings with your specialist\n• Consider clinical trials for access to emerging therapies`;
}

module.exports = { generateResponse, callOllamaStream, buildPrompt, buildConversationalResponse };
