import { motion } from 'framer-motion'
import { statusForDocument, STATUS_META } from '../../utils/riskScoring'

// A living node on the semantic risk map.
export default function DocumentNode({ doc, x, y, onSelect, active }) {
  const status = statusForDocument(doc)
  const meta = STATUS_META[status]
  const pulsing = status === 'high'
  const fractured = status === 'consent'

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(doc)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      whileHover={{ scale: 1.18 }}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x + '%', top: y + '%' }}
      aria-label={doc.project + ' ' + doc.name}
    >
      {pulsing ? (
        <span
          className="absolute inset-0 animate-pulsering rounded-full"
          style={{ boxShadow: '0 0 0 6px ' + meta.glow, backgroundColor: meta.color + '22' }}
        />
      ) : null}
      <span
        className="relative flex h-7 w-7 items-center justify-center rounded-full border-2"
        style={{
          borderColor: meta.color,
          backgroundColor: meta.color + '22',
          boxShadow: '0 0 14px ' + meta.glow,
          borderStyle: fractured ? 'dashed' : 'solid',
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
      </span>
      <span
        className={
          'pointer-events-none absolute left-1/2 top-9 w-max -translate-x-1/2 rounded-md border border-ink-edge bg-ink-deep/90 px-2 py-1 text-[10px] font-grotesk text-ivory/80 opacity-0 transition group-hover:opacity-100 ' +
          (active ? 'opacity-100' : '')
        }
      >
        {doc.project}
        <span className="text-ivory/40"> / {doc.name}</span>
      </span>
    </motion.button>
  )
}
