import SealBadge from '../ui/SealBadge'

const BADGE_TYPES = {
  verified: { label: 'Verified by TermsVault', sub: 'Semantic integrity confirmed', tone: 'gold' },
  noharm: { label: 'No harmful semantic changes', sub: 'Meaning preserved', tone: 'cyan' },
  highrisk: { label: 'High-risk changes detected', sub: 'Review recommended', tone: 'red' },
  consent: { label: 'Consent update recommended', sub: 'User action advised', tone: 'drift' },
  genlayer: { label: 'GenLayer Semantic Check', sub: 'Verified by GenLayer (mock)', tone: 'cyan' },
}

export const BADGE_OPTIONS = Object.entries(BADGE_TYPES).map(([key, v]) => ({ key, ...v }))

export default function PublicBadgePreview({ type = 'verified', project = 'project-id', hash }) {
  const meta = BADGE_TYPES[type] || BADGE_TYPES.verified
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-edge bg-ink-deep/50 p-8">
      <SealBadge label={meta.label} sub={meta.sub} tone={meta.tone} hash={hash} />
      <p className="mt-4 font-mono text-[11px] text-ivory/35">project: {project}</p>
    </div>
  )
}
