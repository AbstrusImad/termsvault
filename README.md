# TermsVault

Know when the meaning changes.

TermsVault is a semantic notary for the agreements that govern digital life:
Terms of Service, Privacy Policies, Pricing pages, Roadmaps, Whitepapers, and the
public promises companies make. You register a URL or paste document text,
TermsVault stores immutable snapshots, and when a new version appears it compares
the new meaning against the old one and produces a semantic impact report.

Most monitoring tools tell you that bytes changed. TermsVault tells you whether
the meaning changed, how severe the change is, who it affects, and whether your
consent should have been asked for. It is built to show how GenLayer can protect
not just data, but the meaning of human agreements.

## Live

- App: https://termsvault.pages.dev/
- Contract (GenLayer Bradbury Testnet): `0x91Dd4ac432159bf7CC945278A51bC43cF72eDB44`
- Explorer: https://explorer-bradbury.genlayer.com/address/0x91Dd4ac432159bf7CC945278A51bC43cF72eDB44
- Deploy transaction: `0x3ed696133095debea6fbeb262360cafa9a4fe7dc9233f1b50aa08a32f9450c5d`
- Repository: https://github.com/AbstrusImad/termsvault
- Faucet (test GEN): https://testnet-faucet.genlayer.foundation/

TermsVault runs live on GenLayer Bradbury. The deployable Intelligent Contract is
`genlayer/contract.py`, and the analyze action is a real on-chain consensus write:
validators agree on the categorical verdict exactly and the numeric drift and
confidence within tolerance. Connect a wallet on Bradbury and claim test GEN from
the faucet to run a real analysis. Demo data is still seeded so the workspace
looks full, and a mock mode remains available in Settings as an offline fallback.

## The problem

Companies quietly rewrite the documents that define your rights. A privacy policy
that once said "we never use your data to train AI" becomes "we may use your data
to improve our AI systems and selected partner integrations." The words look
similar. The meaning is the opposite. Today these shifts are caught by chance, by
a journalist, or never. There is no neutral, verifiable record of when the
meaning of an agreement changed.

TermsVault creates that record. It captures versions, scores the semantic drift
between them, classifies the kind of change, and can anchor the verdict on
GenLayer so the judgement itself is tamper evident.

## Design direction: the Semantic Archive

The interface is designed as a Semantic Archive: a calm, document first space
that feels like a library and a laboratory at once. Snapshots are treated like
preserved manuscripts, diffs are presented as a Meaning Rift between two versions,
and verified reports become audit certificates. The visual language favors
restraint: generous spacing, clear typographic hierarchy, subtle motion that
reveals structure rather than decorating it, and charts that make drift and
severity legible at a glance.

## Features

- Register documents by public URL or by pasting text.
- Immutable, hashed snapshots of every version (sha256 of normalized text).
- Semantic diff between any two versions, not a line by line text diff but a
  meaning level comparison.
- A semantic impact report with change type, severity, a 0 to 100 semantic drift
  score, user impact, a consent required flag, a confidence score, an
  explanation of the old and new meaning, recommendations, and detected signals.
- A deterministic rule based analysis engine that runs offline and is structured
  to be replaced by a real GenLayer consensus call.
- Public, embeddable badges that present a verified verdict.
- A semantic audit trail of all reports.

## The application

TermsVault is a real multi page application:

- Home: the pitch, the tagline, and a path into the demo.
- Dashboard, the Semantic Observatory: tracked documents, recent drift, and the
  health of your archive at a glance.
- Add Document: register a URL or paste text, choose category and importance, and
  capture the first snapshot.
- Document Detail: the version history of a single document and its snapshots.
- Semantic Diff, the Meaning Rift: a side by side comparison of two versions with
  the impact report and drift visualization.
- Reports, the semantic audit certificates: the full list of notarized verdicts.
- Public Badge: the shareable, embeddable proof for a single report.
- Settings: preferences and integration configuration.
- API Docs: the backend endpoints and shapes, in context.

## Tech stack

Frontend:

- React with Vite
- Tailwind CSS
- Framer Motion for motion
- lucide-react for icons
- recharts for drift and severity visualizations
- react-router-dom for routing

Backend:

- Node.js with Express, using native ES modules and the Node 18+ global fetch
- A simple JSON file store for snapshots and reports

Storage and integration:

- localStorage for the frontend MVP state
- A JSON file store on the backend
- A mock GenLayer client prepared for real integration, plus the conceptual
  Intelligent Contract in `genlayer/`

## Install and run

### Frontend

```
cd frontend
npm install
npm run dev
```

Vite serves the app on `http://localhost:5173` by default. To build for
production:

```
cd frontend
npm run build
```

### Backend

```
cd backend
npm install
npm start
```

The API listens on `http://localhost:8787` by default. Copy `backend/.env.example`
to `backend/.env` to change the port, CORS origins, mock mode, or fetch limits.
Confirm it is running with:

```
curl http://localhost:8787/api/health
```

which returns `{ "status": "ok", "mockMode": true, "time": ... }`.

## How the mock semantic analysis works

The analysis lives in `backend/services/semanticAnalysis.js` and exposes
`analyzeSemanticChange(oldText, newText)`. It is a deterministic, rule based
engine: identical inputs always yield an identical report, which is what an audit
trail and validator consensus both require.

The engine starts from the textual divergence between the two versions (a token
level similarity), then adds drift for semantic signals: a weakened commitment
(restrictive wording such as "do not" or "only" replaced by discretionary wording
such as "may" or "improve our AI"), discretionary language ("may use", "reserve
the right", "at our discretion"), newly introduced AI training language, data
sharing with partners or third parties, and pricing or ownership changes.
Severity is mapped from the final drift, with a floor for weakened privacy
promises. Consent is required for privacy or ownership changes and for high or
critical severity.

The function returns exactly this shape:

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

## How the GenLayer integration is prepared

TermsVault is designed so the mock analysis can be swapped for real GenLayer
consensus without changing the report shape:

- On the backend, `services/semanticAnalysis.js` contains a clearly commented
  seam, `analyzeWithGenLayer`, that would call an Intelligent Contract method and
  return the same structured report. Until a client is connected, the
  deterministic engine is the source of truth and mock mode stays on.
- On the frontend, a mock GenLayer client under `src/genlayer/` provides the same
  interface a real client would, so pages do not need to change when the real
  integration lands.
- The conceptual contract lives in `genlayer/semantic_contract.py`, a documented
  `gl.Contract` modeling snapshots, reports, `create_snapshot`, `analyze_diff`,
  `register_report`, `get_report`, and the helpers `calculate_semantic_drift` and
  `classify_change_type`. Its consensus model agrees on categorical fields
  exactly and on the numeric drift within a tolerance, never by byte equality on
  raw model output. See `genlayer/README.md` for the full design and the path to
  a real deployment.

## Using the demo

1. Start the backend and the frontend as described above.
2. Open the app, go to Add Document, and register a document or paste text.
3. Capture a first snapshot, then capture a second snapshot with revised text.
4. Open the Semantic Diff to see the Meaning Rift and the impact report.

### The NovaAI demo case

The reference case is a fictional AI company, NovaAI, weakening its privacy
promise.

Old version:

```
We do not use user prompts or uploaded files to train AI models.
User data is only processed to provide the service.
```

New version:

```
We may use anonymized prompts, uploaded files and interaction data to improve
our AI systems, safety models and selected partner integrations.
```

TermsVault classifies this as Privacy weakened, High severity, with a semantic
drift score near 84, a Negative user impact, and consent required set to true. It
flags the weakened commitment, the new discretionary language, the introduction
of AI training, and the data sharing with partners.

You can reproduce the backend result directly:

```
curl -X POST http://localhost:8787/api/analyze-diff \
  -H "Content-Type: application/json" \
  -d "{\"oldText\":\"We do not use user prompts or uploaded files to train AI models. User data is only processed to provide the service.\",\"newText\":\"We may use anonymized prompts, uploaded files and interaction data to improve our AI systems, safety models and selected partner integrations.\"}"
```

## Project structure

```
termsvault/
  README.md                      this file
  frontend/                      React + Vite app (owned separately)
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    src/
      App.jsx, main.jsx, index.css
      components/                shared UI
      pages/                     Home, Dashboard, Add, Detail, Diff, Reports, Badge, Settings, API Docs
      store/                     localStorage state
      genlayer/                  mock GenLayer client seam
      data/                      demo data including the NovaAI case
      utils/
  backend/                       Node.js + Express API
    server.js                    app, CORS, env loader, health
    routes/
      documents.js               POST /api/fetch-document
      snapshots.js               POST /api/create-snapshot, GET /api/snapshots
      analysis.js                POST /api/analyze-diff, GET /api/reports, badge
    services/
      fetchDocument.js           safe public fetch and basic HTML to text extractor
      normalizeText.js           normalization and similarity helpers
      semanticAnalysis.js        deterministic semantic impact engine + GenLayer seam
    storage/
      store.js                   safe JSON read/write
      snapshots.json             JSON data store (seeded empty)
    .env.example
    package.json
    README.md
  genlayer/                      conceptual Intelligent Contract
    semantic_contract.py
    README.md
```

## Next steps toward production

- Connect a real GenLayer client and replace the mock semantic analysis through
  the prepared seam, keeping the report shape stable.
- Deploy the Intelligent Contract to a GenLayer network and anchor reports on
  chain, with the snapshot hash binding each report to exact content.
- Move storage from the JSON file and localStorage to a managed database, with
  per user accounts and access control on the API.
- Add scheduled monitoring so tracked URLs are re-snapshotted automatically and
  users are alerted when the meaning drifts.
- Harden the fetcher with stricter network policy, content type handling, and
  rate limiting.
- Expand the analysis with multilingual support and domain specific vocabularies
  for finance, healthcare, and gaming agreements.
