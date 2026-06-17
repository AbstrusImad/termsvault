import { motion } from 'framer-motion'

const VARIANTS = {
  gold: 'text-ink-deep bg-gold hover:bg-gold-soft shadow-glow',
  cyan: 'text-ink-deep bg-juridical hover:bg-juridical-soft shadow-glowcyan',
  ghost: 'text-ivory border border-ink-edge bg-ink-panel/60 hover:border-gold/60 hover:text-gold-soft',
  danger: 'text-ivory bg-coral/90 hover:bg-coral shadow-glowred',
  outline: 'text-ivory border border-ivory/20 hover:border-juridical/60 hover:text-juridical-soft',
}

export default function GlowButton({
  children,
  variant = 'gold',
  type = 'button',
  className = '',
  icon: Icon,
  disabled = false,
  ...rest
}) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-grotesk text-sm font-semibold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ' +
        (VARIANTS[variant] || VARIANTS.gold) +
        ' ' +
        className
      }
      {...rest}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </motion.button>
  )
}
