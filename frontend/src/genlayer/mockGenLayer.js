// Mock GenLayer backend. Simulates latency and returns mock hashes/status.
import { snapshotHash } from '../utils/documentParser'
import { analyzeSemanticChange } from '../utils/semanticDiff'

const MOCK_STATUS = 'Verified by GenLayer (mock)'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createSemanticSnapshot(document) {
  await delay(420 + Math.random() * 360)
  const text = document.text || ''
  return {
    ok: true,
    hash: snapshotHash(text),
    validator: 'gl_validator_mock',
    status: MOCK_STATUS,
    timestamp: new Date().toISOString(),
  }
}

export async function analyzeSemanticDiff(oldSnapshot, newSnapshot) {
  await delay(680 + Math.random() * 520)
  const result = analyzeSemanticChange(
    oldSnapshot ? oldSnapshot.text : '',
    newSnapshot ? newSnapshot.text : ''
  )
  return {
    ok: true,
    status: MOCK_STATUS,
    consensus: 'reached',
    validators: 5,
    analysis: result,
    proofHash: snapshotHash((oldSnapshot ? oldSnapshot.hash : '') + (newSnapshot ? newSnapshot.hash : '')),
    timestamp: new Date().toISOString(),
  }
}

export async function registerReport(report) {
  await delay(520 + Math.random() * 380)
  return {
    ok: true,
    status: MOCK_STATUS,
    txHash: snapshotHash(JSON.stringify(report).slice(0, 200)),
    registeredAt: new Date().toISOString(),
  }
}

export async function getGenLayerStatus() {
  await delay(220)
  return {
    online: true,
    network: 'GenLayer Testnet (mock)',
    status: MOCK_STATUS,
    validators: 5,
    latencyMs: 180 + Math.round(Math.random() * 90),
  }
}
