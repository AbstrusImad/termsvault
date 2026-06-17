import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Check, BadgeCheck } from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import HolographicPanel from '../components/ui/HolographicPanel'
import PublicBadgePreview, { BADGE_OPTIONS } from '../components/reports/PublicBadgePreview'
import GlowButton from '../components/ui/GlowButton'
import { snapshotHash } from '../utils/documentParser'

function CodeBlock({ code, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-edge bg-ink-deep/70 px-4 py-3">
      <code className="overflow-x-auto whitespace-nowrap font-mono text-xs text-juridical-soft">{code}</code>
      <button onClick={onCopy} className="shrink-0 text-ivory/50 transition hover:text-gold" aria-label="Copy code">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  )
}

export default function PublicBadge() {
  const { documents, saveBadge } = useVault()
  const toast = useToast()
  const [params] = useSearchParams()

  const docId = params.get('doc')
  const linkedDoc = documents.find((d) => d.id === docId)

  const defaultType = useMemo(() => {
    if (!linkedDoc) return 'verified'
    if (linkedDoc.consentRequired) return 'consent'
    if (linkedDoc.severity === 'High' || linkedDoc.severity === 'Critical') return 'highrisk'
    if (linkedDoc.severity === 'Stable') return 'noharm'
    return 'verified'
  }, [linkedDoc])

  const [type, setType] = useState(defaultType)
  const [project, setProject] = useState(linkedDoc ? slug(linkedDoc.project) : 'novaai')
  const [copied, setCopied] = useState('')

  const hash = useMemo(() => snapshotHash(project + type).slice(0, 18), [project, type])

  const imgCode = '<img src="https://termsvault.app/badge/' + project + '" />'
  const divCode = '<div data-termsvault-badge="' + project + '"></div>'

  function copy(text, key) {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(''), 1600)
  }

  function persist() {
    saveBadge({
      id: 'badge_' + project + '_' + type,
      project,
      type,
      hash,
      createdAt: new Date().toISOString(),
    })
    toast.success('Badge saved to the vault')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Living holographic emblem</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">Public badge</h1>
        <p className="mt-2 text-sm text-ivory/50">
          Generate a public seal that proves a document has been semantically verified.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <HolographicPanel title="Badge preview" icon={BadgeCheck}>
          <motion.div key={type} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <PublicBadgePreview type={type} project={project} hash={hash} />
          </motion.div>
        </HolographicPanel>

        <div className="space-y-6">
          <HolographicPanel title="Configure" icon={BadgeCheck}>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-grotesk text-xs uppercase tracking-wider text-ivory/50">
                  Project identifier
                </span>
                <input
                  value={project}
                  onChange={(e) => setProject(slug(e.target.value))}
                  className="w-full rounded-xl border border-ink-edge bg-ink-deep/60 px-4 py-2.5 font-mono text-sm text-ivory outline-none focus:border-gold/60"
                />
              </label>

              <div>
                <span className="mb-2 block font-grotesk text-xs uppercase tracking-wider text-ivory/50">
                  Badge type
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BADGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setType(opt.key)}
                      className={
                        'rounded-xl border px-3 py-2.5 text-left font-grotesk text-xs transition ' +
                        (type === opt.key
                          ? 'border-gold/50 bg-gold/10 text-gold-soft'
                          : 'border-ink-edge text-ivory/55 hover:text-ivory')
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <GlowButton variant="gold" icon={BadgeCheck} onClick={persist}>
                Save Badge
              </GlowButton>
            </div>
          </HolographicPanel>

          <HolographicPanel title="Embed code" icon={Copy}>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">Image tag</p>
                <CodeBlock code={imgCode} onCopy={() => copy(imgCode, 'img')} copied={copied === 'img'} />
              </div>
              <div>
                <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">Script container</p>
                <CodeBlock code={divCode} onCopy={() => copy(divCode, 'div')} copied={copied === 'div'} />
              </div>
              <p className="text-[11px] text-ivory/35">
                These embeds are illustrative. In production they would resolve to a live badge endpoint.
              </p>
            </div>
          </HolographicPanel>
        </div>
      </div>
    </div>
  )
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
