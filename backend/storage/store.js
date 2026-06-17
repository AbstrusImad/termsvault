// Simple JSON file store with safe read/write.
// The store never throws on a missing or empty file: it falls back to an
// empty structure and lazily recreates the file on the next successful write.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = resolve(__dirname, "snapshots.json");

const EMPTY_STATE = { snapshots: [], reports: [] };

// In flight write serialization so concurrent requests cannot corrupt the file.
let writeChain = Promise.resolve();

function cloneEmpty() {
  return { snapshots: [], reports: [] };
}

// Read the whole store. Returns a normalized object even if the file is
// missing, empty, or contains malformed JSON.
export async function readStore() {
  try {
    if (!existsSync(STORE_PATH)) {
      return cloneEmpty();
    }
    const raw = await readFile(STORE_PATH, "utf8");
    if (!raw || !raw.trim()) {
      return cloneEmpty();
    }
    const parsed = JSON.parse(raw);
    return {
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    };
  } catch (err) {
    // Corrupted file: do not crash, fall back to an empty state.
    console.error("[store] read failed, using empty state:", err.message);
    return cloneEmpty();
  }
}

// Persist the store atomically enough for a single process dev server.
// Writes are serialized through a promise chain.
export async function writeStore(state) {
  const safeState = {
    snapshots: Array.isArray(state?.snapshots) ? state.snapshots : [],
    reports: Array.isArray(state?.reports) ? state.reports : [],
  };

  writeChain = writeChain.then(async () => {
    try {
      await mkdir(dirname(STORE_PATH), { recursive: true });
      const tmp = `${STORE_PATH}.tmp`;
      await writeFile(tmp, JSON.stringify(safeState, null, 2), "utf8");
      await writeFile(STORE_PATH, JSON.stringify(safeState, null, 2), "utf8");
      // Best effort cleanup of the temp file.
      try {
        const { unlink } = await import("node:fs/promises");
        await unlink(tmp);
      } catch {
        // ignore temp cleanup errors
      }
    } catch (err) {
      console.error("[store] write failed:", err.message);
      throw err;
    }
  });

  return writeChain;
}

// Convenience helpers used by the routes.

export async function getSnapshots() {
  const state = await readStore();
  return state.snapshots;
}

export async function getReports() {
  const state = await readStore();
  return state.reports;
}

export async function findSnapshot(id) {
  const state = await readStore();
  return state.snapshots.find((s) => s.id === id) || null;
}

export async function findReport(id) {
  const state = await readStore();
  return state.reports.find((r) => r.id === id) || null;
}

export async function addSnapshot(snapshot) {
  const state = await readStore();
  state.snapshots.push(snapshot);
  await writeStore(state);
  return snapshot;
}

export async function addReport(report) {
  const state = await readStore();
  state.reports.push(report);
  await writeStore(state);
  return report;
}

export { EMPTY_STATE, STORE_PATH };
