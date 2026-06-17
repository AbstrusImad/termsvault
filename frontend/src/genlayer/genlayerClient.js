// GenLayer client facade.
//
// This module is the single seam between the app and GenLayer. In mock mode it
// delegates to mockGenLayer. To wire a real GenLayer integration, implement the
// same four async functions against the live client and switch on mockMode.
//
// --- REAL INTEGRATION SEAM ---------------------------------------------------
// import { createClient } from 'genlayer-js'
// const realClient = createClient({ chain: studionet })
// async function realCreateSnapshot(document) { ... }
// async function realAnalyzeDiff(a, b) { ... }
// -----------------------------------------------------------------------------
import * as mock from './mockGenLayer'

let mockMode = true

export function setMockMode(enabled) {
  mockMode = !!enabled
}

export function isMockMode() {
  return mockMode
}

export async function createSemanticSnapshot(document) {
  if (mockMode) return mock.createSemanticSnapshot(document)
  // return realCreateSnapshot(document)
  return mock.createSemanticSnapshot(document)
}

export async function analyzeSemanticDiff(oldSnapshot, newSnapshot) {
  if (mockMode) return mock.analyzeSemanticDiff(oldSnapshot, newSnapshot)
  // return realAnalyzeDiff(oldSnapshot, newSnapshot)
  return mock.analyzeSemanticDiff(oldSnapshot, newSnapshot)
}

export async function registerReport(report) {
  if (mockMode) return mock.registerReport(report)
  // return realRegisterReport(report)
  return mock.registerReport(report)
}

export async function getGenLayerStatus() {
  if (mockMode) return mock.getGenLayerStatus()
  // return realGetStatus()
  return mock.getGenLayerStatus()
}
