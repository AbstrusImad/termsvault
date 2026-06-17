// Risk scoring helpers shared across the dashboard and documents.

export const SEVERITY_ORDER = ['Stable', 'Minor', 'Medium', 'High', 'Critical']

export const SEVERITY_META = {
  Stable: { weight: 0, color: '#3fd6b0', label: 'Stable' },
  Minor: { weight: 1, color: '#c8a45b', label: 'Minor' },
  Medium: { weight: 2, color: '#e0a04b', label: 'Medium' },
  High: { weight: 3, color: '#e85c5c', label: 'High' },
  Critical: { weight: 4, color: '#b53e3e', label: 'Critical' },
}

export function severityWeight(severity) {
  return SEVERITY_META[severity] ? SEVERITY_META[severity].weight : 0
}

export function severityColor(severity) {
  return SEVERITY_META[severity] ? SEVERITY_META[severity].color : '#8a8678'
}

// Status used by the observatory map nodes.
export function statusForDocument(doc) {
  if (!doc) return 'stable'
  if (doc.consentRequired) return 'consent'
  const sev = doc.severity || 'Stable'
  if (sev === 'Critical' || sev === 'High') return 'high'
  if (sev === 'Medium') return 'medium'
  if (sev === 'Minor') return 'minor'
  return 'stable'
}

export const STATUS_META = {
  stable: { label: 'Stable', color: '#3fd6b0', glow: 'rgba(63,214,176,0.5)' },
  minor: { label: 'Minor', color: '#c8a45b', glow: 'rgba(200,164,91,0.5)' },
  medium: { label: 'Medium', color: '#e0a04b', glow: 'rgba(224,160,75,0.55)' },
  high: { label: 'High risk', color: '#e85c5c', glow: 'rgba(232,92,92,0.65)' },
  consent: { label: 'Consent required', color: '#7b5cff', glow: 'rgba(123,92,255,0.65)' },
}

// Accumulated risk across a document history (0-100).
export function accumulatedRisk(history = []) {
  if (!history.length) return 0
  let total = 0
  for (const h of history) {
    total += (h.semanticDriftScore || 0) * (1 + severityWeight(h.severity) * 0.1)
  }
  const avg = total / history.length
  return Math.min(100, Math.round(avg))
}

// Aggregate severity counts grouped by category for charts.
export function severityByCategory(documents = []) {
  const map = {}
  for (const doc of documents) {
    const cat = doc.category || 'Custom'
    if (!map[cat]) map[cat] = { category: cat, Stable: 0, Minor: 0, Medium: 0, High: 0, Critical: 0 }
    const sev = doc.severity || 'Stable'
    map[cat][sev] = (map[cat][sev] || 0) + 1
  }
  return Object.values(map)
}

export function summarizeDocuments(documents = []) {
  let changes = 0
  let highRisk = 0
  let stable = 0
  let consent = 0
  for (const doc of documents) {
    const sev = doc.severity || 'Stable'
    if (sev !== 'Stable') changes++
    if (sev === 'High' || sev === 'Critical') highRisk++
    if (sev === 'Stable') stable++
    if (doc.consentRequired) consent++
  }
  return {
    watched: documents.length,
    changes,
    highRisk,
    stable,
    consent,
  }
}
