# TermsVault Frontend

Semantic trust infrastructure. Know when the meaning changes.

A React + Vite single page app that works fully standalone in mock mode using
localStorage. No backend is required at runtime, so it can be deployed as a
static site.

## Stack

- React 18 + Vite 5
- Tailwind CSS, Framer Motion, lucide-react
- recharts for charts
- react-router-dom for routing

## Scripts

```
npm install      install dependencies
npm run dev      start the dev server
npm run build    produce a static build in dist/
npm run preview  preview the production build
npm run check:emoji  scan source for emoji and em dash characters
```

## Art direction

"Semantic Archive UI". A futuristic secret archive and semantic laboratory.
Palette of deep ink, digital ivory, old gold, juridical cyan-green, coral risk
red and deep purple drift. All visuals are procedural CSS, SVG and Canvas.

## Routes

`/` landing, `/dashboard` observatory, `/add` add document, `/document/:id`
detail, `/diff/:id` semantic diff, `/reports`, `/badge`, `/settings`,
`/api-docs`.

## Mock GenLayer

The GenLayer client lives in `src/genlayer/`. In mock mode it simulates latency
and returns mock hashes and status. The seam for a real integration is commented
in `genlayerClient.js`.

## Persistence

State is stored under a single namespaced localStorage key. Demo data is seeded
on first run and can be cleared from Settings.
