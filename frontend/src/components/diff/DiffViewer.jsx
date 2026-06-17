import { motion } from 'framer-motion'
import MeaningRift from './MeaningRift'
import { isCriticalWord } from '../../utils/semanticDiff'

function MarkedText({ text }) {
  const words = String(text).split(/(\s+)/)
  return (
    <p className="font-body text-sm leading-relaxed text-ivory/80">
      {words.map((w, i) => {
        if (!/\S/.test(w)) return <span key={i}>{w}</span>
        const critical = isCriticalWord(w)
        return (
          <span
            key={i}
            className={critical ? 'rounded px-0.5 font-medium text-coral-soft' : ''}
            style={critical ? { backgroundColor: 'rgba(232,92,92,0.12)' } : undefined}
          >
            {w}
          </span>
        )
      })}
    </p>
  )
}

// Three-zone composition: old text, meaning rift, new text.
export default function DiffViewer({ oldText, newText, analysis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="panel relative overflow-hidden p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="chip border-ivory/20 text-ivory/55">Previous meaning</span>
          <span className="font-mono text-[10px] text-ivory/35">v1</span>
        </div>
        <MarkedText text={oldText} />
        <p className="mt-4 border-t border-ink-edge pt-3 text-xs text-ivory/45">{analysis.oldMeaning}</p>
      </motion.div>

      <div className="flex items-center justify-center lg:w-28">
        <MeaningRift score={analysis.semanticDriftScore} severity={analysis.severity} />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="panel relative overflow-hidden p-5"
        style={{ borderColor: 'rgba(232,92,92,0.3)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="chip border-coral/40 text-coral-soft">New meaning</span>
          <span className="font-mono text-[10px] text-ivory/35">v2</span>
        </div>
        <MarkedText text={newText} />
        <p className="mt-4 border-t border-ink-edge pt-3 text-xs text-ivory/45">{analysis.newMeaning}</p>
      </motion.div>
    </div>
  )
}
