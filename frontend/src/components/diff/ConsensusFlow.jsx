import { motion } from 'framer-motion'
import {
  Wallet,
  Send,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Droplets,
} from 'lucide-react'
import LoadingScan from '../ui/LoadingScan'
import SeverityBadge from '../ui/SeverityBadge'
import { ChangeTypeBadge } from '../ui/RiskBadge'
import { shortHash } from '../../utils/formatters'

const FAUCET = 'https://testnet-faucet.genlayer.foundation/'

const STEPS = [
  { key: 'wallet', label: 'Confirm in wallet', icon: Wallet },
  { key: 'submitted', label: 'Submitted to Bradbury', icon: Send },
  { key: 'consensus', label: 'Validators deliberating', icon: Cpu },
  { key: 'confirmed', label: 'Verified on GenLayer', icon: CheckCircle2 },
]

const ORDER = { wallet: 0, submitted: 1, consensus: 2, confirmed: 3, error: 1 }

// Renders the live on-chain analyze lifecycle: confirm-in-wallet, submitted
// (tx hash + explorer), consensus deliberating (live status + peeked draft),
// confirmed, or a friendly error with a faucet link.
export default function ConsensusFlow({ stage, explorer }) {
  const name = stage?.name || 'wallet'
  const current = ORDER[name] ?? 0
  const isError = name === 'error'
  const draft = stage?.draft
  const txHash = stage?.txHash
  const explorerBase = explorer || stage?.explorer || 'https://explorer-bradbury.genlayer.com'
  const txUrl = txHash ? explorerBase + '/tx/' + txHash : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const done = !isError && i < current
          const active = !isError && i === current
          const color = done ? '#3fd6b0' : active ? '#c8a45b' : '#3a3f52'
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: color + '66', color, backgroundColor: color + '14' }}
              >
                <Icon size={16} />
              </span>
              <span className="text-[10px] leading-tight text-ivory/50">{step.label}</span>
            </div>
          )
        })}
      </div>

      {isError ? (
        <div className="rounded-xl border border-coral/40 bg-coral/10 p-4">
          <p className="flex items-start gap-2 text-sm text-coral-soft">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {stage?.message || 'The analysis could not be completed.'}
          </p>
          <a
            href={FAUCET}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-gold"
          >
            <Droplets size={13} />
            Get testnet GEN from the faucet
            <ExternalLink size={12} />
          </a>
        </div>
      ) : name === 'confirmed' ? (
        <div className="rounded-xl border border-juridical/40 bg-juridical/10 p-4">
          <p className="flex items-center gap-2 text-sm text-juridical-soft">
            <CheckCircle2 size={16} />
            Verified on GenLayer. Opening the semantic diff.
          </p>
        </div>
      ) : (
        <LoadingScan
          lines={5}
          label={
            name === 'wallet'
              ? 'Waiting for wallet signature'
              : name === 'submitted'
                ? 'Transaction submitted, entering consensus'
                : 'Validators reaching consensus (1 to 5+ minutes)'
          }
        />
      )}

      {txUrl ? (
        <a
          href={txUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl border border-ink-edge bg-ink-deep/60 px-4 py-3 text-xs text-ivory/60 transition hover:border-gold/40 hover:text-gold"
        >
          <span className="font-mono">tx {shortHash(txHash, 12, 8)}</span>
          <span className="inline-flex items-center gap-1">
            View on explorer <ExternalLink size={12} />
          </span>
        </a>
      ) : null}

      {draft && !isError && name !== 'confirmed' ? (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <p className="mb-2 font-grotesk text-[11px] uppercase tracking-widest text-gold/70">
            Leader draft verdict (preview)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={draft.severity} size="sm" />
            <ChangeTypeBadge changeType={draft.changeType} />
          </div>
          {draft.summary ? <p className="mt-2 text-sm text-ivory/65">{draft.summary}</p> : null}
          <p className="mt-2 text-[11px] text-ivory/40">
            Draft only. The verdict is final once validators reach consensus.
          </p>
        </div>
      ) : null}
    </div>
  )
}
