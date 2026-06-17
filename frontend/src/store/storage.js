// localStorage persistence with a single namespaced key.
import { buildSeedState } from '../data/mockData'

const KEY = 'termsvault.state.v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seed = buildSeedState()
      saveState(seed)
      return seed
    }
    const parsed = JSON.parse(raw)
    // Defensive merge so new fields do not break older saved state.
    return {
      documents: parsed.documents || [],
      reports: parsed.reports || [],
      badges: parsed.badges || [],
      settings: { ...buildSeedState().settings, ...(parsed.settings || {}) },
      wallet: parsed.wallet || { connected: false, address: '' },
      seededAt: parsed.seededAt,
    }
  } catch (err) {
    const seed = buildSeedState()
    saveState(seed)
    return seed
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (err) {
    // Storage may be unavailable; the app keeps working in memory.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch (err) {
    // ignore
  }
}

export function exportState() {
  return JSON.stringify(loadState(), null, 2)
}
