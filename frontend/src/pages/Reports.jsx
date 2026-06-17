import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ScrollText,
  X,
  ShieldCheck,
  Copy,
  Check,
  BadgeCheck,
  GitCompareArrows,
} from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import ReportCard from '../components/reports/ReportCard'
import HolographicPanel from '../components/ui/HolographicPanel'
import SealBadge from '../components/ui/SealBadge'
import ScoreRing from '../components/ui/ScoreRing'
import SeverityBadge from '../components/ui/SeverityBadge'
import { ImpactBadge, ConsentBadge } from '../components/ui/RiskBadge'
import EmptyState from '../components/ui/EmptyState'
import GlowButton from '../components/ui/GlowButton'
import Timeline from '../components/ui/Timeline'
import { formatDateTime } from '../utils/formatters'
import { severityColor } from '../utils/riskScoring'

const FILTERS = ['All', 'Stable', 'Minor', 'Medium', 'High', 'Critical']

function sealTone(severity) {
  if (severity === 'High' || severity === 'Critical') return 'red'
  if (severity === 'Medium' || severity === 'Minor') return 'gold'
  return 'cyan'
}

export default function Reports() {
  const { reports } = useVault()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState(null)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'All') return reports
    return reports.filter((r) => r.severity === filter)
  }, [reports, filter])

  useEffect(() => {
    const openId = params.get('open')
    if (openId) {
      const r = reports.find((x) => x.id === openId)
      if (r) setActive(r)
    }
  }, [params, reports])

  function close() {
    setActive(null)
    if (params.get('open')) {
      params.delete('open')
      setParams(params, { replace: true })
    }
  }

  function copyHash(hash) {
    navigator.clipboard?.writeText(hash)
    setCopied(true)
    toast.success('Snapshot hash copied')
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Semantic audit certificates</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">Reports</h1>
          <p className="mt-2 text-sm text-ivory/50">Each report is an official record of a semantic change.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                'rounded-lg px-3 py-1.5 font-grotesk text-xs transition ' +
                (filter === f ? 'bg-gold/15 text-gold-soft' : 'border border-ink-edge text-ivory/50 hover:text-ivory')
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => (
            <ReportCard key={r.id} report={r} index={i} onOpen={setActive} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No reports in this filter"
          message="Generate a report from a semantic diff to see it archived here."
          action={
            <Link to="/dashboard">
              <GlowButton variant="gold">Go to Observatory</GlowButton>
            </Link>
          }
        />
      )}

      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.95, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="panel panel-glow my-6 w-full max-w-3xl overflow-hidden"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,91,0.6), transparent)' }}
              />
              <div className="hairline flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                  <ScrollText size={18} className="text-gold" />
                  <h3 className="font-grotesk text-base font-semibold text-ivory">Semantic Audit Certificate</h3>
                </div>
                <button onClick={close} className="text-ivory/50 hover:text-ivory" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto]">
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-3xl text-ivory">{active.title}</h2>
                    <p className="mt-1 text-sm text-ivory/50">
                      {active.project} / {active.category}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SeverityBadge severity={active.severity} />
                      <ImpactBadge impact={active.userImpact} />
                      <ConsentBadge required={active.consentRequired} />
                    </div>
                  </div>

                  <Section label="Executive summary">
                    <p className="text-sm leading-relaxed text-ivory/75">{active.summary}</p>
                  </Section>

                  <Section label="Main changes">
                    <ul className="space-y-2">
                      {active.mainChanges.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm text-ivory/70">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section label="Recommendation">
                    <ul className="space-y-2">
                      {active.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ivory/70">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-[10px] text-gold">
                            {i + 1}
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section label="Snapshot hash">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-edge bg-ink-deep/60 px-4 py-3">
                      <code className="engraved truncate font-mono text-xs">{active.snapshotHash}</code>
                      <button
                        onClick={() => copyHash(active.snapshotHash)}
                        className="shrink-0 text-ivory/50 transition hover:text-gold"
                        aria-label="Copy hash"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-juridical-soft">
                      <ShieldCheck size={13} />
                      {active.genlayerStatus}
                    </p>
                  </Section>
                </div>

                <div className="flex flex-col items-center gap-5">
                  <SealBadge
                    label={active.severity === 'Stable' ? 'No harmful changes' : 'Semantic change recorded'}
                    sub={'Confidence ' + active.confidence}
                    tone={sealTone(active.severity)}
                  />
                  <ScoreRing score={active.semanticDriftScore} label="Drift" />
                </div>
              </div>

              <div className="border-t border-ink-edge px-6 py-4">
                <p className="mb-3 font-grotesk text-xs uppercase tracking-widest text-ivory/45">Archival ribbon</p>
                <Timeline
                  items={[
                    {
                      id: 'snap',
                      title: 'Snapshot notarized',
                      tag: 'Stored',
                      color: '#3fd6b0',
                      createdAt: active.createdAt,
                    },
                    {
                      id: 'an',
                      title: active.changeType + ' detected',
                      tag: active.severity,
                      color: severityColor(active.severity),
                      createdAt: active.createdAt,
                    },
                    {
                      id: 'rep',
                      title: 'Certificate generated',
                      tag: 'Verified by GenLayer',
                      color: '#c8a45b',
                      createdAt: active.createdAt,
                    },
                  ]}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-ink-edge px-6 py-4">
                <Link to={'/diff/' + active.documentId}>
                  <GlowButton variant="ghost" icon={GitCompareArrows}>
                    View Diff
                  </GlowButton>
                </Link>
                <Link to={'/badge?doc=' + active.documentId}>
                  <GlowButton variant="gold" icon={BadgeCheck}>
                    Public Badge
                  </GlowButton>
                </Link>
              </div>
              <p className="px-6 pb-4 text-[11px] text-ivory/35">Generated {formatDateTime(active.createdAt)}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className="mb-2 font-grotesk text-xs uppercase tracking-widest text-gold/70">{label}</p>
      {children}
    </div>
  )
}
