import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, accent = '#c8a45b', hint, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      className="panel panel-glow group relative overflow-hidden p-5"
    >
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-ivory/45">{label}</span>
        {Icon ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: accent + '44', color: accent, backgroundColor: accent + '12' }}
          >
            <Icon size={17} />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="tnum font-grotesk text-3xl font-bold text-ivory">{value}</span>
        {hint ? <span className="mb-1 text-xs text-ivory/40">{hint}</span> : null}
      </div>
    </motion.div>
  )
}
