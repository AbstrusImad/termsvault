import { motion } from 'framer-motion'

// A document rendered as a floating glass plate.
export default function FloatingDocument({ title, lines = 5, tone = '#c8a45b', delay = 0, float = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.7 }}
      className="relative w-44 select-none"
      style={{ perspective: 600 }}
    >
      <motion.div
        animate={float ? { y: [0, -8, 0] } : undefined}
        transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-lg border bg-ink-panel/80 p-3 shadow-vault backdrop-blur"
        style={{ borderColor: tone + '55' }}
      >
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
          <span className="font-grotesk text-[10px] uppercase tracking-wider" style={{ color: tone }}>
            {title}
          </span>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded bg-ivory/15"
              style={{ width: 100 - ((i * 13) % 50) + '%' }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
