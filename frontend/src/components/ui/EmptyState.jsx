import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-edge bg-ink-panel/40 px-6 py-14 text-center"
    >
      {Icon ? (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/5 text-gold/70">
          <Icon size={24} />
        </span>
      ) : null}
      <h3 className="font-display text-2xl text-ivory">{title}</h3>
      {message ? <p className="mt-2 max-w-sm text-sm text-ivory/50">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  )
}
