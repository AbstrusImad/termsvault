import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText,
  GitCompareArrows,
  ScanSearch,
  BadgeCheck,
  Layers,
  History,
  X,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import HolographicPanel from '../components/ui/HolographicPanel'
import GlowButton from '../components/ui/GlowButton'
import ScoreRing from '../components/ui/ScoreRing'
import SeverityBadge from '../components/ui/SeverityBadge'
import { ImpactBadge, ConsentBadge, ChangeTypeBadge } from '../components/ui/RiskBadge'
import Timeline from '../components/ui/Timeline'
import EmptyState from '../components/ui/EmptyState'
import LoadingScan from '../components/ui/LoadingScan'
import TextScanner from '../components/documents/TextScanner'
import ConsensusFlow from '../components/diff/ConsensusFlow'
import { formatDateTime, shortHash } from '../utils/formatters'
import { accumulatedRisk, severityColor, STATUS_META, statusForDocument } from '../utils/riskScoring'
import { analyzeSemanticDiff } from '../genlayer/genlayerClient'

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { documents, settings, runAnalysis, generateReport, deleteDocument } = useVault()
  const toast = useToast()

  const doc = documents.find((d) => d.id === id)
  const [showAnalyze, setShowAnalyze] = useState(false)
  const [newText, setNewText] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState(null)

  const isLive = (settings.genlayerMode || (settings.genlayerMockMode ? 'mock' : 'live')) === 'live'

  const risk = useMemo(() => (doc ? accumulatedRisk(doc.history) : 0), [doc])

  if (!doc) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        message="This artifact is not in the vault. It may have been cleared."
        action={
          <Link to="/dashboard">
            <GlowButton variant="gold">Back to Observatory</GlowButton>
          </Link>
        }
      />
    )
  }

  const latest = doc.history.length ? doc.history[doc.history.length - 1] : null
  const meta = STATUS_META[statusForDocument(doc)]

  async function handleAnalyze() {
    if (newText.trim().split(/\s+/).filter(Boolean).length < 4) {
      toast.error('Paste a new version with at least a few words.')
      return
    }
    const prev = doc.snapshots[doc.snapshots.length - 1]

    if (!isLive) {
      // Mock mode: instant local engine, unchanged UX.
      setBusy(true)
      try {
        await analyzeSemanticDiff(prev.text, newText, { project: doc.project, category: doc.category })
        const result = runAnalysis(doc.id, newText)
        setBusy(false)
        setShowAnalyze(false)
        setNewText('')
        if (result) {
          toast.success('Analysis complete: ' + result.analysis.changeType)
          navigate('/diff/' + doc.id)
        }
      } catch (err) {
        setBusy(false)
        toast.error('Analysis failed. Try again.')
      }
      return
    }

    // Live mode: real Bradbury flow with consensus lifecycle.
    setBusy(true)
    setStage({ name: 'wallet' })
    try {
      const res = await analyzeSemanticDiff(prev.text, newText, {
        project: doc.project,
        category: doc.category,
        onStage: (name, extra) => setStage((s) => ({ ...(s || {}), name, ...extra })),
      })
      const result = runAnalysis(doc.id, newText, res.analysis)
      toast.success('Verified on GenLayer: ' + res.analysis.changeType)
      setTimeout(() => {
        setBusy(false)
        setShowAnalyze(false)
        setNewText('')
        setStage(null)
        if (result) navigate('/diff/' + doc.id)
      }, 1100)
    } catch (err) {
      setBusy(false)
      const message = err && err.userMessage ? err.userMessage : 'Analysis failed. Try again.'
      setStage((s) => ({ ...(s || {}), name: 'error', message }))
      toast.error(message)
    }
  }

  function handleBadge() {
    if (latest) generateReport(doc.id)
    navigate('/badge?doc=' + doc.id)
  }

  const timelineItems = doc.history
    .map((h) => ({
      id: h.id,
      title: h.changeType,
      tag: h.severity,
      color: severityColor(h.severity),
      description: h.summary.slice(0, 110),
      createdAt: h.createdAt,
    }))
    .reverse()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={{ borderColor: meta.color + '55', color: meta.color, backgroundColor: meta.color + '12' }}
          >
            <FileText size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold text-ivory">{doc.name}</h1>
              <SeverityBadge severity={doc.severity} />
            </div>
            <p className="mt-1 text-sm text-ivory/50">
              {doc.project} / {doc.category} / importance {doc.importance}
            </p>
            <p className="mt-1 font-mono text-xs text-ivory/35">Last analysis {formatDateTime(doc.lastAnalysis)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <GlowButton variant="gold" icon={ScanSearch} onClick={() => { setStage(null); setShowAnalyze(true) }}>
            Run New Analysis
          </GlowButton>
          <GlowButton
            variant="ghost"
            icon={GitCompareArrows}
            onClick={() => navigate('/diff/' + doc.id)}
            disabled={!latest}
          >
            Compare Versions
          </GlowButton>
          <GlowButton variant="outline" icon={BadgeCheck} onClick={handleBadge}>
            Generate Public Badge
          </GlowButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <HolographicPanel title="Accumulated risk" icon={Layers}>
            <div className="flex items-center gap-6">
              <ScoreRing score={risk} label="Risk" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ChangeTypeBadge changeType={doc.changeType} />
                </div>
                <ImpactBadge impact={doc.userImpact} />
                <ConsentBadge required={doc.consentRequired} />
              </div>
            </div>
          </HolographicPanel>

          <HolographicPanel title="Snapshots" icon={Layers} subtitle={doc.snapshots.length + ' versions stored'}>
            <ul className="space-y-3">
              {doc.snapshots
                .slice()
                .reverse()
                .map((snap) => (
                  <li key={snap.id} className="rounded-xl border border-ink-edge bg-ink-deep/40 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-grotesk text-sm font-medium text-ivory">{snap.label}</span>
                      <span className="text-[11px] text-ivory/40">{formatDateTime(snap.createdAt)}</span>
                    </div>
                    <p className="mt-1 engraved font-mono text-[11px]">{shortHash(snap.hash, 14, 8)}</p>
                    <p className="mt-1 text-[11px] text-ivory/40">{snap.wordCount} words</p>
                  </li>
                ))}
            </ul>
          </HolographicPanel>
        </div>

        <div className="space-y-6">
          {latest ? (
            <HolographicPanel
              title="Latest analysis"
              icon={ScanSearch}
              actions={
                <Link to={'/diff/' + doc.id}>
                  <GlowButton variant="ghost" icon={ArrowRight}>
                    Open Diff
                  </GlowButton>
                </Link>
              }
            >
              <p className="text-sm leading-relaxed text-ivory/70">{latest.summary}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {latest.detectedSignals.map((s) => (
                  <span key={s} className="rounded-lg border border-ink-edge bg-ink-deep/40 px-3 py-2 text-xs text-ivory/65">
                    {s}
                  </span>
                ))}
              </div>
            </HolographicPanel>
          ) : (
            <HolographicPanel title="No analysis yet" icon={ScanSearch}>
              <p className="text-sm text-ivory/55">
                This document has a baseline snapshot. Run a new analysis with an updated version to detect semantic
                change.
              </p>
              <div className="mt-4">
                <GlowButton variant="gold" icon={ScanSearch} onClick={() => { setStage(null); setShowAnalyze(true) }}>
                  Run New Analysis
                </GlowButton>
              </div>
            </HolographicPanel>
          )}

          <HolographicPanel title="Change history" icon={History}>
            {timelineItems.length ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className="text-sm text-ivory/40">No changes recorded. The baseline is the only snapshot.</p>
            )}
          </HolographicPanel>

          <div className="flex justify-end">
            <button
              onClick={() => {
                deleteDocument(doc.id)
                toast.info('Document removed from the vault')
                navigate('/dashboard')
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-edge px-3 py-2 font-grotesk text-xs text-ivory/45 transition hover:border-coral/50 hover:text-coral-soft"
            >
              <Trash2 size={13} />
              Remove document
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAnalyze ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => !busy && setShowAnalyze(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="panel panel-glow w-full max-w-2xl overflow-hidden"
            >
              <div className="hairline flex items-center justify-between px-5 py-4">
                <h3 className="font-grotesk text-base font-semibold text-ivory">Run new analysis</h3>
                <button onClick={() => !busy && setShowAnalyze(false)} className="text-ivory/50 hover:text-ivory">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5">
                {busy && isLive ? (
                  <ConsensusFlow stage={stage} />
                ) : busy ? (
                  <LoadingScan lines={6} label="Comparing meaning against baseline" />
                ) : (
                  <>
                    <p className="mb-3 text-sm text-ivory/55">
                      Paste the updated version. It will be compared against the latest snapshot
                      {isLive ? ' and analyzed on GenLayer Bradbury with AI consensus.' : '.'}
                    </p>
                    <div className="mb-3">
                      <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">
                        Current baseline
                      </p>
                      <TextScanner text={doc.snapshots[doc.snapshots.length - 1].text} ignite={false} />
                    </div>
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows={6}
                      placeholder="Paste the new version of the document here."
                      className="w-full resize-y rounded-xl border border-ink-edge bg-ink-deep/60 p-3 font-body text-sm leading-relaxed text-ivory outline-none focus:border-gold/60"
                    />
                    {isLive ? (
                      <p className="mt-2 text-[11px] text-ivory/40">
                        On-chain analysis takes 1 to 5+ minutes. Low on GEN? Use the
                        {' '}
                        <a
                          href="https://testnet-faucet.genlayer.foundation/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-gold-soft hover:text-gold"
                        >
                          testnet faucet
                        </a>
                        .
                      </p>
                    ) : null}
                    <div className="mt-4 flex justify-end gap-2">
                      <GlowButton variant="ghost" onClick={() => setShowAnalyze(false)}>
                        Cancel
                      </GlowButton>
                      <GlowButton variant="gold" icon={ScanSearch} onClick={handleAnalyze}>
                        Analyze Change
                      </GlowButton>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
