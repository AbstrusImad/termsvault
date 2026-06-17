import { motion } from 'framer-motion'
import { ScrollText, ArrowUpRight } from 'lucide-react'
import SeverityBadge from '../ui/SeverityBadge'
import { ImpactBadge } from '../ui/RiskBadge'
import { shortHash, formatDate } from '../../utils/formatters'

export default function ReportCard({ report, index = 0, onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(report)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="panel group block w-full overflow-hidden p-5 text-left transition hover:border-gold/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <ScrollText size={18} />
          </span>
          <div>
            <p className="font-grotesk text-sm font-semibold text-ivory">{report.title}</p>
            <p className="text-xs text-ivory/45">
              {report.project} / {report.category}
            </p>
          </div>
        </div>
        <ArrowUpRight size={16} className="text-ivory/30 transition group-hover:text-gold" />
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-ivory/60">{report.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SeverityBadge severity={report.severity} size="sm" />
        <ImpactBadge impact={report.userImpact} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-edge pt-3">
        <span className="engraved font-mono text-[11px]">{shortHash(report.snapshotHash)}</span>
        <span className="text-[11px] text-ivory/40">{formatDate(report.createdAt)}</span>
      </div>
    </motion.button>
  )
}
