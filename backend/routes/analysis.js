// Analysis routes: running semantic diffs and serving stored reports.

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { analyzeSemanticChange } from "../services/semanticAnalysis.js";
import { addReport, getReports, findReport, findSnapshot } from "../storage/store.js";

const router = Router();

// POST /api/analyze-diff
// Accepts either { oldText, newText } or { oldSnapshotId, newSnapshotId }.
router.post("/analyze-diff", async (req, res) => {
  try {
    const { oldText, newText, oldSnapshotId, newSnapshotId } = req.body || {};

    let resolvedOld = typeof oldText === "string" ? oldText : null;
    let resolvedNew = typeof newText === "string" ? newText : null;
    let oldSnap = null;
    let newSnap = null;

    // Resolve snapshot ids to text when provided.
    if (oldSnapshotId) {
      oldSnap = await findSnapshot(oldSnapshotId);
      if (!oldSnap) {
        return res.status(404).json({ error: `Old snapshot '${oldSnapshotId}' not found.` });
      }
      resolvedOld = oldSnap.text;
    }
    if (newSnapshotId) {
      newSnap = await findSnapshot(newSnapshotId);
      if (!newSnap) {
        return res.status(404).json({ error: `New snapshot '${newSnapshotId}' not found.` });
      }
      resolvedNew = newSnap.text;
    }

    if (typeof resolvedOld !== "string" || typeof resolvedNew !== "string") {
      return res.status(400).json({
        error: "Provide either { oldText, newText } or { oldSnapshotId, newSnapshotId }.",
      });
    }

    const analysis = analyzeSemanticChange(resolvedOld, resolvedNew);

    const report = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      mockMode: String(process.env.MOCK_MODE || "true") !== "false",
      source: {
        oldSnapshotId: oldSnap ? oldSnap.id : null,
        newSnapshotId: newSnap ? newSnap.id : null,
        projectName: newSnap?.projectName || oldSnap?.projectName || null,
      },
      ...analysis,
    };

    await addReport(report);
    return res.status(201).json(report);
  } catch (err) {
    console.error("[analyze-diff] error:", err.message);
    return res.status(500).json({ error: "Failed to analyze the difference." });
  }
});

// GET /api/reports -> list stored reports (newest first).
router.get("/reports", async (_req, res) => {
  try {
    const reports = await getReports();
    const sorted = [...reports].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return res.json({ count: sorted.length, reports: sorted });
  } catch (err) {
    console.error("[reports] error:", err.message);
    return res.status(500).json({ error: "Failed to read reports." });
  }
});

// GET /api/reports/:id -> one report, 404 if missing.
router.get("/reports/:id", async (req, res) => {
  try {
    const report = await findReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }
    return res.json(report);
  } catch (err) {
    console.error("[reports/:id] error:", err.message);
    return res.status(500).json({ error: "Failed to read the report." });
  }
});

// GET /api/badge/:id -> mock public badge metadata for a report.
// A badge is the public, embeddable proof that a document was semantically
// notarized. The shape mirrors what a real on chain badge would expose.
router.get("/badge/:id", async (req, res) => {
  try {
    const report = await findReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Badge not found for this report id." });
    }
    return res.json({
      badgeId: `tv-${report.id.slice(0, 8)}`,
      reportId: report.id,
      project: report.source?.projectName || "Unknown project",
      changeType: report.changeType,
      severity: report.severity,
      semanticDriftScore: report.semanticDriftScore,
      consentRequired: report.consentRequired,
      verified: true,
      mockMode: report.mockMode !== false,
      issuedAt: report.createdAt,
      label: `TermsVault verified: ${report.changeType} (${report.severity})`,
      statement: "Semantically notarized by TermsVault. Know when the meaning changes.",
    });
  } catch (err) {
    console.error("[badge/:id] error:", err.message);
    return res.status(500).json({ error: "Failed to read the badge." });
  }
});

export default router;
