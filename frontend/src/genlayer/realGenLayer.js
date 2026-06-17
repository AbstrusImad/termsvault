// Real GenLayer plumbing for the live TermsVault contract on Bradbury.
//
// This mirrors the verified genlayer-js plumbing from the bastion reference
// (createClient, testnetBradbury, withRpcRetry, statusName, TERMINAL set,
// extractLeaderDraft leader-peek, pollUntilDecided) translated to plain JS.
//
// The parent wires the real CONTRACT_ADDRESS / DEPLOY_TX after deploy. Until
// then the zero address keeps IS_DEPLOYED false so the app degrades gracefully.
import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'

// ---- deployment coordinates ----------------------------------------------

export const CONTRACT_ADDRESS = '0x91Dd4ac432159bf7CC945278A51bC43cF72eDB44'
export const DEPLOY_TX = '0x3ed696133095debea6fbeb262360cafa9a4fe7dc9233f1b50aa08a32f9450c5d'
export const EXPLORER = 'https://explorer-bradbury.genlayer.com'
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Plain string compare keeps this type-safe in JS (no zero-address bigint math).
export const IS_DEPLOYED = String(CONTRACT_ADDRESS).toLowerCase() !== ZERO_ADDRESS

const ADDRESS = CONTRACT_ADDRESS

// Read-only client talks straight to the Bradbury RPC.
export const readClient = createClient({ chain: testnetBradbury })

// Wallet client signs through the injected provider (MetaMask). genlayer-js
// routes provider methods (eth_sendTransaction, etc) to config.provider when
// the account is an address string, so writeContract prompts the wallet.
export function makeWalletClient(account, provider) {
  return createClient({
    chain: testnetBradbury,
    account,
    ...(provider ? { provider } : {}),
  })
}

// ---- allowed value sets (mirrored from the contract) ----------------------

export const CHANGE_TYPES = [
  'Privacy weakened',
  'Pricing change',
  'Ownership change',
  'Scope expanded',
  'Rights reduced',
  'Data sharing expanded',
  'Minor wording',
  'Stable',
]
export const SEVERITIES = ['Stable', 'Minor', 'Medium', 'High', 'Critical']
export const IMPACTS = ['Positive', 'Neutral', 'Negative']

export const MAX_TEXT = 2000

// ---- resilient reads ------------------------------------------------------

export async function withRpcRetry(fn, tries = 4) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (!/rate limit|429|timeout|network|fetch|too many/i.test(String(e))) throw e
      // backoff: 2.5s, 5s, 10s, 20s
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i))
    }
  }
  throw last
}

// ---- normalization helpers ------------------------------------------------

function normalize(value) {
  if (value instanceof Map) {
    const obj = {}
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v)
    return obj
  }
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'bigint') return value.toString()
  return value
}

function toRecord(value) {
  const n = normalize(value)
  return n && typeof n === 'object' ? n : {}
}

function num(v) {
  if (typeof v === 'number') return v
  if (typeof v === 'bigint') return Number(v)
  const n = Number(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

function str(v) {
  return String(v ?? '')
}

function bool(v) {
  if (typeof v === 'boolean') return v
  const s = str(v).toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function pick(rec, ...keys) {
  for (const k of keys) {
    if (rec[k] !== undefined && rec[k] !== null && rec[k] !== '') return rec[k]
  }
  return undefined
}

function clampSet(value, allowed, fallback) {
  const s = str(value)
  const found = allowed.find((a) => a.toLowerCase() === s.toLowerCase())
  return found || fallback
}

function asArray(v) {
  if (Array.isArray(v)) return v.map(str).filter(Boolean)
  if (v === undefined || v === null || v === '') return []
  return [str(v)]
}

// Maps a raw contract report dict (or a leader draft dict) into the exact
// analyzeSemanticChange shape the app already renders, plus chain metadata.
export function asReport(raw) {
  const r = toRecord(raw)
  const changeType = clampSet(pick(r, 'changeType', 'change_type'), CHANGE_TYPES, 'Minor wording')
  const severity = clampSet(pick(r, 'severity'), SEVERITIES, 'Minor')
  const userImpact = clampSet(pick(r, 'userImpact', 'user_impact'), IMPACTS, 'Neutral')
  const recommendations = asArray(pick(r, 'recommendations'))
  const detectedSignals = asArray(pick(r, 'detectedSignals', 'detected_signals'))
  return {
    id: str(pick(r, 'id')),
    project: str(pick(r, 'project')),
    category: str(pick(r, 'category')),
    changeType,
    severity,
    semanticDriftScore: num(pick(r, 'semanticDriftScore', 'semantic_drift_score', 'driftScore')),
    userImpact,
    consentRequired: bool(pick(r, 'consentRequired', 'consent_required')),
    confidence: num(pick(r, 'confidence')),
    summary: str(pick(r, 'summary')),
    oldMeaning: str(pick(r, 'oldMeaning', 'old_meaning')),
    newMeaning: str(pick(r, 'newMeaning', 'new_meaning')),
    recommendations: recommendations.length ? recommendations : ['Review the change and confirm alignment with public commitments.'],
    detectedSignals: detectedSignals.length ? detectedSignals : ['Semantic change detected on chain'],
    oldHash: str(pick(r, 'oldHash', 'old_hash')),
    newHash: str(pick(r, 'newHash', 'new_hash')),
    analyst: str(pick(r, 'analyst')),
    created: str(pick(r, 'created', 'createdAt', 'created_at')),
  }
}

// ---- view reads -----------------------------------------------------------

export async function fetchStats() {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_stats', args: [] }),
  )
  const r = toRecord(raw)
  return {
    analyses: num(pick(r, 'analyses')),
    reports: num(pick(r, 'reports')),
    snapshots: num(pick(r, 'snapshots')),
  }
}

export async function fetchReports(start = 0) {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_reports', args: [start] }),
  )
  const arr = normalize(raw)
  return (Array.isArray(arr) ? arr : []).map(asReport)
}

export async function fetchReport(reportId) {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_report', args: [reportId] }),
  )
  return asReport(raw)
}

export async function fetchSnapshots(start = 0) {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_snapshots', args: [start] }),
  )
  const arr = normalize(raw)
  return Array.isArray(arr) ? arr.map(toRecord) : []
}

// ---- writes ---------------------------------------------------------------

export function writeCreateSnapshot(client, project, category, label, text) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'create_snapshot',
    args: [project, category, label, String(text).slice(0, MAX_TEXT)],
    value: 0n,
  })
}

export function writeAnalyze(client, project, category, oldText, newText) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'analyze',
    args: [project, category, String(oldText).slice(0, MAX_TEXT), String(newText).slice(0, MAX_TEXT)],
    value: 0n,
  })
}

// ---- transaction polling --------------------------------------------------

const STATUS_NAME = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
}

export function statusName(s) {
  return STATUS_NAME[String(s)] || String(s ?? 'PENDING').toUpperCase()
}

// LEADER_TIMEOUT / VALIDATORS_TIMEOUT are intentionally absent: the network
// rotates the leader and retries, so keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED'])

function pickKey(obj, key) {
  if (obj instanceof Map) return obj.get(key)
  if (obj && typeof obj === 'object') return obj[key]
  return undefined
}

// The leader_fn returns the FULL report dict. Peek at the in-flight leader
// receipt, decode its base64 eq_output, and parse the trailing JSON object.
export function extractLeaderDraft(tx) {
  try {
    const receipts = pickKey(pickKey(tx, 'consensus_data'), 'leader_receipt')
    const first = Array.isArray(receipts) ? receipts[0] : receipts
    const b64 = pickKey(pickKey(first, 'eq_outputs'), '0')
    if (typeof b64 !== 'string' || b64.length === 0) return null
    const text = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue
      try {
        const obj = JSON.parse(text.slice(i))
        if (obj && typeof obj === 'object' && hasReportKey(obj)) {
          return asReport(obj)
        }
      } catch {
        /* keep scanning toward the start for a parseable object */
      }
    }
    return null
  } catch {
    return null
  }
}

function hasReportKey(obj) {
  return (
    'summary' in obj ||
    'severity' in obj ||
    'changeType' in obj ||
    'change_type' in obj ||
    'semanticDriftScore' in obj ||
    'semantic_drift_score' in obj
  )
}

export async function pollUntilDecided(client, hash, onUpdate) {
  let draft = null
  for (let i = 0; i < 150; i++) {
    const tx = await client.getTransaction({ hash }).catch(() => null)
    const status = statusName(tx ? tx.status : 'PENDING')
    draft = extractLeaderDraft(tx) || draft
    if (onUpdate) onUpdate(status, draft)
    if (TERMINAL.has(status)) return { status, draft }
    // 8s interval keeps polling steady through a 1 to 5+ minute analyze.
    await new Promise((r) => setTimeout(r, 8000))
  }
  return { status: 'TIMEOUT', draft }
}
