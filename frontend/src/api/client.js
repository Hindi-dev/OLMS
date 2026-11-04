const API_BASE = '';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const err = await response.json();
      if (Array.isArray(err.detail)) {
        errorDetail = err.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg}`).join(', ');
      } else if (typeof err.detail === 'object' && err.detail !== null) {
        errorDetail = JSON.stringify(err.detail);
      } else {
        errorDetail = err.detail || JSON.stringify(err);
      }
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchApi('/api/health'),

  // Document Converter
  inspectPdf: (formData) => fetchApi('/api/converter/inspect', { method: 'POST', body: formData }),
  convertPdf: (formData) => fetchApi('/api/converter/convert', { method: 'POST', body: formData }),

  // Dak Tracker
  getDak: (params = '') => fetchApi(`/api/dak/${params}`),
  getDakSummary: () => fetchApi('/api/dak/stats/summary'),
  createDak: (data) => fetchApi('/api/dak/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateDak: (id, data) => fetchApi(`/api/dak/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  addDakAction: (id, data) => fetchApi(`/api/dak/${id}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // Training Roster
  getCourses: () => fetchApi('/api/training/courses'),
  getEmployees: (params = '') => fetchApi(`/api/training/employees${params}`),
  createEmployee: (data) => fetchApi('/api/training/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getNominations: (params = '') => fetchApi(`/api/training/nominations${params}`),
  createNomination: (data) => fetchApi('/api/training/nominations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateNomination: (id, data) => fetchApi(`/api/training/nominations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getRosterSummary: () => fetchApi('/api/training/roster-summary'),
  bulkImportEmployees: (formData) => fetchApi('/api/training/employees/bulk-import', { method: 'POST', body: formData }),
  clearRosterData: () => fetchApi('/api/training/employees/clear-all', { method: 'DELETE' }),

  // Translation & Reference
  getGlossary: (params = '') => fetchApi(`/api/translation/glossary${params}`),
  addGlossaryTerm: (data) => fetchApi('/api/translation/glossary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getTranslationMemory: (params = '') => fetchApi(`/api/translation/memory${params}`),
  addTranslationMemory: (data) => fetchApi('/api/translation/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  convertKrutiDev: (text) => fetchApi('/api/translation/krutidev-to-unicode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }),

  // Meetings & ATR
  getMeetings: (type = '') => fetchApi(`/api/meetings/${type ? `?meeting_type=${type}` : ''}`),
  createMeeting: (data) => fetchApi('/api/meetings/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  generateMinutesDocx: (id) => fetchApi(`/api/meetings/${id}/generate-minutes`, { method: 'POST' }),
  getAtrItems: (status = '') => fetchApi(`/api/meetings/atr/all${status ? `?status=${status}` : ''}`),
  recordAtr: (data) => fetchApi('/api/meetings/atr/record', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // Compliance & QPR
  getKnowledgeBase: () => fetchApi('/api/compliance/knowledge-base'),
  getTargets: () => fetchApi('/api/compliance/targets'),
  getSection33Categories: () => fetchApi('/api/compliance/section3-3-categories'),
  getQprList: () => fetchApi('/api/compliance/qpr'),
  submitQpr: (data) => fetchApi('/api/compliance/qpr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  evaluateQpr: (id) => fetchApi(`/api/compliance/qpr/${id}/evaluate`),

  // Policy Documents Ready Reference
  getPolicyDocs: (params = '') => fetchApi(`/api/policy-docs/${params}`),
  uploadPolicyDoc: (formData) => fetchApi('/api/policy-docs/upload', { method: 'POST', body: formData }),
  searchPolicyReference: (query, category = '') => fetchApi(`/api/policy-docs/search/ready-reference?query=${encodeURIComponent(query)}${category ? `&category=${encodeURIComponent(category)}` : ''}`),
  getPolicyDocDetail: (id) => fetchApi(`/api/policy-docs/${id}`),
  deletePolicyDoc: (id) => fetchApi(`/api/policy-docs/${id}`, { method: 'DELETE' }),

  // Government Email Integration (mail.gov.in)
  getEmailConfig: () => fetchApi('/api/email/config'),
  saveEmailConfig: (data) => fetchApi('/api/email/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  testEmailConnection: (data = {}) => fetchApi('/api/email/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  syncEmailDak: () => fetchApi('/api/email/sync', { method: 'POST' })
};
