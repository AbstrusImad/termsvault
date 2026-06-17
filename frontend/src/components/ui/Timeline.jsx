import { formatDateTime } from '../../utils/formatters'

// Archival ribbon timeline.
export default function Timeline({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-ivory/40">No activity recorded yet.</p>
  }
  return (
    <ol className="relative ml-3 border-l border-ink-edge">
      {items.map((item, i) => (
        <li key={item.id || i} className="relative mb-6 pl-6 last:mb-0">
          <span
            className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-ink-deep"
            style={{ backgroundColor: item.color || '#c8a45b', boxShadow: '0 0 10px ' + (item.color || '#c8a45b') }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-grotesk text-sm font-medium text-ivory">{item.title}</p>
            {item.tag ? (
              <span className="chip text-[10px]" style={{ color: item.color, borderColor: (item.color || '#c8a45b') + '55' }}>
                {item.tag}
              </span>
            ) : null}
          </div>
          {item.description ? <p className="mt-1 text-xs text-ivory/50">{item.description}</p> : null}
          <p className="mt-1 font-mono text-[11px] text-ivory/35">{formatDateTime(item.createdAt)}</p>
        </li>
      ))}
    </ol>
  )
}
