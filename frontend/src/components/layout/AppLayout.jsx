import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import AnimatedBackground from '../animations/AnimatedBackground'
import { useVault } from '../../store/VaultContext'
import { useGenLayerSync } from '../../genlayer/useGenLayerSync'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { settings } = useVault()
  useGenLayerSync()

  return (
    <div className="relative min-h-screen">
      {settings.animations ? <AnimatedBackground density={0.7} /> : <div className="fixed inset-0 -z-10 bg-ink-deep" />}
      <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
