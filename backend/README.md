# TermsVault Backend

The TermsVault backend is a small, modular Node.js and Express API that powers a
semantic notary. It stores snapshots of documents (Terms of Service, Privacy
Policies, Pricing, Roadmaps, Whitepapers, public promises), compares versions,
and produces a semantic impact report. Tagline: "Know when the meaning changes."

## Requirements

- Node.js 18 or newer (uses the global `fetch`).
- No build step. The project uses native ES modules.

## Install and run

```
cd backend
npm install
npm start
```

The server listens on `PORT` (default `8787`). For auto reload during
development you can use `npm run dev` (nodemon is included as a dev dependency).

Copy `.env.example` to `.env` to customize the port, CORS origins, mock mode,
and fetch limits. The server includes a tiny built in `.env` loader, so no extra
dependency is required.

## Endpoints

All endpoints return JSON and use appropriate status codes.

- `GET /api/health` returns `{ status: "ok", mockMode: true, time }`.
- `POST /api/fetch-document` body `{ url }`. Fetches a public http/https URL and
  extracts readable text with a basic, dependency free extractor. It enforces a
  request timeout, a maximum response size, a normal User-Agent, and blocks
  local and private addresses. On any failure it returns a clear message asking
  the client to paste the text manually. It never crashes the server.
- `POST /api/create-snapshot` body `{ projectName, category, importance, url?, text }`.
  Normalizes the text, computes a `sha256` hash of the normalized content, stores
  the snapshot in `storage/snapshots.json`, and returns the snapshot.
- `POST /api/analyze-diff` body `{ oldText, newText }` or `{ oldSnapshotId, newSnapshotId }`.
  Runs the semantic analysis engine and stores and returns the report.
- `GET /api/reports` lists stored reports (newest first).
- `GET /api/reports/:id` returns one report, `404` if missing.
- `GET /api/badge/:id` returns mock public badge metadata for a report.
- `GET /api/snapshots` and `GET /api/snapshots/:id` are provided for convenience.

## Semantic analysis

`services/semanticAnalysis.js` implements `analyzeSemanticChange(oldText, newText)`,
a deterministic, rule based engine. The same inputs always produce the same
report, which matters for an audit trail. It returns this exact shape:

```
{
  changeType,            // Privacy weakened | Pricing change | Ownership change | Scope expanded | Stable | Minor wording
  severity,              // Stable | Minor | Medium | High | Critical
  semanticDriftScore,    // integer 0..100
  userImpact,            // Positive | Neutral | Negative
  consentRequired,       // boolean
  confidence,            // integer 0..100
  summary,               // human readable summary
  oldMeaning,            // description of the old stance
  newMeaning,            // description of the new stance
  recommendations,       // array of strings
  detectedSignals        // array of strings
}
```

### How scoring works

Drift starts from the textual divergence between the two versions (a token level
similarity) and then adds points for semantic signals: a weakened commitment
(restrictive wording replaced by discretionary wording), discretionary language
("may use", "reserve the right", "at our discretion"), newly introduced AI
training language, data sharing with partners or third parties, and pricing or
ownership changes. Severity is mapped from the final drift, with a floor for
weakened privacy promises. Consent is required for privacy or ownership changes
and for high or critical severity.

### GenLayer seam

The service is structured so a real GenLayer call can replace the rule based
path without changing the response shape. See the clearly commented
`analyzeWithGenLayer` seam in `services/semanticAnalysis.js`. When connected, the
categorical fields would be agreed by validators exactly and the numeric drift
within a tolerance, never by byte equality on raw LLM output.

## Storage

`storage/snapshots.json` is a simple JSON store holding `snapshots` and
`reports`. `storage/store.js` reads and writes it safely: it creates the file if
missing, tolerates an empty or malformed file without throwing, and serializes
writes so concurrent requests cannot corrupt the data.

## Project layout

```
backend/
  server.js                  Express app, CORS, env loader, health route
  routes/
    documents.js             POST /api/fetch-document
    snapshots.js             POST /api/create-snapshot, GET /api/snapshots
    analysis.js              POST /api/analyze-diff, GET /api/reports, badge
  services/
    fetchDocument.js         safe public fetch + basic HTML to text extractor
    normalizeText.js         normalization and similarity helpers
    semanticAnalysis.js      deterministic semantic impact engine + GenLayer seam
  storage/
    store.js                 safe JSON read/write helpers
    snapshots.json           the JSON data store (seeded empty)
  .env.example
  package.json
  README.md
```

## Notes

- Mock mode is on by default. The semantic engine is fully deterministic.
- The fetcher is intentionally conservative. It does not bypass paywalls or
  logins and does not perform aggressive scraping.
