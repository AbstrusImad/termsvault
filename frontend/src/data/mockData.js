// Seed orchestration plus derived demo reports.
import { buildDemoDocuments } from './demoDocuments'
import { snapshotHash } from '../utils/documentParser'

export const DEFAULT_SETTINGS = {
  // 'live' talks to the deployed Bradbury contract; 'mock' uses the local engine.
  genlayerMode: 'live',
  genlayerMockMode: false,
  riskThreshold: 60,
  animations: true,
  theme: 'archive',
  activeCategories: [
    'Privacy Policy',
    'Terms of Service',
    'AI Data Usage Policy',
    'Pricing Page',
    'Roadmap Q3',
    'Governance Charter',
  ],
  autoAnalyze: true,
}

// Builds reports derived from documents that have an analysis.
export function buildDemoReports(documents) {
  const reports = []
  for (const doc of documents) {
    if (!doc.history || !doc.history.length) continue
    const an = doc.history[doc.history.length - 1]
    reports.push({
      id: 'rep_' + doc.id.replace('doc_', ''),
      documentId: doc.id,
      title: doc.project + ' ' + doc.name + ' Audit',
      project: doc.project,
      category: doc.category,
      severity: an.severity,
      changeType: an.changeType,
      userImpact: an.userImpact,
      consentRequired: an.consentRequired,
      semanticDriftScore: an.semanticDriftScore,
      confidence: an.confidence,
      summary: an.summary,
      mainChanges: an.detectedSignals,
      recommendation: an.recommendations[0] || 'Review the change.',
      recommendations: an.recommendations,
      snapshotHash: snapshotHash(doc.project + doc.name + an.id),
      genlayerStatus: 'Verified by GenLayer (mock)',
      createdAt: an.createdAt,
    })
  }
  return reports
}

export function buildSeedState() {
  const documents = buildDemoDocuments()
  const reports = buildDemoReports(documents)
  return {
    documents,
    reports,
    settings: { ...DEFAULT_SETTINGS },
    wallet: { connected: false, address: '' },
    badges: [],
    chain: { online: false, mode: 'live', stats: null, contract: '' },
    seededAt: new Date().toISOString(),
  }
}
