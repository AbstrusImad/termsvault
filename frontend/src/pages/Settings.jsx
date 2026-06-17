import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Cpu,
  SlidersHorizontal,
  Tags,
  Download,
  Trash2,
  Palette,
  Sparkles,
  ExternalLink,
  Droplets,
} from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import HolographicPanel from '../components/ui/HolographicPanel'
import GlowButton from '../components/ui/GlowButton'
import { CATEGORIES } from '../data/demoDocuments'
import { exportState } from '../store/storage'
import { getGenLayerStatus, CONTRACT_ADDRESS, EXPLORER, FAUCET, IS_DEPLOYED } from '../genlayer/genlayerClient'
import { shortHash } from '../utils/formatters'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-3">
      <div>
        <p className="font-grotesk text-sm text-ivory">{label}</p>
        {hint ? <p className="text-xs text-ivory/45">{hint}</p> : null}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={
          'relative h-6 w-11 shrink-0 rounded-full border transition ' +
          (checked ? 'border-juridical/60 bg-juridical/30' : 'border-ink-edge bg-ink-panel')
        }
        aria-pressed={checked}
        aria-label={label}
      >
        <motion.span
          layout
          className="absolute top-0.5 h-4 w-4 rounded-full"
          style={{ backgroundColor: checked ? '#3fd6b0' : '#8a8678', left: checked ? '24px' : '2px' }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings, resetVault } = useVault()
  const toast = useToast()
  const [confirmClear, setConfirmClear] = useState(false)
  const [status, setStatus] = useState(null)

  const mode = settings.genlayerMode || (settings.genlayerMockMode ? 'mock' : 'live')
  const isMock = mode === 'mock'

  useEffect(() => {
    let cancelled = false
    getGenLayerStatus()
      .then((s) => {
        if (!cancelled) setStatus(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [mode])

  function toggleCategory(cat) {
    const active = settings.activeCategories.includes(cat)
    const next = active
      ? settings.activeCategories.filter((c) => c !== cat)
      : [...settings.activeCategories, cat]
    updateSettings({ activeCategories: next })
  }

  function handleExport() {
    const data = exportState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'termsvault-export.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Vault data exported')
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    resetVault()
    setConfirmClear(false)
    toast.info('Local data cleared and demo seed restored')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Vault configuration</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">Settings</h1>
      </div>

      <HolographicPanel title="GenLayer" icon={Cpu} subtitle="Semantic verification backend">
        <div className="space-y-3">
          <Toggle
            checked={isMock}
            onChange={(v) => updateSettings({ genlayerMode: v ? 'mock' : 'live', genlayerMockMode: v })}
            label="GenLayer mock mode"
            hint="ON simulates validation locally. OFF runs live on GenLayer Bradbury with AI consensus."
          />
          <div className="rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-3 text-xs text-ivory/55">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ivory/45">Mode</span>
              <span className={isMock ? 'text-gold-soft' : 'text-juridical-soft'}>
                {isMock ? 'Mock (local engine)' : 'Live (Bradbury)'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-ivory/45">Network</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isMock ? '#c8a45b' : status && status.online ? '#3fd6b0' : '#e0a04b',
                  }}
                />
                {isMock ? 'Simulated' : status ? (status.online ? 'Online' : status.status || 'Offline') : 'Checking...'}
              </span>
            </div>
            {!isMock && status && status.online ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-ivory/45">Verified on GenLayer</span>
                <span className="tnum text-juridical-soft">{status.reports} reports</span>
              </div>
            ) : null}
            {!isMock ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-ivory/45">Contract</span>
                {IS_DEPLOYED ? (
                  <a
                    href={EXPLORER + '/address/' + CONTRACT_ADDRESS}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-juridical-soft hover:text-juridical"
                  >
                    {shortHash(CONTRACT_ADDRESS, 8, 6)}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="font-mono text-ivory/40">Not deployed yet</span>
                )}
              </div>
            ) : null}
          </div>
          <a
            href={FAUCET}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold-soft transition hover:text-gold"
          >
            <Droplets size={13} />
            GenLayer testnet faucet (top up GEN for AI transactions)
            <ExternalLink size={12} />
          </a>
        </div>
      </HolographicPanel>

      <HolographicPanel title="Analysis preferences" icon={SlidersHorizontal}>
        <div className="space-y-4">
          <Toggle
            checked={settings.autoAnalyze}
            onChange={(v) => updateSettings({ autoAnalyze: v })}
            label="Auto analyze on new snapshot"
            hint="Run semantic analysis automatically when a new version is added."
          />
          <div className="rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-grotesk text-sm text-ivory">Risk threshold</span>
              <span className="tnum font-grotesk text-sm font-semibold text-gold-soft">{settings.riskThreshold}</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={settings.riskThreshold}
              onChange={(e) => updateSettings({ riskThreshold: Number(e.target.value) })}
              className="w-full accent-[#c8a45b]"
            />
            <p className="mt-1.5 text-xs text-ivory/45">
              Changes scoring at or above this threshold are flagged as high priority.
            </p>
          </div>
        </div>
      </HolographicPanel>

      <HolographicPanel title="Active categories" icon={Tags}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = settings.activeCategories.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={
                  'rounded-lg border px-3 py-1.5 font-grotesk text-xs transition ' +
                  (active
                    ? 'border-juridical/50 bg-juridical/10 text-juridical-soft'
                    : 'border-ink-edge text-ivory/45 hover:text-ivory')
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
      </HolographicPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <HolographicPanel title="Appearance" icon={Palette}>
          <div className="space-y-3">
            <Toggle
              checked={settings.animations}
              onChange={(v) => updateSettings({ animations: v })}
              label="Background animations"
              hint="Living particle field and microinteractions."
            />
            <div className="rounded-xl border border-ink-edge bg-ink-deep/40 px-4 py-3">
              <p className="mb-2 font-grotesk text-sm text-ivory">Theme</p>
              <div className="flex gap-2">
                {['archive', 'observatory'].map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSettings({ theme: t })}
                    className={
                      'flex-1 rounded-lg border px-3 py-2 font-grotesk text-xs capitalize transition ' +
                      (settings.theme === t
                        ? 'border-gold/50 bg-gold/10 text-gold-soft'
                        : 'border-ink-edge text-ivory/50 hover:text-ivory')
                    }
                  >
                    <Sparkles size={12} className="mr-1 inline" />
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </HolographicPanel>

        <HolographicPanel title="Data" icon={SettingsIcon}>
          <div className="space-y-3">
            <GlowButton variant="ghost" icon={Download} onClick={handleExport} className="w-full">
              Export data as JSON
            </GlowButton>
            <button
              onClick={handleClear}
              className={
                'flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 font-grotesk text-sm font-semibold transition ' +
                (confirmClear
                  ? 'border-coral bg-coral/20 text-coral-soft'
                  : 'border-ink-edge text-ivory/55 hover:border-coral/50 hover:text-coral-soft')
              }
            >
              <Trash2 size={15} />
              {confirmClear ? 'Click again to confirm clear' : 'Clear localStorage'}
            </button>
            <p className="text-xs text-ivory/40">
              Clearing removes all stored documents and reports, then restores the demo seed.
            </p>
          </div>
        </HolographicPanel>
      </div>
    </div>
  )
}
