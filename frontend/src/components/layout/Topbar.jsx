import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, Plus, Menu, Power } from 'lucide-react'
import { useVault } from '../../store/VaultContext'
import { useToast } from '../../store/ToastContext'
import { shortAddress } from '../../utils/formatters'
import GlowButton from '../ui/GlowButton'

function makeMockAddress() {
  const hex = '0123456789aBcDeF'
  let body = ''
  for (let i = 0; i < 4; i++) body += hex[Math.floor(Math.random() * hex.length)]
  let tail = ''
  for (let i = 0; i < 4; i++) tail += hex[Math.floor(Math.random() * hex.length)]
  return '0x7A4' + body + '9F' + tail.slice(0, 2)
}

export default function Topbar({ onToggleSidebar }) {
  const { wallet, setWallet } = useVault()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  function connect() {
    if (wallet.connected) {
      setWallet({ connected: false, address: '' })
      toast.info('Wallet disconnected')
      return
    }
    setBusy(true)
    setTimeout(() => {
      const address = makeMockAddress()
      setWallet({ connected: true, address })
      setBusy(false)
      toast.success('Wallet connected ' + shortAddress(address))
    }, 600)
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-edge bg-ink-deep/80 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg border border-ink-edge p-2 text-ivory/70 transition hover:text-gold md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>
        <Link to="/" className="flex items-center gap-2.5">
          <VaultMark />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-ivory">TermsVault</p>
            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-ivory/40 sm:block">
              Semantic trust infrastructure
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <Link to="/add" className="hidden sm:block">
          <GlowButton variant="ghost" icon={Plus}>
            New Document
          </GlowButton>
        </Link>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={connect}
          disabled={busy}
          className={
            'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-grotesk text-sm font-semibold transition disabled:opacity-60 ' +
            (wallet.connected
              ? 'border-juridical/50 bg-juridical/10 text-juridical-soft'
              : 'border-gold/40 bg-gold/10 text-gold-soft hover:bg-gold/20')
          }
        >
          {wallet.connected ? <Power size={15} /> : <Wallet size={15} />}
          {busy ? 'Connecting...' : wallet.connected ? shortAddress(wallet.address) : 'Connect Wallet'}
        </motion.button>
      </div>
    </header>
  )
}

function VaultMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-ink-panel">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="#c8a45b" strokeWidth="1.2" />
        <circle cx="10" cy="10" r="3.4" stroke="#3fd6b0" strokeWidth="1.2" />
        <path d="M10 4.5v2M10 13.5v2M4.5 10h2M13.5 10h2" stroke="#c8a45b" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </span>
  )
}
