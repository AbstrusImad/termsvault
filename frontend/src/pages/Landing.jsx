import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ScanSearch,
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
  Building2,
  Boxes,
  Users,
  Brain,
  Cloud,
  Rocket,
  Award,
  Network,
  FileText,
  Eye,
} from 'lucide-react'
import SemanticVaultHero from '../components/landing/SemanticVaultHero'
import AnimatedBackground from '../components/animations/AnimatedBackground'
import GlowButton from '../components/ui/GlowButton'
import { NOVA_OLD, NOVA_NEW } from '../data/demoDocuments'
import { isCriticalWord } from '../utils/semanticDiff'

const STEPS = [
  { icon: FileText, title: 'Register', text: 'Add a URL or paste the text of any policy, promise or document.' },
  { icon: ScanSearch, title: 'Snapshot', text: 'TermsVault stores a semantic snapshot with a verifiable hash.' },
  { icon: GitCompareArrows, title: 'Compare', text: 'A new version is measured against the previous meaning.' },
  { icon: ShieldCheck, title: 'Report', text: 'A semantic impact report explains what changed and who it affects.' },
]

const DETECTS = [
  'Privacy weakened',
  'Pricing change',
  'Ownership change',
  'Scope expanded',
  'AI training permission added',
  'Third party sharing introduced',
  'Promise weakened',
  'Consent required',
]

const BUILT_FOR = [
  { icon: Rocket, label: 'Startups' },
  { icon: Network, label: 'Web3 protocols' },
  { icon: Users, label: 'DAOs' },
  { icon: Brain, label: 'AI apps' },
  { icon: Cloud, label: 'SaaS' },
  { icon: Boxes, label: 'Launchpads' },
  { icon: Award, label: 'Grant programs' },
  { icon: Building2, label: 'Communities' },
]

function Mark({ text }) {
  return (
    <>
      {String(text)
        .split(/(\s+)/)
        .map((w, i) =>
          isCriticalWord(w) ? (
            <span key={i} className="rounded px-0.5 text-coral-soft" style={{ backgroundColor: 'rgba(232,92,92,0.12)' }}>
              {w}
            </span>
          ) : (
            <span key={i}>{w}</span>
          )
        )}
    </>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground density={1} />

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-ink-edge/60 bg-ink-deep/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-ink-panel">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="#c8a45b" strokeWidth="1.2" />
                <circle cx="10" cy="10" r="3.4" stroke="#3fd6b0" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold text-ivory">TermsVault</span>
          </div>
          <nav className="hidden items-center gap-7 font-grotesk text-sm text-ivory/60 md:flex">
            <a href="#how" className="transition hover:text-gold">How it works</a>
            <a href="#detects" className="transition hover:text-gold">Detection</a>
            <a href="#example" className="transition hover:text-gold">Example</a>
            <Link to="/api-docs" className="transition hover:text-gold">API</Link>
          </nav>
          <Link to="/dashboard">
            <GlowButton variant="gold" icon={ArrowRight}>
              Launch App
            </GlowButton>
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="chip border-gold/30 text-gold-soft"
          >
            <Sparkles size={12} />
            Semantic trust infrastructure
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-ivory md:text-6xl"
          >
            Terms change. Meaning escapes.
            <span className="block text-gold-soft">TermsVault catches it.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 max-w-lg text-base leading-relaxed text-ivory/55"
          >
            A semantic notary for digital documents and promises. Track policies, pricing, roadmaps and user
            rights, then know the moment their meaning shifts. AI-powered semantic change detection, verified by
            GenLayer.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/dashboard">
              <GlowButton variant="gold" icon={ArrowRight}>
                Launch App
              </GlowButton>
            </Link>
            <Link to="/reports">
              <GlowButton variant="ghost" icon={Eye}>
                View Demo Report
              </GlowButton>
            </Link>
          </motion.div>
        </div>

        <SemanticVaultHero />
      </section>

      {/* how it works */}
      <Section id="how" title="How it works" kicker="A meaning analysis machine">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="panel relative overflow-hidden p-5"
            >
              <span className="absolute right-4 top-3 font-display text-3xl text-ivory/10">{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <s.icon size={20} />
              </span>
              <h3 className="mt-4 font-grotesk text-base font-semibold text-ivory">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ivory/50">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* detection */}
      <Section id="detects" title="What TermsVault detects" kicker="Signals that matter">
        <div className="flex flex-wrap gap-3">
          {DETECTS.map((d, i) => (
            <motion.span
              key={d}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-ink-edge bg-ink-panel/60 px-4 py-2.5 font-grotesk text-sm text-ivory/75"
            >
              {d}
            </motion.span>
          ))}
        </div>
      </Section>

      {/* example */}
      <Section id="example" title="A semantic change, visualized" kicker="The NovaAI privacy case">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <span className="chip border-ivory/20 text-ivory/55">Before</span>
            <p className="mt-3 font-body text-sm leading-relaxed text-ivory/75">
              <Mark text={NOVA_OLD} />
            </p>
          </div>
          <div className="panel p-5" style={{ borderColor: 'rgba(232,92,92,0.3)' }}>
            <span className="chip border-coral/40 text-coral-soft">After</span>
            <p className="mt-3 font-body text-sm leading-relaxed text-ivory/75">
              <Mark text={NOVA_NEW} />
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="chip border-coral/40 text-coral-soft">Privacy weakened</span>
          <span className="chip border-coral/40 text-coral-soft">Severity High</span>
          <span className="chip border-drift/40 text-drift-soft">Drift 84 of 100</span>
          <span className="chip border-coral/40 text-coral-soft">Negative impact</span>
          <Link to="/diff/doc_nova_privacy">
            <GlowButton variant="ghost" icon={GitCompareArrows}>
              Open Semantic Diff
            </GlowButton>
          </Link>
        </div>
      </Section>

      {/* built for */}
      <Section title="Built for" kicker="Wherever promises live">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUILT_FOR.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="panel flex items-center gap-3 p-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-juridical/30 bg-juridical/10 text-juridical">
                <b.icon size={17} />
              </span>
              <span className="font-grotesk text-sm text-ivory/75">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* genlayer */}
      <Section title="Powered by GenLayer" kicker="Verified semantic consensus">
        <div className="panel panel-glow flex flex-col items-start gap-6 p-7 md:flex-row md:items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-juridical/30 bg-juridical/10 text-juridical">
            <Network size={26} />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-2xl text-ivory">Semantic checks anchored on GenLayer</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/55">
              Each snapshot and impact report can be validated by GenLayer intelligent contracts, turning subjective
              meaning into verifiable consensus. This build runs in mock mode so it works fully standalone.
            </p>
          </div>
          <Link to="/api-docs">
            <GlowButton variant="cyan" icon={ArrowRight}>
              Read the API
            </GlowButton>
          </Link>
        </div>
      </Section>

      <footer className="border-t border-ink-edge/60 px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-lg text-ivory">TermsVault</span>
            <span className="text-xs text-ivory/40">Know when the meaning changes.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 font-grotesk text-xs text-ivory/45">
            <Link to="/dashboard" className="hover:text-gold">Observatory</Link>
            <Link to="/reports" className="hover:text-gold">Reports</Link>
            <Link to="/badge" className="hover:text-gold">Public Badge</Link>
            <Link to="/api-docs" className="hover:text-gold">API Docs</Link>
            <span>Verified by GenLayer</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ id, title, kicker, children }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="mb-8">
        {kicker ? <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">{kicker}</p> : null}
        <h2 className="mt-2 font-display text-3xl font-semibold text-ivory md:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}
