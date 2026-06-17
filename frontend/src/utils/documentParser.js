// Basic text normalization, preview generation, and a deterministic hash.

export function normalizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function previewText(text, limit = 280) {
  const norm = normalizeText(text)
  if (norm.length <= limit) return norm
  return norm.slice(0, limit).replace(/\s+\S*$/, '') + '...'
}

export function wordCount(text) {
  const norm = normalizeText(text)
  if (!norm) return 0
  return norm.split(/\s+/).filter(Boolean).length
}

export function splitSentences(text) {
  const norm = normalizeText(text)
  if (!norm) return []
  return norm
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Looks like a URL the user wants to register.
export function looksLikeUrl(value) {
  if (!value) return false
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(value.trim())
}

// Deterministic FNV-1a derived pseudo hash, presented as a 64 char hex string.
export function snapshotHash(text) {
  const input = normalizeText(text) || 'empty'
  let h1 = 0x811c9dc5
  let h2 = 0x1000193
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 ^= c
    h1 = Math.imul(h1, 0x01000193) >>> 0
    h2 = (Math.imul(h2 ^ c, 0x85ebca6b) + i) >>> 0
  }
  let out = ''
  let seed = (h1 ^ h2) >>> 0
  for (let i = 0; i < 64; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    out += ((seed >>> ((i % 7) * 3)) & 0xf).toString(16)
  }
  return '0x' + out
}
