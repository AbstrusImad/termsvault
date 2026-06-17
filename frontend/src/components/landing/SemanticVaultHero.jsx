import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Words that visibly transform to demonstrate semantic drift.
const MORPHS = [
  { from: 'never', to: 'may' },
  { from: 'private', to: 'partners' },
  { from: 'free forever', to: 'free during beta' },
  { from: 'you own', to: 'we license' },
]

function MorphWord({ from, to, delay }) {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setFlipped(true)
      return
    }
    const id = setInterval(() => setFlipped((v) => !v), 3200)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="relative inline-block">
      <motion.span
        key={flipped ? 'to' : 'from'}
        initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, delay }}
        className={flipped ? 'ignite font-medium' : 'text-juridical-soft'}
      >
        {flipped ? to : from}
      </motion.span>
    </span>
  )
}

// The central circular semantic chamber with floating glass plates.
export default function SemanticVaultHero() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[460px] items-center justify-center">
      {/* rotating chamber rings */}
      <motion.div
        className="absolute inset-4 rounded-full border border-gold/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2
          return (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gold/50"
              style={{ left: 'calc(50% + ' + Math.cos(a) * 47 + '%)', top: 'calc(50% + ' + Math.sin(a) * 47 + '%)' }}
            />
          )
        })}
      </motion.div>
      <motion.div
        className="absolute inset-12 rounded-full border border-juridical/25"
        animate={{ rotate: -360 }}
        transition={{ duration: 44, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-20 rounded-full border border-drift/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* glow core */}
      <div className="absolute h-32 w-32 rounded-full bg-gold/10 blur-3xl" />

      {/* scanner sweep */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[70%] w-[2px] origin-bottom"
        style={{ background: 'linear-gradient(to top, rgba(63,214,176,0.7), transparent)' }}
        initial={{ rotate: 0, x: '-50%', y: '-100%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* central plate with morphing words */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="panel panel-glow relative z-10 w-56 p-5"
      >
        <p className="mb-2 font-grotesk text-[10px] uppercase tracking-[0.2em] text-gold/70">Living clause</p>
        <p className="font-display text-lg leading-snug text-ivory">
          We will <MorphWord from="never" to="may" delay={0} /> use your{' '}
          <MorphWord from="private" to="partners" delay={0.1} /> data, it stays{' '}
          <MorphWord from="you own" to="we license" delay={0.2} />.
        </p>
        <div className="mt-3 h-px w-full scanline" />
      </motion.div>

      {/* floating mini plates */}
      <FloatPlate className="left-0 top-6" label="Privacy" tone="#3fd6b0" delay={0.2} />
      <FloatPlate className="right-0 top-16" label="Pricing" tone="#c8a45b" delay={0.5} />
      <FloatPlate className="bottom-8 left-4" label="Roadmap" tone="#7b5cff" delay={0.8} />
      <FloatPlate className="bottom-12 right-2" label="Terms" tone="#e85c5c" delay={1.1} />
    </div>
  )
}

function FloatPlate({ className, label, tone, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{ opacity: { delay }, y: { duration: 5, repeat: Infinity, delay } }}
      className={'absolute z-0 rounded-lg border bg-ink-panel/80 p-2.5 backdrop-blur ' + className}
      style={{ borderColor: tone + '55' }}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
        <span className="font-grotesk text-[9px] uppercase tracking-wider" style={{ color: tone }}>
          {label}
        </span>
      </div>
      <div className="mt-1.5 space-y-1">
        <div className="h-1 w-12 rounded bg-ivory/15" />
        <div className="h-1 w-8 rounded bg-ivory/10" />
      </div>
    </motion.div>
  )
}
