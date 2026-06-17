import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DocumentNode from './DocumentNode'
import { STATUS_META } from '../../utils/riskScoring'

// Lays documents out as nodes on a semantic risk field with connecting lines.
export default function ObservatoryMap({ documents = [] }) {
  const navigate = useNavigate()

  const placed = useMemo(() => {
    const n = documents.length || 1
    return documents.map((doc, i) => {
      // deterministic spiral placement, kept inside padding
      const golden = 2.399963
      const t = i + 1
      const radius = 12 + (t / (n + 1)) * 34
      const angle = t * golden
      const x = 50 + Math.cos(angle) * radius * 1.25
      const y = 50 + Math.sin(angle) * radius
      return { doc, x: Math.max(8, Math.min(92, x)), y: Math.max(10, Math.min(90, y)) }
    })
  }, [documents])

  return (
    <div className="panel panel-glow relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(63,214,176,0.5), transparent)' }}
      />
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="font-grotesk text-base font-semibold text-ivory">Semantic Observatory</h2>
          <p className="text-xs text-ivory/45">Living nodes mapped by semantic risk</p>
        </div>
        <Legend />
      </div>

      <div className="relative h-[380px] w-full md:h-[440px]">
        {/* concentric rings */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <radialGradient id="obsfield">
              <stop offset="0%" stopColor="rgba(63,214,176,0.06)" />
              <stop offset="100%" stopColor="rgba(6,7,13,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#obsfield)" />
          {[0.16, 0.3, 0.44].map((r, i) => (
            <ellipse
              key={i}
              cx="50%"
              cy="50%"
              rx={r * 100 + '%'}
              ry={r * 80 + '%'}
              fill="none"
              stroke="#1d2233"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
          ))}
          {placed.map((p, i) =>
            placed.slice(i + 1).map((q, j) => {
              const dx = p.x - q.x
              const dy = p.y - q.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist > 34) return null
              return (
                <line
                  key={i + '-' + j}
                  x1={p.x + '%'}
                  y1={p.y + '%'}
                  x2={q.x + '%'}
                  y2={q.y + '%'}
                  stroke="rgba(200,164,91,0.18)"
                  strokeWidth="1"
                />
              )
            })
          )}
          {/* central chamber */}
          <circle cx="50%" cy="50%" r="22" fill="none" stroke="#c8a45b" strokeWidth="1" opacity="0.5" />
        </svg>

        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-ink-panel text-[9px] uppercase tracking-widest text-gold/70">
          Core
        </span>

        {placed.map(({ doc, x, y }) => (
          <DocumentNode key={doc.id} doc={doc} x={x} y={y} onSelect={(d) => navigate('/document/' + d.id)} />
        ))}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="hidden flex-wrap items-center gap-3 lg:flex">
      {Object.entries(STATUS_META).map(([key, meta]) => (
        <span key={key} className="flex items-center gap-1.5 text-[10px] text-ivory/50">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: '0 0 6px ' + meta.glow }} />
          {meta.label}
        </span>
      ))}
    </div>
  )
}
