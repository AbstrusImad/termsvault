// Snapshot routes: capturing an immutable, hashed version of a document.

import { Router } from "express";
import { createHash, randomUUID } from "node:crypto";
import { normalizeText } from "../services/normalizeText.js";
import { addSnapshot, getSnapshots, findSnapshot } from "../storage/store.js";

const router = Router();

// Compute the sha256 hex digest of the normalized text. This hash anchors the
// snapshot: the same meaningful content always yields the same hash, and any
// change to the content changes the hash.
function hashText(normalized) {
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

// POST /api/create-snapshot
// { projectName, category, importance, url?, text }
router.post("/create-snapshot", async (req, res) => {
  try {
    const { projectName, category, importance, url, text } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "A non empty 'text' field is required to create a snapshot.",
      });
    }
    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return res.status(400).json({
        error: "A 'projectName' string is required.",
      });
    }

    const normalized = normalizeText(text);
    const hash = hashText(normalized);

    const snapshot = {
      id: randomUUID(),
      projectName: projectName.trim(),
      category: typeof category === "string" && category.trim() ? category.trim() : "General",
      importance: typeof importance === "string" && importance.trim() ? importance.trim() : "Normal",
      url: typeof url === "string" && url.trim() ? url.trim() : null,
      hash,
      text,
      normalizedText: normalized,
      characters: normalized.length,
      createdAt: new Date().toISOString(),
    };

    await addSnapshot(snapshot);
    return res.status(201).json(snapshot);
  } catch (err) {
    console.error("[create-snapshot] error:", err.message);
    return res.status(500).json({ error: "Failed to create the snapshot." });
  }
});

// GET /api/snapshots  -> list all snapshots (handy for the dashboard).
router.get("/snapshots", async (_req, res) => {
  try {
    const snapshots = await getSnapshots();
    return res.json({ count: snapshots.length, snapshots });
  } catch (err) {
    console.error("[snapshots] error:", err.message);
    return res.status(500).json({ error: "Failed to read snapshots." });
  }
});

// GET /api/snapshots/:id -> one snapshot, 404 if missing.
router.get("/snapshots/:id", async (req, res) => {
  try {
    const snapshot = await findSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: "Snapshot not found." });
    }
    return res.json(snapshot);
  } catch (err) {
    console.error("[snapshots/:id] error:", err.message);
    return res.status(500).json({ error: "Failed to read the snapshot." });
  }
});

export default router;
