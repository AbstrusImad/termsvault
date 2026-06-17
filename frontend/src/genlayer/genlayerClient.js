// GenLayer client facade.
//
// Single seam between the app and GenLayer. Routes every call to either the
// real Bradbury contract (live mode) or the local simulator (mock mode),
// based on the `genlayerMode` Vault setting. The four exported function names
// are unchanged so existing pages keep working.
import * as mock from './mockGenLayer'
import * as real from './realGenLayer'
import { getWalletClient, getWalletAddress, isWalletReady, hasInjectedProvider } from './wallet'
import { snapshotHash } from '../utils/documentParser'

// Default to live: the app should be functional on Bradbury out of the box.
let mode = 'live'

export function setGenLayerMode(next) {
  mode = next === 'mock' ? 'mock' : 'live'
}

export function getGenLayerMode() {
  return mode
}

// Backward-compatible boolean toggles (kept so older callers do not break).
export function setMockMode(enabled) {
  mode = enabled ? 'mock' : 'live'
}

export function isMockMode() {
  return mode === 'mock'
}

export const CONTRACT_ADDRESS = real.CONTRACT_ADDRESS
export const EXPLORER = real.EXPLORER
export const FAUCET = real.FAUCET
export const IS_DEPLOYED = real.IS_DEPLOYED

// Accept either a raw string or a { text } snapshot-like object.
function textOf(input) {
  if (input == null) return ''
  if (typeof input === 'string') return input
  if (typeof input.text === 'string') return input.text
  return String(input)
}

function asSnap(input) {
  if (input && typeof input === 'object' && 'text' in input) return input
  return { text: textOf(input) }
}

// Builds a friendly error with a `.userMessage` the UI can surface verbatim.
function friendly(message, raw) {
  const e = new Error(message)
  e.userMessage = message
  if (raw) e.cause = raw
  return e
}

function mapWriteError(err) {
  const text = String((err && (err.message || err.shortMessage)) || err || '')
  if (err && (err.code === 4001 || /user rejected|denied|rejected the request/i.test(text))) {
    return friendly('You cancelled the signature', err)
  }
  if (/LackOfFundForMaxFee|insufficient funds|max fee|fee reserve/i.test(text)) {
    return friendly(
      'Your wallet is below the fee reserve for AI transactions (mostly refunded). Top up at testnet-faucet.genlayer.foundation',
      err,
    )
  }
  if (/timeout|network|fetch|rate limit|429|congest/i.test(text)) {
    return friendly('The network is congested, your analysis is still being processed', err)
  }
  return friendly('The transaction could not be submitted. Please try again.', err)
}

// ---------------------------------------------------------------------------
// createSemanticSnapshot
//
// Live mode keeps snapshots LOCAL and instant: an on-chain create_snapshot tx
// is optional and would make every baseline a slow Bradbury transaction. The
// fast, reliable path is to notarize the hash locally and reserve on-chain
// work for analyze(), which carries the AI consensus value. (Documented per
// the integration brief.)
// ---------------------------------------------------------------------------
export async function createSemanticSnapshot(document) {
  if (mode === 'mock') return mock.createSemanticSnapshot(document)
  const text = (document && document.text) || ''
  return {
    ok: true,
    hash: snapshotHash(text),
    validator: 'local',
    status: 'Recorded locally (live mode)',
    local: true,
    timestamp: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// analyzeSemanticDiff(oldText, newText, { project, category, onStage })
//
// Live mode runs the real Bradbury flow with AI consensus. onStage drives the
// UI lifecycle: wallet -> submitted -> consensus -> confirmed | error.
// ---------------------------------------------------------------------------
export async function analyzeSemanticDiff(oldInput, newInput, options = {}) {
  if (mode === 'mock') {
    return mock.analyzeSemanticDiff(asSnap(oldInput), asSnap(newInput))
  }
  return realAnalyze(textOf(oldInput), textOf(newInput), options)
}

async function realAnalyze(oldText, newText, options) {
  const { project = '', category = '', onStage } = options || {}
  const stage = (name, extra) => {
    if (typeof onStage === 'function') onStage(name, extra || {})
  }

  if (!real.IS_DEPLOYED) {
    const e = friendly('The TermsVault contract is not deployed yet. Switch to mock mode to explore the flow.')
    stage('error', { message: e.userMessage })
    throw e
  }

  if (!isWalletReady()) {
    const e = friendly(
      hasInjectedProvider()
        ? 'Connect your wallet to run an on-chain analysis.'
        : 'No wallet detected. Install MetaMask or switch to mock mode.',
    )
    stage('error', { message: e.userMessage })
    throw e
  }

  const client = getWalletClient()
  const analyst = getWalletAddress()

  stage('wallet', {})

  let hash
  try {
    hash = await real.writeAnalyze(client, project, category, oldText.slice(0, real.MAX_TEXT), newText.slice(0, real.MAX_TEXT))
  } catch (err) {
    const mapped = mapWriteError(err)
    stage('error', { message: mapped.userMessage })
    throw mapped
  }

  stage('submitted', { txHash: hash, explorer: real.EXPLORER })

  let lastDraft = null
  let result
  try {
    result = await real.pollUntilDecided(client, hash, (status, draft) => {
      if (draft) lastDraft = draft
      stage('consensus', { status, draft: draft || lastDraft, txHash: hash })
    })
  } catch (err) {
    const mapped = friendly('The network is congested, your analysis is still being processed', err)
    stage('error', { message: mapped.userMessage })
    throw mapped
  }

  const { status } = result
  if (status !== 'ACCEPTED' && status !== 'FINALIZED') {
    let msg = 'The network is congested, your analysis is still being processed'
    if (status === 'UNDETERMINED') msg = 'Validators did not reach consensus on this analysis. Please try again.'
    if (status === 'CANCELED') msg = 'The analysis transaction was canceled.'
    const e = friendly(msg)
    stage('error', { message: e.userMessage, status })
    throw e
  }

  // Authoritative result: read the newest report for this analyst/project.
  let report = lastDraft
  try {
    const reports = await real.fetchReports(0)
    report = pickAuthoritative(reports, analyst, project) || lastDraft || (reports[0] || null)
  } catch {
    // fall back to the peeked leader draft if the read fails post-accept
  }

  if (!report) {
    const e = friendly('The analysis was accepted but the report could not be read yet. It will appear shortly.')
    stage('error', { message: e.userMessage })
    throw e
  }

  const analysis = { ...report, verified: true, txHash: hash, contract: real.CONTRACT_ADDRESS }
  stage('confirmed', { report: analysis, txHash: hash, explorer: real.EXPLORER })

  return {
    ok: true,
    verified: true,
    status: 'Verified on GenLayer',
    consensus: 'reached',
    analysis,
    txHash: hash,
    contract: real.CONTRACT_ADDRESS,
    timestamp: new Date().toISOString(),
  }
}

function pickAuthoritative(reports, analyst, project) {
  if (!Array.isArray(reports) || !reports.length) return null
  const a = String(analyst || '').toLowerCase()
  const mine = reports.filter((r) => String(r.analyst || '').toLowerCase() === a)
  const pool = mine.length ? mine : reports
  if (project) {
    const byProject = pool.filter((r) => String(r.project || '').toLowerCase() === String(project).toLowerCase())
    if (byProject.length) return byProject[0] // get_reports is most-recent-first
  }
  return pool[0]
}

// ---------------------------------------------------------------------------
// registerReport: in live mode analyze() already persisted the report on
// chain, so this is a no-op that just echoes the report. Mock keeps its
// simulated notarization.
// ---------------------------------------------------------------------------
export async function registerReport(report) {
  if (mode === 'mock') return mock.registerReport(report)
  return {
    ok: true,
    status: 'Verified on GenLayer',
    txHash: report && report.txHash ? report.txHash : '',
    registeredAt: new Date().toISOString(),
    report,
  }
}

// ---------------------------------------------------------------------------
// getGenLayerStatus: live reads get_stats from the contract; mock keeps the
// simulated status. Offline / not-deployed returns a clear status object.
// ---------------------------------------------------------------------------
export async function getGenLayerStatus() {
  if (mode === 'mock') {
    const s = await mock.getGenLayerStatus()
    return { ...s, mode: 'mock' }
  }
  if (!real.IS_DEPLOYED) {
    return {
      mode: 'live',
      online: false,
      status: 'Contract not deployed yet',
      contract: real.CONTRACT_ADDRESS,
    }
  }
  try {
    const stats = await real.fetchStats()
    return {
      mode: 'live',
      online: true,
      status: 'Verified on GenLayer',
      network: 'GenLayer Bradbury Testnet',
      analyses: stats.analyses,
      reports: stats.reports,
      snapshots: stats.snapshots,
      contract: real.CONTRACT_ADDRESS,
    }
  } catch (err) {
    return {
      mode: 'live',
      online: false,
      status: 'GenLayer network unreachable',
      contract: real.CONTRACT_ADDRESS,
      error: String((err && err.message) || err),
    }
  }
}

// Fetches on-chain reports for merging into the views (gentle background poll).
export async function fetchChainReports(start = 0) {
  if (mode !== 'live' || !real.IS_DEPLOYED) return []
  try {
    return await real.fetchReports(start)
  } catch {
    return []
  }
}
