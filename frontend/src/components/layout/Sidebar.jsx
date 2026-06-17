import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid,
  FilePlus2,
  ScrollText,
  GitCompareArrows,
  Stamp,
  BadgeCheck,
  Settings as SettingsIcon,
  Code2,
  X,
} from 'lucide-react'

const LINKS = [
  { to: '/dashboard', label: 'Observatory', icon: LayoutGrid },
  { to: '/add', label: 'Add Document', icon: FilePlus2 },
  { to: '/reports', label: 'Reports', icon: ScrollText },
  { to: '/badge', label: 'Public Badge', icon: BadgeCheck },
  { to: '/api-docs', label: 'API Docs', icon: Code2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const SHORTCUTS = [
  { to: '/diff/doc_nova_privacy', label: 'Semantic Diff', icon: GitCompareArrows },
  { to: '/document/doc_nova_privacy', label: 'Living Artifact', icon: Stamp },
]

function SidebarContent({ onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.25em] text-ivory/35">Archive</p>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 font-grotesk text-sm transition ' +
            (isActive
              ? 'bg-gold/12 text-gold-soft'
              : 'text-ivory/60 hover:bg-ink-panel hover:text-ivory')
          }
        >
          {({ isActive }) => (
            <>
              <link.icon size={17} className={isActive ? 'text-gold' : 'text-ivory/45 group-hover:text-ivory/80'} />
              {link.label}
              {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold shadow-glow" /> : null}
            </>
          )}
        </NavLink>
      ))}

      <p className="px-3 pb-2 pt-5 text-[10px] uppercase tracking-[0.25em] text-ivory/35">Demo case</p>
      {SHORTCUTS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-grotesk text-sm text-ivory/55 transition hover:bg-ink-panel hover:text-ivory"
        >
          <link.icon size={16} className="text-juridical/70" />
          {link.label}
        </NavLink>
      ))}

      <div className="mt-auto rounded-xl border border-ink-edge bg-ink-panel/60 p-3.5">
        <p className="font-grotesk text-xs font-semibold text-juridical-soft">Powered by GenLayer</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ivory/45">
          Semantic snapshots verified by GenLayer in mock mode. Switch in Settings.
        </p>
      </div>
    </nav>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-ink-edge bg-ink-deep/60 md:block">
        <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-ink-edge bg-ink-deep md:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink-edge px-4 py-3">
                <span className="font-display text-lg text-ivory">Navigation</span>
                <button onClick={onClose} className="text-ivory/60 hover:text-gold" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
