// Scans source for emoji characters and the em dash (U+2014).
// Fails the process if any are found so the source stays clean.
const fs = require('fs')
const path = require('path')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u
const EM_DASH = /\u2014/
const SKIP = new Set(['node_modules', 'dist', '.git', '.vite'])
const EXT = /\.(jsx?|tsx?|css|html|md|json)$/

const root = path.resolve(__dirname, '..')
const emojiHits = []
const dashHits = []

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const fp = path.join(dir, name)
    const stat = fs.statSync(fp)
    if (stat.isDirectory()) {
      walk(fp)
    } else if (EXT.test(name)) {
      const text = fs.readFileSync(fp, 'utf8')
      if (EMOJI.test(text)) emojiHits.push(fp)
      if (EM_DASH.test(text)) dashHits.push(fp)
    }
  }
}

walk(root)

let failed = false
if (emojiHits.length) {
  console.error('EMOJIS FOUND:\n' + emojiHits.join('\n'))
  failed = true
}
if (dashHits.length) {
  console.error('EM DASH (U+2014) FOUND:\n' + dashHits.join('\n'))
  failed = true
}
if (failed) process.exit(1)
console.log('Clean: no emojis and no em dash characters.')
