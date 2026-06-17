import { ShieldCheck, ShieldAlert, Minus, TrendingUp, TrendingDown } from 'lucide-react'

const IMPACT = {
  Positive: { color: '#3fd6b0', icon: TrendingUp },
  Neutral: { color: '#cdc7b8', icon: Minus },
  Negative: { color: '#e85c5c', icon: TrendingDown },
}

export function ImpactBadge({ impact = 'Neutral' }) {
  const meta = IMPACT[impact] || IMPACT.Neutral
  const Icon = meta.icon
  return (
    <span className="chip" style={{ color: meta.color, borderColor: meta.color + '55' }}>
      <Icon size={12} />
      {impact} impact
    </span>
  )
}

export function ConsentBadge({ required }) {
  if (required) {
    return (
      <span className="chip" style={{ color: '#7b5cff', borderColor: '#7b5cff66', backgroundColor: '#7b5cff14' }}>
        <ShieldAlert size={12} />
        Consent required
      </span>
    )
  }
  return (
    <span className="chip" style={{ color: '#3fd6b0', borderColor: '#3fd6b055' }}>
      <ShieldCheck size={12} />
      No consent needed
    </span>
  )
}

export function ChangeTypeBadge({ changeType = 'Stable' }) {
  const negative = /weakened|expanded|Pricing|Ownership/.test(changeType)
  const color = changeType === 'Stable' ? '#3fd6b0' : negative ? '#c8a45b' : '#cdc7b8'
  return (
    <span className="chip" style={{ color, borderColor: color + '55' }}>
      {changeType}
    </span>
  )
}
