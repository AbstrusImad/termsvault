// Safe public document fetcher and basic text extractor.
//
// Safety rules enforced here:
//  - only http and https URLs are allowed
//  - a hard request timeout (default 8s)
//  - a maximum response size (default ~2MB) so a huge page cannot exhaust memory
//  - a normal browser style User-Agent
//  - redirects are followed by fetch but capped by the platform; we do not chase
//    infinite redirect chains and we never retry aggressively
//  - we do not attempt to bypass paywalls or logins
//
// On any failure the caller receives a clear message telling the user to paste
// the document text manually. This module never throws to the route; it returns
// a result object instead.

const DEFAULT_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS) || 8000;
const DEFAULT_MAX_BYTES = Number(process.env.FETCH_MAX_BYTES) || 2_000_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; TermsVaultBot/1.0; +https://termsvault.local) semantic-notary";

// Validate that the URL is a public http or https address.
export function validatePublicUrl(input) {
  let url;
  try {
    url = new URL(String(input));
  } catch {
    return { ok: false, error: "The URL is not valid. Please paste the document text manually." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are supported. Please paste the text manually." };
  }

  const host = url.hostname.toLowerCase();

  // Block obvious private, local and metadata hosts to avoid SSRF style fetches.
  const blockedExact = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"];
  if (blockedExact.includes(host)) {
    return { ok: false, error: "Local and private addresses are not allowed. Please paste the text manually." };
  }

  const isPrivateIp =
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local");
  if (isPrivateIp) {
    return { ok: false, error: "Local and private addresses are not allowed. Please paste the text manually." };
  }

  return { ok: true, url };
}

// Strip HTML to readable text using a basic, dependency free extractor.
// This is intentionally simple: remove script/style/noscript blocks, drop all
// remaining tags, decode a handful of common entities and collapse whitespace.
export function extractText(html) {
  if (typeof html !== "string" || !html) return "";

  let text = html;

  // Remove script, style, noscript, template, svg blocks entirely.
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  text = text.replace(/<template[\s\S]*?<\/template>/gi, " ");
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Turn block level closers into line breaks so words do not run together.
  text = text.replace(/<\/(p|div|section|article|li|ul|ol|h[1-6]|br|tr|table)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Drop all remaining tags.
  text = text.replace(/<[^>]+>/g, " ");

  // Decode the most common HTML entities.
  const entities = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&mdash;": "-",
    "&ndash;": "-",
    "&hellip;": "...",
  };
  for (const [ent, val] of Object.entries(entities)) {
    text = text.split(ent).join(val);
  }
  // Numeric entities.
  text = text.replace(/&#(\d+);/g, (_, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCodePoint(n) : " ";
  });

  // Collapse whitespace while keeping single newlines between blocks.
  text = text.replace(/[ \t\f\v]+/g, " ");
  text = text.replace(/\s*\n\s*/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// Read a fetch Response body up to maxBytes, then stop. Returns the decoded
// string. Prevents unbounded memory use on very large pages.
async function readLimited(response, maxBytes) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    // Fallback: no stream reader available, read text directly.
    const full = await response.text();
    return full.length > maxBytes ? full.slice(0, maxBytes) : full;
  }
  const decoder = new TextDecoder("utf-8");
  let received = 0;
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      break;
    }
  }
  out += decoder.decode();
  return out;
}

// Fetch a public document and return extracted text.
// Returns { ok: true, text, url, bytes, truncated } or { ok: false, error }.
export async function fetchDocument(rawUrl, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;

  const validation = validatePublicUrl(rawUrl);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }
  const { url } = validation;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en;q=0.9",
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `The page responded with status ${response.status}. Please paste the document text manually.`,
      };
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const isTextLike =
      contentType.includes("text/html") ||
      contentType.includes("text/plain") ||
      contentType.includes("application/xhtml") ||
      contentType.includes("application/xml") ||
      contentType === "";
    if (!isTextLike) {
      return {
        ok: false,
        error: `The URL returned content of type "${contentType || "unknown"}" which cannot be read as text. Please paste the document text manually.`,
      };
    }

    const body = await readLimited(response, maxBytes);
    const truncated = body.length >= maxBytes;

    const isHtml = contentType.includes("html") || /<html|<body|<div|<p[ >]/i.test(body);
    const text = isHtml ? extractText(body) : body.replace(/\s+/g, " ").trim();

    if (!text) {
      return {
        ok: false,
        error: "No readable text could be extracted from the page. Please paste the document text manually.",
      };
    }

    return {
      ok: true,
      url: url.toString(),
      text,
      bytes: body.length,
      truncated,
    };
  } catch (err) {
    const reason =
      err?.name === "AbortError"
        ? `The request timed out after ${timeoutMs} ms.`
        : "The page could not be fetched.";
    return {
      ok: false,
      error: `${reason} Please paste the document text manually.`,
    };
  } finally {
    clearTimeout(timer);
  }
}
