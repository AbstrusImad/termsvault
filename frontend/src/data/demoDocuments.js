// Realistic seed content for first run.
import { snapshotHash } from '../utils/documentParser'
import { analyzeSemanticChange } from '../utils/semanticDiff'

export const DEMO_PROJECTS = [
  'NovaAI',
  'ArcBridge',
  'CloudMint',
  'DataNest',
  'OpenDAO Labs',
  'FlowMarket',
]

export const CATEGORIES = [
  'Privacy Policy',
  'Terms of Service',
  'AI Data Usage Policy',
  'Pricing Page',
  'Roadmap Q3',
  'Governance Charter',
  'Whitepaper',
  'User Promise',
  'Governance Proposal',
  'Custom',
]

export const IMPORTANCE_LEVELS = ['Low', 'Standard', 'High', 'Critical']

// The mandatory demo case for NovaAI Privacy Policy.
export const NOVA_OLD =
  'We do not use user prompts or uploaded files to train AI models. User data is only processed to provide the service.'
export const NOVA_NEW =
  'We may use anonymized prompts, uploaded files and interaction data to improve our AI systems, safety models and selected partner integrations.'

function ts(daysAgo, hour = 10) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function makeSnapshot(text, createdAt, label) {
  return {
    id: 'snap_' + snapshotHash(text + createdAt).slice(2, 12),
    label,
    text,
    hash: snapshotHash(text),
    createdAt,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  }
}

// Builds a document with two snapshots and an analysis between them.
function buildDoc(config) {
  const { id, name, project, category, importance, oldText, newText, daysOld, daysNew } = config
  const snapOld = makeSnapshot(oldText, ts(daysOld, 9), 'v1 baseline')
  const snapshots = [snapOld]
  let analysis = null
  let history = []
  let lastAnalysis = snapOld.createdAt

  if (newText != null) {
    const snapNew = makeSnapshot(newText, ts(daysNew, 14), 'v2 revision')
    snapshots.push(snapNew)
    analysis = analyzeSemanticChange(oldText, newText)
    lastAnalysis = snapNew.createdAt
    history = [
      {
        id: 'an_' + snapshotHash(newText + 'an').slice(2, 10),
        fromSnapshot: snapOld.id,
        toSnapshot: snapNew.id,
        createdAt: snapNew.createdAt,
        ...analysis,
      },
    ]
  }

  return {
    id,
    name,
    project,
    category,
    importance: importance || 'Standard',
    source: config.source || 'pasted',
    url: config.url || '',
    snapshots,
    history,
    createdAt: snapOld.createdAt,
    lastAnalysis,
    severity: analysis ? analysis.severity : 'Stable',
    changeType: analysis ? analysis.changeType : 'Stable',
    semanticDriftScore: analysis ? analysis.semanticDriftScore : 0,
    userImpact: analysis ? analysis.userImpact : 'Neutral',
    consentRequired: analysis ? analysis.consentRequired : false,
    confidence: analysis ? analysis.confidence : 96,
  }
}

export function buildDemoDocuments() {
  return [
    buildDoc({
      id: 'doc_nova_privacy',
      name: 'Privacy Policy',
      project: 'NovaAI',
      category: 'Privacy Policy',
      importance: 'Critical',
      url: 'https://novaai.example/privacy',
      source: 'url',
      oldText: NOVA_OLD,
      newText: NOVA_NEW,
      daysOld: 41,
      daysNew: 3,
    }),
    buildDoc({
      id: 'doc_arc_tos',
      name: 'Terms of Service',
      project: 'ArcBridge',
      category: 'Terms of Service',
      importance: 'High',
      url: 'https://arcbridge.example/terms',
      source: 'url',
      oldText:
        'Users retain full ownership of any content they bridge through the protocol. We do not claim any license to your assets.',
      newText:
        'By using the protocol you grant ArcBridge a worldwide license to your content. We reserve the right to use submitted content at our discretion.',
      daysOld: 30,
      daysNew: 6,
    }),
    buildDoc({
      id: 'doc_cloud_pricing',
      name: 'Pricing Page',
      project: 'CloudMint',
      category: 'Pricing Page',
      importance: 'High',
      url: 'https://cloudmint.example/pricing',
      source: 'url',
      oldText:
        'CloudMint is free forever for individual creators. No subscription fees apply to personal accounts.',
      newText:
        'CloudMint personal accounts move to a subscription model. Monthly fees apply after the beta period and pricing may change.',
      daysOld: 22,
      daysNew: 8,
    }),
    buildDoc({
      id: 'doc_data_ai',
      name: 'AI Data Usage Policy',
      project: 'DataNest',
      category: 'AI Data Usage Policy',
      importance: 'Critical',
      url: 'https://datanest.example/ai-policy',
      source: 'url',
      oldText:
        'Customer datasets are never shared with third parties and are not used for any training purpose.',
      newText:
        'We may sell customer data, share datasets with selected partners, and use uploaded files to train AI models at our discretion.',
      daysOld: 18,
      daysNew: 2,
    }),
    buildDoc({
      id: 'doc_open_governance',
      name: 'Governance Charter',
      project: 'OpenDAO Labs',
      category: 'Governance Charter',
      importance: 'Standard',
      url: 'https://opendao.example/charter',
      source: 'url',
      oldText:
        'All treasury decisions require a community vote with a seven day voting window and a clear quorum.',
      newText:
        'Treasury decisions require a community vote with a seven day voting window and a clear quorum. Emergency actions are logged publicly.',
      daysOld: 26,
      daysNew: 5,
    }),
    buildDoc({
      id: 'doc_flow_roadmap',
      name: 'Roadmap Q3',
      project: 'FlowMarket',
      category: 'Roadmap Q3',
      importance: 'Standard',
      url: 'https://flowmarket.example/roadmap',
      source: 'url',
      oldText:
        'In Q3 we will ship the mobile app, launch the rewards program and open the public API.',
      newText:
        'In Q3 we plan to ship the mobile app and may adjust the rewards program and public API timeline at our discretion.',
      daysOld: 15,
      daysNew: 4,
    }),
    buildDoc({
      id: 'doc_nova_tos',
      name: 'Terms of Service',
      project: 'NovaAI',
      category: 'Terms of Service',
      importance: 'Standard',
      url: 'https://novaai.example/terms',
      source: 'url',
      oldText:
        'Accounts can be cancelled at any time. We provide a thirty day data export window after cancellation.',
      newText: null,
      daysOld: 12,
      daysNew: 0,
    }),
  ]
}
