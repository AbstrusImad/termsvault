import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ArrowUpRight, Clock } from 'lucide-react'
import SeverityBadge from '../ui/SeverityBadge'
import { ChangeTypeBadge } from '../ui/RiskBadge'
import { timeAgo } from '../../utils/formatters'
import { statusForDocument, STATUS_META } from '../../utils/riskScoring'

export default function DocumentCard({ doc, index = 0 }) {
  const status = statusForDocument(doc)
  const meta = STATUS_META[status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -3 }}
    >
      <Link
        to={'/document/' + doc.id}
        className="panel group block overflow-hidden p-4 transition hover:border-gold/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{ borderColor: meta.color + '55', color: meta.color, backgroundColor: meta.color + '12' }}
            >
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-grotesk text-sm font-semibold text-ivory">{doc.name}</p>
              <p className="truncate text-xs text-ivory/45">{doc.project}</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-ivory/30 transition group-hover:text-gold" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={doc.severity} size="sm" />
          <ChangeTypeBadge changeType={doc.changeType} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-edge pt-3 text-xs text-ivory/40">
          <span className="chip border-ink-edge text-ivory/45">{doc.category}</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(doc.lastAnalysis)}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
