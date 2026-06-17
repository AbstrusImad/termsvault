import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Copy, Check, Terminal, ShieldCheck } from 'lucide-react'
import HolographicPanel from '../components/ui/HolographicPanel'
import { useToast } from '../store/ToastContext'

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/snapshots',
    color: '#3fd6b0',
    desc: 'Store a semantic snapshot of a document. Returns a verifiable hash.',
    body: {
      project: 'novaai',
      name: 'Privacy Policy',
      category: 'Privacy Policy',
      text: 'We do not use user prompts to train AI models.',
    },
    response: {
      id: 'snap_9f21a4',
      hash: '0x8c4f...a91d',
      status: 'Verified by GenLayer',
      createdAt: '2025-01-12T10:00:00Z',
    },
  },
  {
    method: 'POST',
    path: '/api/analyze',
    color: '#c8a45b',
    desc: 'Compare two snapshots and return a semantic impact report.',
    body: { oldSnapshot: 'snap_9f21a4', newSnapshot: 'snap_b73c10' },
    response: {
      changeType: 'Privacy weakened',
      severity: 'High',
      semanticDriftScore: 84,
      userImpact: 'Negative',
      consentRequired: true,
    },
  },
  {
    method: 'GET',
    path: '/api/reports/:id',
    color: '#7b5cff',
    desc: 'Retrieve a generated semantic audit certificate.',
    body: null,
    response: {
      id: 'rep_nova_privacy',
      severity: 'High',
      summary: 'Privacy commitments were weakened in this revision.',
      snapshotHash: '0x8c4f...a91d',
      genlayerStatus: 'Verified by GenLayer',
    },
  },
  {
    method: 'GET',
    path: '/api/badge/:id',
    color: '#e85c5c',
    desc: 'Resolve a public verification badge for a project.',
    body: null,
    response: { project: 'novaai', badge: 'Verified by TermsVault', tone: 'gold' },
  },
]

const METHOD_COLOR = { GET: '#3fd6b0', POST: '#c8a45b', PUT: '#7b5cff', DELETE: '#e85c5c' }

function Json({ value }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-ink-edge bg-ink-deep/70 p-4 font-mono text-xs leading-relaxed text-juridical-soft">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default function ApiDocs() {
  const toast = useToast()
  const [copied, setCopied] = useState('')

  function copy(text, key) {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    toast.success('Endpoint copied')
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Developer reference</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">API documentation</h1>
        <p className="mt-2 max-w-2xl text-sm text-ivory/50">
          The future TermsVault API. This build runs standalone in mock mode, these endpoints describe the planned
          surface for production integration.
        </p>
      </div>

      <div className="panel panel-glow flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-juridical/30 bg-juridical/10 text-juridical">
          <Terminal size={20} />
        </span>
        <div className="flex-1">
          <p className="font-grotesk text-sm font-semibold text-ivory">Base URL</p>
          <code className="font-mono text-xs text-ivory/55">https://api.termsvault.app/v1</code>
        </div>
        <span className="chip border-juridical/40 text-juridical-soft">
          <ShieldCheck size={12} />
          Verified by GenLayer
        </span>
      </div>

      <div className="space-y-5">
        {ENDPOINTS.map((ep, i) => (
          <motion.div
            key={ep.path}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <HolographicPanel
              title={ep.path}
              icon={Code2}
              actions={
                <button
                  onClick={() => copy(ep.method + ' ' + ep.path, ep.path)}
                  className="text-ivory/45 transition hover:text-gold"
                  aria-label="Copy endpoint"
                >
                  {copied === ep.path ? <Check size={15} /> : <Copy size={15} />}
                </button>
              }
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="rounded-md px-2.5 py-1 font-mono text-xs font-semibold"
                  style={{ color: METHOD_COLOR[ep.method], backgroundColor: METHOD_COLOR[ep.method] + '1a' }}
                >
                  {ep.method}
                </span>
                <p className="text-sm text-ivory/60">{ep.desc}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ep.body ? (
                  <div>
                    <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">Request body</p>
                    <Json value={ep.body} />
                  </div>
                ) : (
                  <div>
                    <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">Request</p>
                    <div className="rounded-xl border border-ink-edge bg-ink-deep/70 p-4 font-mono text-xs text-ivory/45">
                      No request body. Pass the resource id in the path.
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-1.5 font-grotesk text-xs uppercase tracking-wider text-ivory/45">Response</p>
                  <Json value={ep.response} />
                </div>
              </div>
            </HolographicPanel>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
