import { SEVERITY_META } from '../../utils/riskScoring'

// Severity rendered as a technical ink stamp.
export default function SeverityBadge({ severity = 'Stable', size = 'md' }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.Stable
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span
      className={'chip font-grotesk font-semibold ' + pad}
      style={{
        color: meta.color,
        borderColor: meta.color,
        backgroundColor: meta.color + '14',
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color, boxShadow: '0 0 8px ' + meta.color }}
      />
      {severity}
    </span>
  )
}
