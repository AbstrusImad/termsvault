import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileWarning } from 'lucide-react'
import AnimatedBackground from '../components/animations/AnimatedBackground'
import GlowButton from '../components/ui/GlowButton'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AnimatedBackground density={0.6} />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel panel-glow max-w-md p-10 text-center"
      >
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
          <FileWarning size={28} />
        </span>
        <h1 className="font-display text-5xl font-semibold text-ivory">404</h1>
        <p className="mt-2 text-sm text-ivory/55">
          This page escaped the archive. The meaning you are looking for is not here.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/">
            <GlowButton variant="ghost">Back home</GlowButton>
          </Link>
          <Link to="/dashboard">
            <GlowButton variant="gold">Open Observatory</GlowButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
