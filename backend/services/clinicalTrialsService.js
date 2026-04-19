/**
 * ClinicalTrials.gov API v2 Service
 */
const axios = require('axios');

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Fetch clinical trials from ClinicalTrials.gov
 * @param {string} disease - Disease/condition to search
 * @param {string} query - Additional query terms
 * @param {string} location - Optional location filter
 * @param {number} pageSize - Results per fetch
 */
async function fetchClinicalTrials(disease, query = '', location = '', pageSize = 50) {
  try {
    const statuses = ['RECRUITING', 'NOT_YET_RECRUITING', 'ENROLLING_BY_INVITATION'];

    // Fetch recruiting + all statuses in parallel
    const requests = statuses.map(status =>
      axios.get(CT_BASE, {
        params: {
          'query.cond': disease || query,
          'query.term': query || undefined,
          'filter.overallStatus': status,
          pageSize: Math.ceil(pageSize / statuses.length),
          format: 'json',
          fields: [
            'NCTId', 'BriefTitle', 'OfficialTitle', 'OverallStatus',
            'BriefSummary', 'EligibilityCriteria', 'Condition',
            'LocationFacility', 'LocationCity', 'LocationCountry',
            'CentralContactName', 'CentralContactPhone', 'CentralContactEMail',
            'StartDate', 'PrimaryCompletionDate', 'Phase', 'StudyType',
            'EnrollmentCount'
          ].join(',')
        },
        timeout: 15000
      }).catch(() => ({ data: { studies: [] } }))
    );

    // Also fetch completed trials for broader context
    const completedReq = axios.get(CT_BASE, {
      params: {
        'query.cond': disease || query,
        'filter.overallStatus': 'COMPLETED',
        pageSize: 10,
        format: 'json'
      },
      timeout: 15000
    }).catch(() => ({ data: { studies: [] } }));

    const responses = await Promise.all([...requests, completedReq]);
    const allStudies = [];
    const seen = new Set();

    for (const resp of responses) {
      const studies = resp.data?.studies || [];
      for (const study of studies) {
        const nctId = study?.protocolSection?.identificationModule?.nctId;
        if (nctId && !seen.has(nctId)) {
          seen.add(nctId);
          const parsed = parseTrial(study);
          if (parsed) allStudies.push(parsed);
        }
      }
    }

    return allStudies;
  } catch (err) {
    console.error('ClinicalTrials fetch error:', err.message);
    return [];
  }
}

function parseTrial(study) {
  try {
    const proto = study?.protocolSection;
    if (!proto) return null;

    const id      = proto.identificationModule;
    const status  = proto.statusModule;
    const desc    = proto.descriptionModule;
    const elig    = proto.eligibilityModule;
    const contacts = proto.contactsLocationsModule;
    const design  = proto.designModule;

    const nctId       = id?.nctId || '';
    const title       = id?.briefTitle || id?.officialTitle || '';
    const overallStat = status?.overallStatus || '';
    const summary     = desc?.briefSummary || '';

    // Eligibility
    const eligibility = elig?.eligibilityCriteria
      ? elig.eligibilityCriteria.substring(0, 500)
      : '';
    const minAge  = elig?.minimumAge || '';
    const maxAge  = elig?.maximumAge || '';
    const sex     = elig?.sex || 'ALL';

    // Locations
    const locations = (contacts?.locations || []).map(loc =>
      [loc.facility, loc.city, loc.state, loc.country].filter(Boolean).join(', ')
    ).slice(0, 5);

    // Contacts
    const centralContacts = (contacts?.centralContacts || []).map(c => ({
      name:  c.name || '',
      phone: c.phone || '',
      email: c.email || ''
    })).slice(0, 2);

    // Conditions
    const conditions = proto.conditionsModule?.conditions || [];

    // Dates
    const startDate      = status?.startDateStruct?.date || '';
    const completionDate = status?.primaryCompletionDateStruct?.date || '';

    // Phase
    const phases      = design?.phases || [];
    const phase       = phases.join(', ') || 'N/A';
    const enrollment  = design?.enrollmentInfo?.count || '';

    return {
      id: nctId,
      nctId,
      title: title.substring(0, 200),
      status: overallStat,
      statusLabel: formatStatus(overallStat),
      summary: summary.substring(0, 400),
      eligibility: eligibility,
      minAge,
      maxAge,
      sex,
      locations,
      contacts: centralContacts,
      conditions,
      startDate,
      completionDate,
      phase,
      enrollment,
      source: 'ClinicalTrials',
      url: `https://clinicaltrials.gov/study/${nctId}`
    };
  } catch (err) {
    return null;
  }
}

function formatStatus(status) {
  const map = {
    RECRUITING: '🟢 Recruiting',
    NOT_YET_RECRUITING: '🟡 Not Yet Recruiting',
    ENROLLING_BY_INVITATION: '🔵 Enrolling by Invitation',
    ACTIVE_NOT_RECRUITING: '🟠 Active, Not Recruiting',
    COMPLETED: '✅ Completed',
    SUSPENDED: '⏸️ Suspended',
    TERMINATED: '🔴 Terminated',
    WITHDRAWN: '❌ Withdrawn'
  };
  return map[status] || status;
}

module.exports = { fetchClinicalTrials };
