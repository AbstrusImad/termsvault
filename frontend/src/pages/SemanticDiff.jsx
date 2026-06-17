import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GitCompareArrows, ScanSearch, ScrollText, ShieldCheck, Lightbulb, FileText } from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import DiffViewer from '../components/diff/DiffViewer'
import HolographicPanel from '../components/ui/HolographicPanel'
import ScoreRing from '../components/ui/ScoreRing'
import SeverityBadge from '../components/ui/SeverityBadge'
import { ImpactBadge, ConsentBadge, ChangeTypeBadge } from '../components/ui/RiskBadge'
import GlowButton from '../components/ui/GlowButton'
import EmptyState from '../components/ui/EmptyState'

export default function SemanticDiff() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { documents, generateReport } = useVault()
  const toast = useToast()

  const doc = documents.find((d) => d.id === id)

  const data = useMemo(() => {
    if (!doc || !doc.history.length) return null
    const an = doc.history[doc.history.length - 1]
    const fromSnap = doc.snapshots.find((s) => s.id === an.fromSnapshot) || doc.snapshots[0]
    const toSnap = doc.snapshots.find((s) => s.id === an.toSnapshot) || doc.snapshots[doc.snapshots.length - 1]
    return { an, oldText: fromSnap.text, newText: toSnap.text }
  }, [doc])

  if (!doc) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        action={
          <Link to="/dashboard">
            <GlowButton variant="gold">Back to Observatory</GlowButton>
          </Link>
        }
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="No comparison available"
        message="This document only has a baseline. Run a new analysis to generate a semantic diff."
        action={
          <Link to={'/document/' + doc.id}>
            <GlowButton variant="gold" icon={ScanSearch}>
              Run New Analysis
            </GlowButton>
          </Link>
        }
      />
    )
  }

  const { an, oldText, newText } = data

  function handleReport() {
    const report = generateReport(doc.id)
    if (report) {
      toast.success('Semantic report generated')
      navigate('/reports?open=' + report.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Semantic Diff</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">{doc.project} / {doc.name}</h1>
          <p className="mt-1 text-sm text-ivory/50">A visual machine for reading semantic change.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={'/document/' + doc.id}>
            <GlowButton variant="ghost">Back to document</GlowButton>
          </Link>
          <GlowButton variant="gold" icon={ScrollText} onClick={handleReport}>
            Generate Report
          </GlowButton>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel panel-glow flex flex-wrap items-center gap-6 p-5"
      >
        <ScoreRing score={an.semanticDriftScore} label="Drift" />
        <div className="flex flex-1 flex-wrap gap-2.5">
          <SeverityBadge severity={an.severity} />
          <ChangeTypeBadge changeType={an.changeType} />
          <ImpactBadge impact={an.userImpact} />
          <ConsentBadge required={an.consentRequired} />
          <span className="chip border-juridical/40 text-juridical-soft">
            <ShieldCheck size={12} />
            Confidence {an.confidence}
          </span>
        </div>
      </motion.div>

      <DiffViewer oldText={oldText} newText={newText} analysis={an} />

      <div className="grid gap-6 lg:grid-cols-2">
        <HolographicPanel title="Detected signals" icon={ScanSearch}>
          <div className="space-y-2.5">
            {an.detectedSignals.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-3"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-coral" style={{ boxShadow: '0 0 8px #e85c5c' }} />
                <span className="text-sm text-ivory/75">{s}</span>
              </motion.div>
            ))}
          </div>
        </HolographicPanel>

        <HolographicPanel title="Recommendations" icon={Lightbulb}>
          <ul className="space-y-2.5">
            {an.recommendations.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-[10px] text-gold">
                  {i + 1}
                </span>
                <span className="text-sm text-ivory/75">{r}</span>
              </motion.li>
            ))}
          </ul>
        </HolographicPanel>
      </div>

      <HolographicPanel title="Meaning interpretation" icon={GitCompareArrows}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-ink-edge bg-ink-deep/40 p-4">
            <p className="font-grotesk text-xs uppercase tracking-wider text-ivory/45">Previous meaning</p>
            <p className="mt-2 text-sm text-ivory/70">{an.oldMeaning}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(232,92,92,0.3)' }}>
            <p className="font-grotesk text-xs uppercase tracking-wider text-coral-soft/70">New meaning</p>
            <p className="mt-2 text-sm text-ivory/70">{an.newMeaning}</p>
          </div>
        </div>
      </HolographicPanel>
    </div>
  )
}
