import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react'
import { loadState, saveState, clearState } from './storage'
import { buildSeedState } from '../data/mockData'
import { snapshotHash } from '../utils/documentParser'
import { analyzeSemanticChange } from '../utils/semanticDiff'
import { setGenLayerMode } from '../genlayer/genlayerClient'

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
    case 'MERGE_REPORTS': {
      // Merge on-chain reports, deduped by id, keeping local demo items intact.
      const incoming = action.reports || []
      const known = new Set(state.reports.map((r) => r.id))
      const fresh = incoming.filter((r) => r && r.id && !known.has(r.id))
      if (!fresh.length) return state
      return { ...state, reports: [...fresh, ...state.reports] }
    }
    case 'SET_CHAIN':
      return { ...state, chain: { ...state.chain, ...action.chain } }
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
    setGenLayerMode(state.settings.genlayerMode || (state.settings.genlayerMockMode ? 'mock' : 'live'))
  }, [state.settings.genlayerMode, state.settings.genlayerMockMode])

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
  // When `precomputed` is provided (a verified on-chain report in the
  // analyzeSemanticChange shape), it is used verbatim instead of the local
  // engine, and the entry is flagged as verified on GenLayer.
  const runAnalysis = useCallback(
    (docId, newText, precomputed) => {
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
      const base = precomputed || analyzeSemanticChange(prevSnap.text, newText)
      const verified = !!precomputed
      const analysis = {
        changeType: base.changeType,
        severity: base.severity,
        semanticDriftScore: base.semanticDriftScore,
        userImpact: base.userImpact,
        consentRequired: base.consentRequired,
        confidence: base.confidence,
        summary: base.summary,
        oldMeaning: base.oldMeaning,
        newMeaning: base.newMeaning,
        recommendations: base.recommendations,
        detectedSignals: base.detectedSignals,
      }
      const historyEntry = {
        id: 'an_' + snapshotHash(newText + now).slice(2, 10),
        fromSnapshot: prevSnap.id,
        toSnapshot: newSnap.id,
        createdAt: now,
        verified,
        txHash: verified ? base.txHash || '' : '',
        contract: verified ? base.contract || '' : '',
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
        verified: verified || doc.verified || false,
      }
      dispatch({ type: 'UPDATE_DOCUMENT', document: updated })
      return { document: updated, analysis: historyEntry, historyEntry, newSnap, prevSnap, verified }
    },
    [state.documents]
  )

  const generateReport = useCallback(
    (docId) => {
      const doc = state.documents.find((d) => d.id === docId)
      if (!doc || !doc.history.length) return null
      const an = doc.history[doc.history.length - 1]
      const verified = !!an.verified
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
        genlayerStatus: verified ? 'Verified on GenLayer' : 'Verified by GenLayer (mock)',
        source: verified ? 'chain' : 'local',
        verified,
        txHash: verified ? an.txHash || '' : '',
        contract: verified ? an.contract || '' : '',
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

  // Maps an on-chain report (analyzeSemanticChange shape + chain metadata) into
  // a report card record, marked as verified on GenLayer.
  const mergeChainReports = useCallback((chainReports) => {
    if (!Array.isArray(chainReports) || !chainReports.length) return
    const mapped = chainReports
      .filter((r) => r && (r.id || r.summary))
      .map((r) => {
        const id = 'chain_' + (r.id || snapshotHash((r.project || '') + (r.summary || '') + (r.created || '')).slice(2, 12))
        return {
          id,
          documentId: '',
          title: ((r.project || 'On-chain') + ' ' + (r.category || 'Report')).trim() + ' Audit',
          project: r.project || 'On-chain',
          category: r.category || 'GenLayer',
          severity: r.severity,
          changeType: r.changeType,
          userImpact: r.userImpact,
          consentRequired: r.consentRequired,
          semanticDriftScore: r.semanticDriftScore,
          confidence: r.confidence,
          summary: r.summary,
          mainChanges: r.detectedSignals,
          recommendation: r.recommendations && r.recommendations[0] ? r.recommendations[0] : 'Review the change.',
          recommendations: r.recommendations,
          snapshotHash: r.newHash || r.oldHash || snapshotHash(id),
          genlayerStatus: 'Verified on GenLayer',
          source: 'chain',
          verified: true,
          analyst: r.analyst || '',
          contract: r.contract || '',
          createdAt: r.created || new Date().toISOString(),
        }
      })
    dispatch({ type: 'MERGE_REPORTS', reports: mapped })
  }, [])

  const setChainStatus = useCallback((chain) => dispatch({ type: 'SET_CHAIN', chain }), [])

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
      mergeChainReports,
      setChainStatus,
      resetVault,
    }),
    [state, createDocument, runAnalysis, generateReport, saveBadge, deleteDocument, updateSettings, setWallet, mergeChainReports, setChainStatus, resetVault]
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used within VaultProvider')
  return ctx
}
