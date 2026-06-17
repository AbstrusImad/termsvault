// Document routes: fetching a public URL and extracting readable text.

import { Router } from "express";
import { fetchDocument } from "../services/fetchDocument.js";

const router = Router();

// POST /api/fetch-document  { url }
// Fetches a public URL and returns extracted readable text. Never crashes the
// server: all failures resolve to a 400/502 with a clear, actionable message.
router.post("/fetch-document", async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      error: "A 'url' string is required. You can also paste the document text manually.",
    });
  }

  try {
    const result = await fetchDocument(url.trim());
    if (!result.ok) {
      // Client error: the URL was rejected or unreachable.
      return res.status(422).json({ error: result.error });
    }
    return res.json({
      url: result.url,
      text: result.text,
      bytes: result.bytes,
      truncated: result.truncated,
      characters: result.text.length,
    });
  } catch (err) {
    // Defensive: the service should not throw, but never let it crash the app.
    console.error("[fetch-document] unexpected error:", err.message);
    return res.status(502).json({
      error: "The document could not be fetched. Please paste the text manually.",
    });
  }
});

export default router;
