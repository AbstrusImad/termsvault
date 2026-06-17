// Formatting helpers for dates, addresses, and hashes.

export function formatDate(value) {
  if (!value) return 'Unknown'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function formatDateTime(value) {
  if (!value) return 'Unknown'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(value) {
  if (!value) return 'never'
  const d = new Date(value).getTime()
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + 'd ago'
  const months = Math.floor(days / 30)
  if (months < 12) return months + 'mo ago'
  return Math.floor(months / 12) + 'y ago'
}

export function shortAddress(addr) {
  if (!addr) return ''
  if (addr.length <= 12) return addr
  return addr.slice(0, 5) + '...' + addr.slice(-4)
}

export function shortHash(hash, head = 10, tail = 6) {
  if (!hash) return ''
  if (hash.length <= head + tail + 3) return hash
  return hash.slice(0, head) + '...' + hash.slice(-tail)
}

export function clampNumber(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function pluralize(count, word) {
  return count + ' ' + word + (count === 1 ? '' : 's')
}
