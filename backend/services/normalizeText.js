// Text normalization helpers.
//
// Normalization makes snapshot hashing stable and gives the semantic engine a
// consistent surface to reason over. The goal is to remove cosmetic noise
// (extra whitespace, fancy quotes, invisible characters) without changing the
// meaning of the document.

// Map of typographic characters to their plain ASCII equivalents.
const QUOTE_MAP = {
  "\u2018": "'", // left single quote
  "\u2019": "'", // right single quote
  "\u201A": "'", // single low quote
  "\u201B": "'", // single high reversed quote
  "\u201C": '"', // left double quote
  "\u201D": '"', // right double quote
  "\u201E": '"', // double low quote
  "\u00AB": '"', // left guillemet
  "\u00BB": '"', // right guillemet
  "\u2013": "-", // en dash
  "\u2014": "-", // em dash
  "\u2026": "...", // ellipsis
};

// Normalize quotes, dashes and ellipsis to plain ASCII.
export function normalizeQuotes(input) {
  if (typeof input !== "string") return "";
  let out = input;
  for (const [from, to] of Object.entries(QUOTE_MAP)) {
    out = out.split(from).join(to);
  }
  return out;
}

// Collapse all runs of whitespace (including newlines and tabs) into a single
// space and trim the ends.
export function collapseWhitespace(input) {
  if (typeof input !== "string") return "";
  return input.replace(/\s+/g, " ").trim();
}

// Full normalization used for hashing and analysis.
// Steps: strip zero width characters, normalize unicode, normalize quotes,
// collapse whitespace, trim.
export function normalizeText(input) {
  if (typeof input !== "string") return "";
  let out = input;
  // Remove zero width and BOM style characters.
  out = out.replace(/[\u200B-\u200D\uFEFF]/g, "");
  // Canonical unicode form so visually identical strings compare equal.
  try {
    out = out.normalize("NFKC");
  } catch {
    // normalize is always available on modern Node, but stay safe.
  }
  out = normalizeQuotes(out);
  out = collapseWhitespace(out);
  return out;
}

// Lowercase comparison helper. Used by the semantic engine for case
// insensitive signal detection.
export function toComparable(input) {
  return normalizeText(input).toLowerCase();
}

// Tokenize into lowercase word tokens for overlap and drift math.
export function tokenize(input) {
  const comparable = toComparable(input);
  if (!comparable) return [];
  return comparable
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Build a set of unique tokens.
export function tokenSet(input) {
  return new Set(tokenize(input));
}

// Jaccard similarity between two texts in the range 0..1.
// Returns 1 for two empty inputs (no change).
export function jaccardSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const tok of setA) {
    if (setB.has(tok)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  if (union === 0) return 1;
  return intersection / union;
}
