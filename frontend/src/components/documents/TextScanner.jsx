import { motion } from 'framer-motion'
import { isCriticalWord } from '../../utils/semanticDiff'

// Renders text with a horizontal scanner sweep and critical words ignited.
export default function TextScanner({ text = '', ignite = true, className = '' }) {
  const words = String(text).split(/(\s+)/)
  return (
    <div className={'relative overflow-hidden rounded-xl border border-ink-edge bg-ink-deep/60 p-4 ' + className}>
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 scanline"
        animate={{ x: ['-20%', '120%'] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="relative font-body text-sm leading-relaxed text-ivory/80">
        {words.map((w, i) => {
          if (!/\S/.test(w)) return <span key={i}>{w}</span>
          const critical = ignite && isCriticalWord(w)
          return (
            <span key={i} className={critical ? 'ignite font-medium' : ''}>
              {w}
            </span>
          )
        })}
      </p>
    </div>
  )
}
