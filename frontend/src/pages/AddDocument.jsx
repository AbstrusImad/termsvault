import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FilePlus2, Link2, FileText, ArrowRight } from 'lucide-react'
import { useVault } from '../store/VaultContext'
import { useToast } from '../store/ToastContext'
import HolographicPanel from '../components/ui/HolographicPanel'
import GlowButton from '../components/ui/GlowButton'
import LoadingScan from '../components/ui/LoadingScan'
import TextScanner from '../components/documents/TextScanner'
import { CATEGORIES, IMPORTANCE_LEVELS } from '../data/demoDocuments'
import { normalizeText, previewText, looksLikeUrl, wordCount } from '../utils/documentParser'
import { createSemanticSnapshot } from '../genlayer/genlayerClient'

export default function AddDocument() {
  const navigate = useNavigate()
  const { createDocument } = useVault()
  const toast = useToast()

  const [mode, setMode] = useState('text')
  const [project, setProject] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [importance, setImportance] = useState('Standard')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})
  const [scanning, setScanning] = useState(false)

  const preview = previewText(text, 320)
  const words = wordCount(text)

  function validate() {
    const e = {}
    if (!project.trim()) e.project = 'Project name is required.'
    if (!name.trim()) e.name = 'Document name is required.'
    if (mode === 'url') {
      if (!url.trim()) e.url = 'Enter a document URL.'
      else if (!looksLikeUrl(url)) e.url = 'That does not look like a valid URL.'
    }
    if (!text.trim() || words < 4) e.text = 'Paste the document text, at least a few words.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    setScanning(true)
    const payload = {
      project: project.trim(),
      name: name.trim(),
      category,
      importance,
      source: mode === 'url' ? 'url' : 'pasted',
      url: mode === 'url' ? url.trim() : '',
      text: normalizeText(text),
    }
    try {
      await createSemanticSnapshot({ text: payload.text })
      const doc = createDocument(payload)
      toast.success('Snapshot created for ' + doc.name)
      setTimeout(() => navigate('/document/' + doc.id), 400)
    } catch (err) {
      setScanning(false)
      toast.error('Could not create the snapshot. Try again.')
    }
  }

  if (scanning) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10">
        <h1 className="font-display text-3xl text-ivory">Creating semantic snapshot</h1>
        <p className="text-sm text-ivory/50">Reading the document and computing a verifiable hash.</p>
        <LoadingScan lines={7} label="Scanning and notarizing" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">New artifact</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">Add a document</h1>
        <p className="mt-2 text-sm text-ivory/50">
          Register a URL or paste text. TermsVault stores a baseline snapshot you can compare against later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <HolographicPanel title="Document details" icon={FilePlus2}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project name" error={errors.project}>
                <input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="NovaAI"
                  className="vault-input"
                />
              </Field>
              <Field label="Document name" error={errors.name}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Privacy Policy"
                  className="vault-input"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="vault-input">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Importance level">
                <select value={importance} onChange={(e) => setImportance(e.target.value)} className="vault-input">
                  {IMPORTANCE_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex gap-2">
              <ModeTab active={mode === 'text'} onClick={() => setMode('text')} icon={FileText} label="Paste text" />
              <ModeTab active={mode === 'url'} onClick={() => setMode('url')} icon={Link2} label="From URL" />
            </div>

            {mode === 'url' ? (
              <Field label="Document URL" error={errors.url}>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/privacy"
                  className="vault-input font-mono text-xs"
                />
                <p className="mt-1.5 text-[11px] text-ivory/35">
                  In mock mode the text below is used as the captured content.
                </p>
              </Field>
            ) : null}

            <Field label="Document text" error={errors.text}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste the full text of the policy, promise or document here."
                className="vault-input resize-y font-body leading-relaxed"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-ivory/35">
                <span>{words} words</span>
                <span>Baseline snapshot v1</span>
              </div>
            </Field>

            <GlowButton type="submit" variant="gold" icon={ArrowRight}>
              Create Snapshot
            </GlowButton>
          </div>
        </HolographicPanel>

        <div className="space-y-4">
          <HolographicPanel title="Detected text preview" icon={FileText}>
            {text.trim() ? (
              <TextScanner text={preview} />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-edge bg-ink-deep/40 p-8 text-center text-sm text-ivory/40">
                The detected text preview appears here as you paste.
              </div>
            )}
          </HolographicPanel>

          <motion.div className="panel p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-grotesk text-xs uppercase tracking-widest text-juridical/70">Tip</p>
            <p className="mt-2 text-sm text-ivory/55">
              After the baseline is stored, open the document and run a new analysis with an updated version to see
              the semantic diff and impact report.
            </p>
          </motion.div>
        </div>
      </form>

      <style>{`
        .vault-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #1d2233;
          background: rgba(6,7,13,0.6);
          padding: 0.7rem 0.9rem;
          color: #f4efe3;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .vault-input:focus {
          border-color: rgba(200,164,91,0.6);
          box-shadow: 0 0 0 3px rgba(200,164,91,0.12);
        }
        .vault-input::placeholder { color: rgba(244,239,227,0.3); }
        select.vault-input { appearance: none; cursor: pointer; }
        option { background: #11141f; }
      `}</style>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-grotesk text-xs uppercase tracking-wider text-ivory/50">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-coral-soft">{error}</span> : null}
    </label>
  )
}

function ModeTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-grotesk text-sm transition ' +
        (active ? 'border-gold/50 bg-gold/10 text-gold-soft' : 'border-ink-edge text-ivory/55 hover:text-ivory')
      }
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
