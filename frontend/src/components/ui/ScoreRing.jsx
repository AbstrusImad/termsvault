import { useEffect, useState } from 'react'

// Animated circular score ring with subtle glow.
export default function ScoreRing({ score = 0, size = 120, stroke = 9, label = 'Drift', color }) {
  const [value, setValue] = useState(0)
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(score)
      return
    }
    let raf = 0
    const start = performance.now()
    const duration = 900
    const from = 0
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (score - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const ringColor =
    color || (score >= 80 ? '#b53e3e' : score >= 60 ? '#e85c5c' : score >= 35 ? '#e0a04b' : score >= 12 ? '#c8a45b' : '#3fd6b0')
  const dash = (value / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1d2233" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ filter: 'drop-shadow(0 0 6px ' + ringColor + '88)', transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-grotesk text-2xl font-bold" style={{ color: ringColor }}>
          {value}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-ivory/45">{label}</span>
      </div>
    </div>
  )
}
