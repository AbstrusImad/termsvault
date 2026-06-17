import { motion } from 'framer-motion'

// Skeleton loader styled as a document scan.
export default function LoadingScan({ lines = 6, label = 'Scanning document' }) {
  return (
    <div className="panel relative overflow-hidden p-6">
      <div className="absolute inset-y-0 left-0 w-1/3 scanline animate-scan" />
      <p className="mb-4 font-grotesk text-xs uppercase tracking-widest text-juridical/80">{label}</p>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-gradient-to-r from-ink-edge via-ink-edge/40 to-ink-edge bg-[length:200%_100%] animate-shimmer"
            style={{ width: 100 - ((i * 11) % 45) + '%' }}
          />
        ))}
      </div>
      <motion.div
        className="mt-5 flex items-center gap-2 text-xs text-ivory/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-juridical" />
        Reading meaning, computing semantic drift
      </motion.div>
    </div>
  )
}
