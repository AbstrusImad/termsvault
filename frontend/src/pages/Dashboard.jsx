import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Plus,
  FileText,
} from 'lucide-react'
import { useVault } from '../store/VaultContext'
import StatCard from '../components/ui/StatCard'
import ChartCard from '../components/ui/ChartCard'
import ObservatoryMap from '../components/dashboard/ObservatoryMap'
import DocumentCard from '../components/documents/DocumentCard'
import Timeline from '../components/ui/Timeline'
import EmptyState from '../components/ui/EmptyState'
import GlowButton from '../components/ui/GlowButton'
import { summarizeDocuments, severityByCategory, severityColor, statusForDocument, STATUS_META } from '../utils/riskScoring'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

const FILTERS = ['All', 'stable', 'minor', 'medium', 'high', 'consent']
const SEVS = ['Stable', 'Minor', 'Medium', 'High', 'Critical']

export default function Dashboard() {
  const { documents, reports } = useVault()
  const [filter, setFilter] = useState('All')

  const stats = useMemo(() => summarizeDocuments(documents), [documents])
  const chartData = useMemo(() => severityByCategory(documents), [documents])

  const filtered = useMemo(() => {
    if (filter === 'All') return documents
    return documents.filter((d) => statusForDocument(d) === filter)
  }, [documents, filter])

  const timeline = useMemo(() => {
    const items = documents
      .filter((d) => d.history && d.history.length)
      .map((d) => {
        const an = d.history[d.history.length - 1]
        const meta = STATUS_META[statusForDocument(d)]
        return {
          id: d.id,
          title: d.project + ' / ' + d.name,
          tag: an.severity,
          color: meta.color,
          description: an.changeType + '. ' + an.summary.slice(0, 90),
          createdAt: an.createdAt,
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return items.slice(0, 6)
  }, [documents])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-grotesk text-xs uppercase tracking-[0.25em] text-gold/70">Semantic Observatory</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ivory">Watch the meaning</h1>
        </div>
        <Link to="/add">
          <GlowButton variant="gold" icon={Plus}>
            Add Document
          </GlowButton>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Watched documents" value={stats.watched} accent="#c8a45b" index={0} />
        <StatCard icon={Activity} label="Changes detected" value={stats.changes} accent="#e0a04b" index={1} />
        <StatCard icon={ShieldAlert} label="High-risk changes" value={stats.highRisk} accent="#e85c5c" index={2} />
        <StatCard icon={CheckCircle2} label="Stable documents" value={stats.stable} accent="#3fd6b0" index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ObservatoryMap documents={documents} />

        <ChartCard title="Severity by category" subtitle="Distribution across watched documents">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2233" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: '#8a8678', fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#8a8678', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#11141f',
                    border: '1px solid #1d2233',
                    borderRadius: 12,
                    color: '#f4efe3',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(200,164,91,0.06)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8a8678' }} />
                {SEVS.map((s) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={severityColor(s)} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-ivory/40">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-grotesk text-base font-semibold text-ivory">Watched documents</h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    'rounded-lg px-3 py-1.5 font-grotesk text-xs capitalize transition ' +
                    (filter === f
                      ? 'bg-gold/15 text-gold-soft'
                      : 'border border-ink-edge text-ivory/50 hover:text-ivory')
                  }
                >
                  {f === 'All' ? 'All' : STATUS_META[f] ? STATUS_META[f].label : f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((doc, i) => (
                <DocumentCard key={doc.id} doc={doc} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No documents in this filter"
              message="Adjust the filter or add a new document to start watching its meaning."
              action={
                <Link to="/add">
                  <GlowButton variant="gold" icon={Plus}>
                    Add Document
                  </GlowButton>
                </Link>
              }
            />
          )}
        </div>

        <ChartCard title="Activity timeline" subtitle="Latest semantic analyses">
          <Timeline items={timeline} />
        </ChartCard>
      </div>
    </div>
  )
}
