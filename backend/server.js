// TermsVault backend server.
//
// A semantic notary API. It stores snapshots of documents (Terms of Service,
// Privacy Policies, Pricing, Roadmaps, public promises), compares versions and
// produces semantic impact reports. Tagline: "Know when the meaning changes."
//
// The server uses ES modules and the Node 18+ global fetch. No build step.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import cors from "cors";

import documentsRouter from "./routes/documents.js";
import snapshotsRouter from "./routes/snapshots.js";
import analysisRouter from "./routes/analysis.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader so the project has no extra dependency on dotenv.
// Reads KEY=VALUE lines and only sets variables that are not already defined.
async function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  if (!existsSync(envPath)) return;
  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.warn("[env] could not read .env:", err.message);
  }
}

function buildCorsOptions() {
  const fromEnv = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaults = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  const allowed = new Set(fromEnv.length ? fromEnv : defaults);

  return {
    origin(origin, callback) {
      // Allow same origin / non browser tools (no origin header) and any
      // explicitly allowed local dev origin.
      if (!origin || allowed.has(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  };
}

async function main() {
  await loadEnv();

  const app = express();
  const PORT = Number(process.env.PORT) || 8787;

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "4mb" }));

  // Health check.
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      mockMode: String(process.env.MOCK_MODE || "true") !== "false",
      time: new Date().toISOString(),
    });
  });

  // Feature routes are mounted under /api.
  app.use("/api", documentsRouter);
  app.use("/api", snapshotsRouter);
  app.use("/api", analysisRouter);

  // Root info.
  app.get("/", (_req, res) => {
    res.json({
      name: "TermsVault API",
      tagline: "Know when the meaning changes.",
      health: "/api/health",
    });
  });

  // 404 for unknown routes.
  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // Centralized error handler so a thrown error never crashes the process.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("[server] unhandled error:", err?.message || err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error." });
  });

  const server = app.listen(PORT, () => {
    console.log(`TermsVault API listening on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
  });

  // Keep the process alive on unexpected errors instead of crashing.
  process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandled rejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[server] uncaught exception:", err?.message || err);
  });

  return server;
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exitCode = 1;
});
