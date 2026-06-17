// Local semantic change engine.
// Deterministic, dependency free. Returns a fixed report shape.
import { normalizeText, splitSentences } from './documentParser'

// Words that, when newly granted, raise risk.
export const CRITICAL_WORDS = [
  'never',
  'may',
  'partners',
  'ai training',
  'fees',
  'ownership',
  'third parties',
  'reserve the right',
  'share',
  'sell',
  'discretion',
  'license',
]

// Order matters: it drives the order signals are reported.
const RISK_SIGNALS = [
  { key: 'ai training', label: 'AI training permission added', weight: 26, patterns: [/train(?:ing)?\s+(?:our\s+)?ai/i, /improve our ai/i, /ai (?:systems|models)/i, /train ai models/i, /train(?:ing)?\s+models?/i] },
  { key: 'uploaded files', label: 'Uploaded files usage expanded', weight: 18, patterns: [/uploaded files/i, /uploaded content/i] },
  { key: 'partners', label: 'Partner integrations added', weight: 18, patterns: [/partner/i, /selected partner/i] },
  { key: 'third parties', label: 'Third party sharing introduced', weight: 22, patterns: [/third part(?:y|ies)/i] },
  { key: 'sell data', label: 'Data sale clause introduced', weight: 30, patterns: [/sell (?:your |user )?data/i, /\bsell\b[^.]*\bdata\b/i] },
  { key: 'share data', label: 'Data sharing expanded', weight: 16, patterns: [/shared? with/i, /share(?:d)? (?:your |user )?data/i, /share .*information/i] },
  { key: 'discretion', label: 'Discretionary rights added', weight: 14, patterns: [/at our discretion/i, /reserve the right/i, /sole discretion/i] },
  { key: 'interaction data', label: 'Interaction data collection added', weight: 12, patterns: [/interaction data/i, /usage data/i, /behaviou?ral data/i] },
]

// Signal keys that indicate a privacy/data weakening specifically.
const PRIVACY_KEYS = new Set(['ai training', 'uploaded files', 'partners', 'third parties', 'sell data', 'share data', 'interaction data'])

const PRICING_PATTERNS = [/pricing/i, /\bfees?\b/i, /subscription/i, /\bbilling\b/i, /\bcharge[ds]?\b/i, /per month/i, /monthly/i, /\$\d/]
const OWNERSHIP_SHIFT = [/grant[^.]*licen[sc]e/i, /worldwide licen[sc]e/i, /we (?:may )?licen[sc]e/i, /licen[sc]e to your/i, /licen[sc]e to use/i, /claim[^.]*licen[sc]e/i]
const OWNERSHIP_RETAIN = [/retain[^.]*ownership/i, /you own/i, /your content/i, /do not claim/i, /full ownership/i]

const PERMISSION_OPENERS = [/\bmay\b/i, /\bcan\b/i, /\bmight\b/i, /improve our ai/i, /at our discretion/i, /reserve the right/i]
const RESTRICTION_PROMISES = [/\bnever\b/i, /\bdo not\b/i, /\bdoes not\b/i, /\bwill not\b/i, /\bare not\b/i, /\bis not\b/i, /\bonly\b/i, /\bno\b\s+\w+\s+(?:data|sharing|fees)/i]

function anyMatch(text, patterns) {
  return patterns.some((p) => p.test(text))
}

function countMatches(text, patterns) {
  let n = 0
  for (const p of patterns) if (p.test(text)) n++
  return n
}

function severityFromScore(score) {
  if (score >= 90) return 'Critical'
  if (score >= 65) return 'High'
  if (score >= 38) return 'Medium'
  if (score >= 12) return 'Minor'
  return 'Stable'
}

// Token level Jaccard distance, cheap and deterministic.
function textDivergence(a, b) {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 2))
  const tb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 2))
  if (ta.size === 0 && tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  const union = ta.size + tb.size - inter
  if (union === 0) return 0
  return 1 - inter / union
}

export function analyzeSemanticChange(oldText, newText) {
  const oldNorm = normalizeText(oldText)
  const newNorm = normalizeText(newText)

  if (oldNorm === newNorm) return buildStable()

  const oldLower = oldNorm.toLowerCase()
  const newLower = newNorm.toLowerCase()

  // Old text restricts behavior with explicit promises.
  const oldRestrictive = anyMatch(oldLower, RESTRICTION_PROMISES)

  const detectedSignals = []
  const detectedKeys = []
  let signalScore = 0

  for (const sig of RISK_SIGNALS) {
    const inNew = anyMatch(newLower, sig.patterns)
    if (!inNew) continue
    const inOld = anyMatch(oldLower, sig.patterns)
    // A permission is newly granted when it is absent from the old text, or
    // when the old text only mentioned it to deny it (restrictive context).
    if (!inOld || oldRestrictive) {
      signalScore += sig.weight
      detectedSignals.push(sig.label)
      detectedKeys.push(sig.key)
    } else {
      signalScore += sig.weight * 0.2
    }
  }

  const oldPermit = countMatches(oldLower, PERMISSION_OPENERS)
  const newPermit = countMatches(newLower, PERMISSION_OPENERS)
  const oldRestrictCount = countMatches(oldLower, RESTRICTION_PROMISES)
  const promiseWeakened = oldRestrictCount > 0 && newPermit > oldPermit
  const permGain = Math.max(0, newPermit - oldPermit)

  const pricingChanged = countMatches(newLower, PRICING_PATTERNS) > countMatches(oldLower, PRICING_PATTERNS)
  const ownershipChanged = anyMatch(newLower, OWNERSHIP_SHIFT) && (anyMatch(oldLower, OWNERSHIP_RETAIN) || !anyMatch(oldLower, OWNERSHIP_SHIFT))

  const divergence = textDivergence(oldNorm, newNorm)

  // Composite, calibrated score.
  let drift = signalScore * 0.7
  if (promiseWeakened) {
    drift += 18
    detectedSignals.push('Original promise weakened')
  }
  if (permGain > 0) drift += 5
  if (pricingChanged) drift += 22
  drift += divergence * 12
  drift = Math.max(0, Math.min(100, Math.round(drift)))

  const privacyWeakened = detectedKeys.some((k) => PRIVACY_KEYS.has(k)) && (promiseWeakened || drift >= 40)

  let changeType
  if (privacyWeakened) changeType = 'Privacy weakened'
  else if (ownershipChanged) changeType = 'Ownership change'
  else if (pricingChanged) changeType = 'Pricing change'
  else if (permGain > 0 || divergence > 0.45) changeType = 'Scope expanded'
  else if (drift < 12) changeType = 'Stable'
  else changeType = 'Minor wording'

  const severity = severityFromScore(drift)

  let userImpact = 'Neutral'
  if (privacyWeakened || ownershipChanged || promiseWeakened || drift >= 65) userImpact = 'Negative'
  else if (pricingChanged && drift >= 35) userImpact = 'Negative'

  // Positive case: restrictions strengthened without new permissions.
  const newRestrictCount = countMatches(newLower, RESTRICTION_PROMISES)
  if (newRestrictCount > oldRestrictCount && newPermit <= oldPermit && !privacyWeakened && !pricingChanged) {
    userImpact = 'Positive'
  }

  const consentRequired = privacyWeakened || (ownershipChanged && drift >= 50) || drift >= 80

  const confidence = Math.max(58, Math.min(97, 64 + Math.round(drift * 0.25) + detectedSignals.length * 3))

  if (!detectedSignals.length) {
    detectedSignals.push(divergence > 0.45 ? 'Substantial wording change' : 'Minor wording change')
  }

  return {
    changeType,
    severity,
    semanticDriftScore: drift,
    userImpact,
    consentRequired,
    confidence,
    summary: buildSummary(changeType, severity, userImpact, detectedSignals),
    oldMeaning: describeMeaning(oldLower, 'old'),
    newMeaning: describeMeaning(newLower, 'new'),
    recommendations: buildRecommendations(changeType, severity, consentRequired, userImpact),
    detectedSignals,
  }
}

function buildStable() {
  return {
    changeType: 'Stable',
    severity: 'Stable',
    semanticDriftScore: 0,
    userImpact: 'Neutral',
    consentRequired: false,
    confidence: 96,
    summary: 'No semantic change detected. The meaning of the document is unchanged.',
    oldMeaning: 'Document baseline.',
    newMeaning: 'Identical to baseline.',
    recommendations: ['No action required. Continue monitoring on schedule.'],
    detectedSignals: ['No change detected'],
  }
}

function describeMeaning(lower, which) {
  if (/never|do not|does not|will not|are not|only/.test(lower) && which === 'old') {
    return 'Restricted use. The document committed to clear limits on data and rights.'
  }
  if (/may|can|reserve the right|at our discretion|improve our ai/.test(lower) && which === 'new') {
    return 'Permissive use. The document now allows broader actions at the provider discretion.'
  }
  if (/pricing|fees|subscription|monthly/.test(lower)) {
    return 'Commercial terms describing fees, pricing or subscription conditions.'
  }
  if (/ownership|licen[sc]e|content/.test(lower)) {
    return 'Ownership and licensing terms describing who controls content and rights.'
  }
  return which === 'old'
    ? 'Baseline meaning of the recorded document.'
    : 'Updated meaning of the recorded document.'
}

function buildSummary(changeType, severity, userImpact, signals) {
  if (changeType === 'Stable') {
    return 'No meaningful change. The document preserves its prior commitments.'
  }
  const lead =
    changeType === 'Privacy weakened'
      ? 'Privacy commitments were weakened in this revision.'
      : changeType === 'Pricing change'
        ? 'Commercial and pricing terms changed in this revision.'
        : changeType === 'Ownership change'
          ? 'Ownership and licensing terms shifted in this revision.'
          : changeType === 'Scope expanded'
            ? 'The provider expanded the scope of permitted actions.'
            : 'Wording changed without a major shift in meaning.'
  const signalText = signals.length
    ? ' Detected signals: ' + signals.slice(0, 3).join(', ') + '.'
    : ''
  return (
    lead +
    ' Severity is rated ' +
    severity +
    ' with a ' +
    userImpact.toLowerCase() +
    ' user impact.' +
    signalText
  )
}

function buildRecommendations(changeType, severity, consentRequired, userImpact) {
  const recs = []
  if (consentRequired) {
    recs.push('Request explicit user consent before applying these changes.')
    recs.push('Provide a clear summary of what data use has expanded.')
  }
  if (changeType === 'Privacy weakened') {
    recs.push('Offer an opt out for AI training and partner data sharing.')
    recs.push('Publish a plain language changelog highlighting the new permissions.')
  } else if (changeType === 'Pricing change') {
    recs.push('Notify affected users ahead of the billing change with the effective date.')
    recs.push('Honor existing terms for the current billing cycle.')
  } else if (changeType === 'Ownership change') {
    recs.push('Clarify how the new license affects user generated content.')
  } else if (changeType === 'Scope expanded') {
    recs.push('Document the new scope and link it to the prior version for transparency.')
  }
  if (severity === 'Stable' || severity === 'Minor') {
    recs.push('No urgent action required. Keep the document under routine monitoring.')
  }
  if (userImpact === 'Positive') {
    recs.push('Communicate the improved protections to users as a trust signal.')
  }
  if (!recs.length) recs.push('Review the change and confirm alignment with public commitments.')
  return recs
}

// Lightweight detector of critical words for inline highlighting.
export function isCriticalWord(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return false
  return ['never', 'may', 'partners', 'partner', 'fees', 'ownership', 'sell', 'share', 'shared', 'license', 'discretion', 'training', 'ai'].includes(w)
}

// Returns sentence token spans marking critical words, for richer diff views.
export function tokenizeForDiff(text) {
  const sentences = splitSentences(text)
  return sentences.map((sentence) =>
    sentence.split(/(\s+)/).map((tok) => ({ text: tok, critical: /\S/.test(tok) && isCriticalWord(tok) }))
  )
}
