import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react'
import { loadState, saveState, clearState } from './storage'
import { buildSeedState } from '../data/mockData'
import { snapshotHash } from '../utils/documentParser'
import { analyzeSemanticChange } from '../utils/semanticDiff'
import { setMockMode } from '../genlayer/genlayerClient'

const VaultContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.document, ...state.documents] }
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.document.id ? action.document : d)),
      }
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter((d) => d.id !== action.id),
        reports: state.reports.filter((r) => r.documentId !== action.id),
      }
    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports.filter((r) => r.id !== action.report.id)] }
    case 'ADD_BADGE':
      return { ...state, badges: [action.badge, ...state.badges.filter((b) => b.id !== action.badge.id)] }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'SET_WALLET':
      return { ...state, wallet: action.wallet }
    case 'RESET':
      return action.state
    default:
      return state
  }
}

export function VaultProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    setMockMode(state.settings.genlayerMockMode)
  }, [state.settings.genlayerMockMode])

  const createDocument = useCallback((input) => {
    const now = new Date().toISOString()
    const baseText = input.text || ''
    const snap = {
      id: 'snap_' + snapshotHash(baseText + now).slice(2, 12),
      label: 'v1 baseline',
      text: baseText,
      hash: snapshotHash(baseText),
      createdAt: now,
      wordCount: baseText.split(/\s+/).filter(Boolean).length,
    }
    const doc = {
      id: 'doc_' + snapshotHash(input.name + input.project + now).slice(2, 12),
      name: input.name,
      project: input.project,
      category: input.category,
      importance: input.importance || 'Standard',
      source: input.source || 'pasted',
      url: input.url || '',
      snapshots: [snap],
      history: [],
      createdAt: now,
      lastAnalysis: now,
      severity: 'Stable',
      changeType: 'Stable',
      semanticDriftScore: 0,
      userImpact: 'Neutral',
      consentRequired: false,
      confidence: 96,
    }
    dispatch({ type: 'ADD_DOCUMENT', document: doc })
    return doc
  }, [])

  // Adds a new snapshot and runs analysis against the latest existing snapshot.
  const runAnalysis = useCallback(
    (docId, newText) => {
      const doc = state.documents.find((d) => d.id === docId)
      if (!doc) return null
      const now = new Date().toISOString()
      const prevSnap = doc.snapshots[doc.snapshots.length - 1]
      const newSnap = {
        id: 'snap_' + snapshotHash(newText + now).slice(2, 12),
        label: 'v' + (doc.snapshots.length + 1) + ' revision',
        text: newText,
        hash: snapshotHash(newText),
        createdAt: now,
        wordCount: newText.split(/\s+/).filter(Boolean).length,
      }
      const analysis = analyzeSemanticChange(prevSnap.text, newText)
      const historyEntry = {
        id: 'an_' + snapshotHash(newText + now).slice(2, 10),
        fromSnapshot: prevSnap.id,
        toSnapshot: newSnap.id,
        createdAt: now,
        ...analysis,
      }
      const updated = {
        ...doc,
        snapshots: [...doc.snapshots, newSnap],
        history: [...doc.history, historyEntry],
        lastAnalysis: now,
        severity: analysis.severity,
        changeType: analysis.changeType,
        semanticDriftScore: analysis.semanticDriftScore,
        userImpact: analysis.userImpact,
        consentRequired: analysis.consentRequired,
        confidence: analysis.confidence,
      }
      dispatch({ type: 'UPDATE_DOCUMENT', document: updated })
      return { document: updated, analysis, historyEntry, newSnap, prevSnap }
    },
    [state.documents]
  )

  const generateReport = useCallback(
    (docId) => {
      const doc = state.documents.find((d) => d.id === docId)
      if (!doc || !doc.history.length) return null
      const an = doc.history[doc.history.length - 1]
      const report = {
        id: 'rep_' + snapshotHash(doc.id + an.id).slice(2, 12),
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
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_REPORT', report })
      return report
    },
    [state.documents]
  )

  const saveBadge = useCallback((badge) => {
    dispatch({ type: 'ADD_BADGE', badge })
  }, [])

  const deleteDocument = useCallback((id) => dispatch({ type: 'DELETE_DOCUMENT', id }), [])
  const updateSettings = useCallback((settings) => dispatch({ type: 'SET_SETTINGS', settings }), [])
  const setWallet = useCallback((wallet) => dispatch({ type: 'SET_WALLET', wallet }), [])

  const resetVault = useCallback(() => {
    clearState()
    const seed = buildSeedState()
    saveState(seed)
    dispatch({ type: 'RESET', state: seed })
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      createDocument,
      runAnalysis,
      generateReport,
      saveBadge,
      deleteDocument,
      updateSettings,
      setWallet,
      resetVault,
    }),
    [state, createDocument, runAnalysis, generateReport, saveBadge, deleteDocument, updateSettings, setWallet, resetVault]
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used within VaultProvider')
  return ctx
}
