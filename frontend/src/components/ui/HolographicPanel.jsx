import { motion } from 'framer-motion'

// A framed panel with a subtle holographic sheen used across detail screens.
export default function HolographicPanel({ title, subtitle, icon: Icon, actions, children, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={'panel panel-glow relative overflow-hidden ' + className}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,91,0.6), transparent)' }}
      />
      {(title || actions) && (
        <header className="hairline flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                <Icon size={17} />
              </span>
            ) : null}
            <div>
              {title ? <h2 className="font-grotesk text-base font-semibold text-ivory">{title}</h2> : null}
              {subtitle ? <p className="text-xs text-ivory/45">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </motion.section>
  )
}
