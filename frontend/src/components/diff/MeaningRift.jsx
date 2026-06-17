import { motion } from 'framer-motion'

// The central animated semantic fracture between old and new meaning.
export default function MeaningRift({ score = 0, severity = 'Stable' }) {
  const color = score >= 80 ? '#b53e3e' : score >= 60 ? '#e85c5c' : score >= 35 ? '#e0a04b' : score >= 12 ? '#c8a45b' : '#3fd6b0'
  const intensity = Math.max(0.12, score / 100)

  return (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 300">
        <defs>
          <linearGradient id="riftglow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity={intensity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* central seam */}
        <line x1="50" y1="0" x2="50" y2="300" stroke="#1d2233" strokeWidth="0.6" strokeDasharray="2 4" />
        {/* fracture path */}
        <motion.path
          d="M50 0 L48 40 L53 80 L46 120 L54 160 L47 210 L52 260 L50 300"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 5px ' + color + ')' }}
        />
        <rect x="40" y="0" width="20" height="300" fill="url(#riftglow)" />
        {/* branch cracks */}
        {[60, 140, 220].map((y, i) => (
          <motion.path
            key={i}
            d={'M50 ' + y + ' l' + (i % 2 ? 10 : -10) + ' ' + (8 + i * 2)}
            stroke={color}
            strokeWidth="0.8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, intensity + 0.3, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </svg>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative flex flex-col items-center gap-1 rounded-2xl border bg-ink-deep/80 px-4 py-3 text-center backdrop-blur"
        style={{ borderColor: color + '66', boxShadow: '0 0 24px -6px ' + color }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-ivory/45">Meaning rift</span>
        <span className="tnum font-grotesk text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="font-grotesk text-xs font-semibold" style={{ color }}>
          {severity}
        </span>
      </motion.div>
    </div>
  )
}
