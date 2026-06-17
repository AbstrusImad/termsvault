// Semantic analysis service.
//
// analyzeSemanticChange(oldText, newText) compares two versions of a document
// and produces a structured semantic impact report. The engine is rule based
// and fully deterministic: the same inputs always yield the same report, which
// matters for an audit trail and for validator consensus later on.
//
// GENLAYER SEAM
// -------------
// In production the categorical classification (changeType, severity) and the
// drift score would come from an LLM running on GenLayer validators under an
// equivalence principle. The function analyzeWithGenLayer below is the seam:
// when a GenLayer client is wired in, it replaces the rule based path while
// keeping the exact same return shape. Until then the deterministic engine is
// the source of truth (MOCK_MODE).

import {
  normalizeText,
  toComparable,
  jaccardSimilarity,
} from "./normalizeText.js";

// ---------------------------------------------------------------------------
// Signal vocabularies
// ---------------------------------------------------------------------------

const AI_TRAINING_TERMS = [
  "ai training",
  "train ai",
  "train our ai",
  "improve our ai",
  "ai systems",
  "ai models",
  "train models",
  "machine learning",
  "model training",
  "train our models",
];

const DATA_SHARING_TERMS = [
  "third parties",
  "third party",
  "third-party",
  "partners",
  "partner integrations",
  "selected partner",
  "share",
  "shared",
  "sell",
  "sold",
  "disclose",
];

const DISCRETION_TERMS = [
  "may use",
  "reserve the right",
  "at our discretion",
  "we reserve",
  "in our sole discretion",
  "as we see fit",
];

const PRICING_TERMS = [
  "pricing",
  "price",
  "fee",
  "fees",
  "subscription",
  "billing",
  "cost",
  "charge",
];

const OWNERSHIP_TERMS = [
  "ownership",
  "own your",
  "we own",
  "license",
  "licence",
  "intellectual property",
  "content rights",
  "rights to your content",
];

// Words that signal a firm, restrictive commitment in the old version.
const PROMISE_TERMS = [
  "never",
  "do not",
  "does not",
  "will not",
  "shall not",
  "cannot",
  "only",
  "no ",
];

// Words that signal a softened, permissive stance in the new version.
const WEAKENING_TERMS = [
  "may",
  "might",
  "can ",
  "improve our ai",
  "reserve the right",
  "at our discretion",
];

// ---------------------------------------------------------------------------
// Term matching helpers
// ---------------------------------------------------------------------------

// Returns true if `comparable` contains `term`. Multi word terms use a plain
// substring match; single tokens use a loose word boundary match so that
// "share" does not fire on "shareholder".
function hasTerm(comparable, term) {
  if (!comparable) return false;
  if (term.includes(" ")) {
    return comparable.includes(term);
  }
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return re.test(comparable);
}

function anyTerm(comparable, terms) {
  return terms.some((t) => hasTerm(comparable, t));
}

// Terms present in the new text but absent from the old text.
function newlyIntroduced(oldComparable, newComparable, terms) {
  return terms.filter(
    (t) => hasTerm(newComparable, t) && !hasTerm(oldComparable, t)
  );
}

function clampInt(value, min, max) {
  const v = Math.round(Number.isFinite(value) ? value : 0);
  return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Meaning description
// ---------------------------------------------------------------------------

function excerpt(text, max = 160) {
  const n = normalizeText(text);
  if (!n) return "(empty)";
  return n.length > max ? `${n.slice(0, max - 1)}...` : n;
}

function describeStance(comparable, raw) {
  if (!comparable) return "No content captured for this version.";
  const restrictive = anyTerm(comparable, [
    "never",
    "do not",
    "does not",
    "will not",
    "only",
    "shall not",
  ]);
  const permissive = anyTerm(comparable, DISCRETION_TERMS) || hasTerm(comparable, "may");
  let stance;
  if (restrictive && !permissive) {
    stance = "States a firm, restrictive commitment limiting how data is used.";
  } else if (permissive && !restrictive) {
    stance = "Uses permissive, discretionary language that broadens allowed use.";
  } else if (permissive && restrictive) {
    stance = "Mixes commitments with discretionary carve outs.";
  } else {
    stance = "Describes the policy in neutral terms.";
  }
  return `${stance} Excerpt: "${excerpt(raw)}"`;
}

// ---------------------------------------------------------------------------
// Core deterministic engine
// ---------------------------------------------------------------------------

const CHANGE_TYPES = {
  PRIVACY_WEAKENED: "Privacy weakened",
  PRICING_CHANGE: "Pricing change",
  OWNERSHIP_CHANGE: "Ownership change",
  SCOPE_EXPANDED: "Scope expanded",
  STABLE: "Stable",
  MINOR_WORDING: "Minor wording",
};

const SEVERITY = {
  STABLE: "Stable",
  MINOR: "Minor",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function severityFromDrift(drift, privacyWeakened) {
  let sev;
  if (drift < 8) sev = SEVERITY.STABLE;
  else if (drift < 25) sev = SEVERITY.MINOR;
  else if (drift < 50) sev = SEVERITY.MEDIUM;
  else if (drift < 85) sev = SEVERITY.HIGH;
  else sev = SEVERITY.CRITICAL;

  // A weakened privacy promise is never less than Medium, even on small edits.
  if (privacyWeakened && (sev === SEVERITY.STABLE || sev === SEVERITY.MINOR)) {
    sev = SEVERITY.MEDIUM;
  }
  return sev;
}

// Rule based analysis. This is the default (mock mode) implementation.
function analyzeRuleBased(oldText, newText) {
  const oldComparable = toComparable(oldText);
  const newComparable = toComparable(newText);

  // Both empty: nothing to compare.
  if (!oldComparable && !newComparable) {
    return buildReport({
      changeType: CHANGE_TYPES.STABLE,
      severity: SEVERITY.STABLE,
      drift: 0,
      userImpact: "Neutral",
      consentRequired: false,
      confidence: 50,
      summary: "No content was provided for either version.",
      oldMeaning: describeStance(oldComparable, oldText),
      newMeaning: describeStance(newComparable, newText),
      recommendations: ["Provide both an old and a new version to analyze."],
      detectedSignals: [],
    });
  }

  // Textual divergence contributes up to 40 points of drift.
  const similarity = jaccardSimilarity(oldComparable, newComparable);
  const textualDrift = clampInt((1 - similarity) * 40, 0, 40);

  // Detect signal categories.
  const newAiTerms = newlyIntroduced(oldComparable, newComparable, AI_TRAINING_TERMS);
  const newSharingTerms = newlyIntroduced(oldComparable, newComparable, DATA_SHARING_TERMS);
  const newDiscretionTerms = newlyIntroduced(oldComparable, newComparable, DISCRETION_TERMS);
  const newPricingTerms = newlyIntroduced(oldComparable, newComparable, PRICING_TERMS);
  const newOwnershipTerms = newlyIntroduced(oldComparable, newComparable, OWNERSHIP_TERMS);

  const oldHadPromise = anyTerm(oldComparable, PROMISE_TERMS);
  const newHasWeakening = anyTerm(newComparable, WEAKENING_TERMS);
  const promiseWeakened = oldHadPromise && newHasWeakening;

  const aiTrainingIntroduced = newAiTerms.length > 0;
  const dataSharingIntroduced = newSharingTerms.length > 0;
  const discretionIntroduced = newDiscretionTerms.length > 0 || (newHasWeakening && !anyTerm(oldComparable, WEAKENING_TERMS));
  const pricingChanged = newPricingTerms.length > 0 || (anyTerm(oldComparable, PRICING_TERMS) && anyTerm(newComparable, PRICING_TERMS) && similarity < 0.85);
  const ownershipChanged = newOwnershipTerms.length > 0;

  // Build the detected signals list (human readable).
  const detectedSignals = [];
  if (promiseWeakened) {
    detectedSignals.push("Original commitment weakened (restrictive wording replaced by discretionary wording)");
  }
  if (discretionIntroduced) {
    detectedSignals.push("Discretionary language introduced (may use / reserve the right / at our discretion)");
  }
  if (aiTrainingIntroduced) {
    detectedSignals.push("AI training language introduced");
  }
  if (dataSharingIntroduced) {
    detectedSignals.push("Data sharing with partners or third parties");
  }
  if (pricingChanged) {
    detectedSignals.push("Pricing or fee terms changed");
  }
  if (ownershipChanged) {
    detectedSignals.push("Ownership or licensing terms changed");
  }

  // Drift contributions from semantic signals.
  let drift = textualDrift;
  if (promiseWeakened) drift += 25;
  if (discretionIntroduced) drift += 15;
  if (aiTrainingIntroduced) drift += 8;
  if (dataSharingIntroduced) drift += 8;
  if (ownershipChanged) drift += 8;
  if (pricingChanged) drift += 6;
  drift = clampInt(drift, 0, 100);

  // Privacy weakening is the dominant negative pattern.
  const privacyWeakened =
    promiseWeakened || (dataSharingIntroduced && aiTrainingIntroduced);

  // Restrictions added (the new version is more protective than the old one).
  const restrictionsAdded =
    anyTerm(newComparable, ["never", "do not", "will not", "only"]) &&
    !anyTerm(oldComparable, ["never", "do not", "will not", "only"]) &&
    !privacyWeakened;

  // Determine change type by priority.
  let changeType;
  if (privacyWeakened) {
    changeType = CHANGE_TYPES.PRIVACY_WEAKENED;
  } else if (pricingChanged) {
    changeType = CHANGE_TYPES.PRICING_CHANGE;
  } else if (ownershipChanged) {
    changeType = CHANGE_TYPES.OWNERSHIP_CHANGE;
  } else if (discretionIntroduced || aiTrainingIntroduced || dataSharingIntroduced) {
    changeType = CHANGE_TYPES.SCOPE_EXPANDED;
  } else if (drift >= 8) {
    changeType = CHANGE_TYPES.MINOR_WORDING;
  } else {
    changeType = CHANGE_TYPES.STABLE;
  }

  const severity = severityFromDrift(drift, privacyWeakened);

  // User impact.
  let userImpact;
  if (
    privacyWeakened ||
    changeType === CHANGE_TYPES.SCOPE_EXPANDED ||
    changeType === CHANGE_TYPES.OWNERSHIP_CHANGE ||
    severity === SEVERITY.HIGH ||
    severity === SEVERITY.CRITICAL
  ) {
    userImpact = "Negative";
  } else if (restrictionsAdded) {
    userImpact = "Positive";
  } else {
    userImpact = "Neutral";
  }

  // Consent is required when the change materially affects user rights.
  const consentRequired =
    privacyWeakened ||
    changeType === CHANGE_TYPES.OWNERSHIP_CHANGE ||
    severity === SEVERITY.HIGH ||
    severity === SEVERITY.CRITICAL;

  // Confidence grows with the number and clarity of signals.
  const signalCount = detectedSignals.length;
  const confidence = clampInt(60 + signalCount * 8 + (similarity < 0.5 ? 6 : 0), 50, 96);

  // Recommendations.
  const recommendations = [];
  if (consentRequired) {
    recommendations.push("Request explicit user consent before this change takes effect.");
  }
  if (privacyWeakened) {
    recommendations.push("Notify users that prior data handling commitments have been weakened.");
  }
  if (aiTrainingIntroduced) {
    recommendations.push("Offer a clear opt out for AI training on user content.");
  }
  if (dataSharingIntroduced) {
    recommendations.push("Disclose which partners or third parties receive user data.");
  }
  if (pricingChanged) {
    recommendations.push("Communicate the new pricing with reasonable advance notice.");
  }
  if (ownershipChanged) {
    recommendations.push("Clarify content ownership and licensing implications for users.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Archive this version for the audit trail; no action needed.");
  }

  // Summary.
  const summary = buildSummary({
    changeType,
    severity,
    drift,
    userImpact,
    consentRequired,
  });

  return buildReport({
    changeType,
    severity,
    drift,
    userImpact,
    consentRequired,
    confidence,
    summary,
    oldMeaning: describeStance(oldComparable, oldText),
    newMeaning: describeStance(newComparable, newText),
    recommendations,
    detectedSignals,
  });
}

function buildSummary({ changeType, severity, drift, userImpact, consentRequired }) {
  const consentNote = consentRequired
    ? "User consent should be collected before it takes effect."
    : "No explicit consent is required.";
  return `Detected a ${changeType.toLowerCase()} with ${severity.toLowerCase()} severity. Semantic drift is ${drift} out of 100 and the user impact is ${userImpact.toLowerCase()}. ${consentNote}`;
}

// Assemble the final report object in the exact required shape.
function buildReport(fields) {
  return {
    changeType: fields.changeType,
    severity: fields.severity,
    semanticDriftScore: clampInt(fields.drift, 0, 100),
    userImpact: fields.userImpact,
    consentRequired: Boolean(fields.consentRequired),
    confidence: clampInt(fields.confidence, 0, 100),
    summary: fields.summary,
    oldMeaning: fields.oldMeaning,
    newMeaning: fields.newMeaning,
    recommendations: Array.isArray(fields.recommendations) ? fields.recommendations : [],
    detectedSignals: Array.isArray(fields.detectedSignals) ? fields.detectedSignals : [],
  };
}

// ---------------------------------------------------------------------------
// GenLayer seam (disabled until a client is connected)
// ---------------------------------------------------------------------------

// When a real GenLayer client is available, this function would submit the two
// texts to an Intelligent Contract method that runs an LLM under an equivalence
// principle. Validators would agree on the categorical fields exactly and on
// the numeric drift within a tolerance. The return shape must match buildReport.
//
// Example (pseudo):
//   const res = await genlayerClient.call("analyze_diff", { oldText, newText });
//   return buildReport(res);
//
// For now it is intentionally not wired in, so analyzeSemanticChange uses the
// deterministic engine.
// eslint-disable-next-line no-unused-vars
async function analyzeWithGenLayer(oldText, newText) {
  throw new Error("GenLayer client not connected");
}

// Public entry point. Accepts any input safely and never throws on bad data.
export function analyzeSemanticChange(oldText, newText) {
  const safeOld = typeof oldText === "string" ? oldText : "";
  const safeNew = typeof newText === "string" ? newText : "";
  return analyzeRuleBased(safeOld, safeNew);
}

export { CHANGE_TYPES, SEVERITY };
