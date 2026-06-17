import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

// A living holographic archival seal. Procedural SVG, no assets.
export default function SealBadge({
  label = 'Verified by TermsVault',
  sub = 'Semantic Notary',
  tone = 'gold',
  size = 168,
  hash,
  animated = true,
}) {
  const tones = {
    gold: { ring: '#c8a45b', glow: 'rgba(200,164,91,0.45)', ink: '#e0c585' },
    cyan: { ring: '#3fd6b0', glow: 'rgba(63,214,176,0.45)', ink: '#6ee9cc' },
    red: { ring: '#e85c5c', glow: 'rgba(232,92,92,0.5)', ink: '#ff8585' },
    drift: { ring: '#7b5cff', glow: 'rgba(123,92,255,0.5)', ink: '#a48cff' },
  }
  const t = tones[tone] || tones.gold
  const r = size / 2

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <motion.div
        className="relative"
        style={{ width: size, height: size, filter: 'drop-shadow(0 0 22px ' + t.glow + ')' }}
        animate={animated ? { rotate: [0, 1.5, -1.5, 0] } : undefined}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
          <defs>
            <linearGradient id={'sealgrad-' + tone} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={t.ink} />
              <stop offset="100%" stopColor={t.ring} />
            </linearGradient>
            <radialGradient id={'sealcore-' + tone}>
              <stop offset="0%" stopColor="#141826" />
              <stop offset="100%" stopColor="#06070d" />
            </radialGradient>
          </defs>
          {/* outer engraved ring */}
          <circle cx={r} cy={r} r={r - 4} fill="none" stroke={t.ring} strokeWidth="1.5" opacity="0.7" />
          <circle cx={r} cy={r} r={r - 12} fill="none" stroke={t.ring} strokeWidth="0.6" opacity="0.4" strokeDasharray="2 4" />
          <circle cx={r} cy={r} r={r - 26} fill={'url(#sealcore-' + tone + ')'} stroke={t.ring} strokeWidth="1" opacity="0.9" />
          {/* tick marks */}
          {Array.from({ length: 48 }).map((_, i) => {
            const ang = (i / 48) * Math.PI * 2
            const inner = r - 10
            const outer = r - 6
            return (
              <line
                key={i}
                x1={r + Math.cos(ang) * inner}
                y1={r + Math.sin(ang) * inner}
                x2={r + Math.cos(ang) * outer}
                y2={r + Math.sin(ang) * outer}
                stroke={t.ring}
                strokeWidth={i % 4 === 0 ? 1.2 : 0.5}
                opacity={i % 4 === 0 ? 0.8 : 0.35}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <ShieldCheck size={size * 0.2} style={{ color: t.ink }} />
          <span className="mt-1 px-2 font-display text-sm leading-tight" style={{ color: t.ink }}>
            TermsVault
          </span>
        </div>
        {animated ? (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            style={{ mixBlendMode: 'screen' }}
          >
            <div className="absolute inset-y-0 -left-1/3 w-1/3 scanline animate-scan opacity-50" />
          </div>
        ) : null}
      </motion.div>
      <p className="mt-3 text-center font-grotesk text-sm font-semibold" style={{ color: t.ink }}>
        {label}
      </p>
      {sub ? <p className="text-center text-xs text-ivory/45">{sub}</p> : null}
      {hash ? <p className="mt-1 font-mono text-[10px] text-ivory/35">{hash}</p> : null}
    </div>
  )
}
