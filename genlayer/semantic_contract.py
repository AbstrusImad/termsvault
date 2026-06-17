# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

# TermsVault: a semantic notary as a GenLayer Intelligent Contract.
#
# This file is a CONCEPTUAL contract. It is structured and documented so it can
# be adapted to the real GenVM once the exact SDK surface is fixed. Some calls
# are written as clearly marked pseudo code where the precise SDK signature is
# uncertain. The design, storage model, and consensus reasoning are concrete.
#
# WHAT IT DOES
# ------------
# TermsVault stores immutable snapshots of human agreements (Terms of Service,
# Privacy Policies, Pricing, Roadmaps, Whitepapers, public promises) and, when a
# new version appears, it asks the validator network to agree on HOW THE MEANING
# CHANGED. The output is a semantic impact report: a categorical change type and
# severity, a numeric semantic drift score, the user impact, whether consent is
# required, an explanation, and recommendations.
#
# WHY GENLAYER
# ------------
# A normal smart contract can prove that BYTES changed (a hash differs). It
# cannot agree on whether the MEANING changed, because that requires natural
# language judgement. GenLayer validators can each run an LLM and then reach
# consensus under an equivalence principle. TermsVault uses that to notarize the
# meaning of agreements, not just their bytes.
#
# CONSENSUS MODEL (read this before editing the equivalence principle)
# --------------------------------------------------------------------
# LLM output is non deterministic, so we never compare it byte for byte across
# validators. Instead the equivalence principle is split:
#   1. Categorical fields (change_type, severity, consent_required) must match
#      EXACTLY across validators. These come from a small closed vocabulary, so
#      exact agreement is reasonable and is what gives the report its authority.
#   2. The numeric semantic_drift_score must agree WITHIN A TOLERANCE (for
#      example plus or minus 7 points). Validators will not produce identical
#      integers, so a tolerance band is the correct equivalence rule.
#   3. Free text fields (summary, explanations) are NOT part of consensus. Only
#      the leader's prose is kept; validators only validate the structured fields.
# The snapshot sha256 hash anchors immutability: the report is bound to the exact
# normalized content it was computed from, so a report can never be silently
# re-pointed at different text.

# Closed vocabularies. Keeping these in the contract makes exact categorical
# consensus well defined.
CHANGE_TYPES = (
    "Privacy weakened",
    "Pricing change",
    "Ownership change",
    "Scope expanded",
    "Stable",
    "Minor wording",
)

SEVERITIES = ("Stable", "Minor", "Medium", "High", "Critical")

USER_IMPACTS = ("Positive", "Neutral", "Negative")

# Tolerance for numeric drift agreement across validators.
DRIFT_TOLERANCE = 7


class TermsVault(gl.Contract):
    """Semantic notary contract.

    Storage:
      snapshots: maps a snapshot id to an immutable record
                 { doc_id, hash, text, meta, created_by }.
      reports:   maps a report id to a semantic impact report bound to the two
                 snapshot hashes it was computed from.
      doc_history: maps a doc_id to the ordered list of its snapshot ids, so the
                 latest version of a document can be found cheaply.

    Notes on types: the real GenVM uses typed persistent storage (TreeMap and
    DynArray style collections). The annotations below express intent; adapt the
    exact generic types to the SDK when deploying.
    """

    # Persistent storage. In the real GenVM these are declared with the SDK
    # storage generics, for example TreeMap[str, Snapshot]. They are shown here
    # as typed mappings to express intent.
    snapshots: TreeMap[str, str]
    reports: TreeMap[str, str]
    doc_history: TreeMap[str, DynArray[str]]
    snapshot_count: u256
    report_count: u256

    def __init__(self) -> None:
        # Storage collections initialize empty. Counters anchor deterministic ids.
        self.snapshot_count = u256(0)
        self.report_count = u256(0)

    # ----------------------------------------------------------------------
    # Write methods (state changing)
    # ----------------------------------------------------------------------

    @gl.public.write
    def create_snapshot(self, doc_id: str, text: str, meta: str) -> str:
        """Store an immutable snapshot of a document version.

        The snapshot hash is the sha256 of the NORMALIZED text. Normalization
        (trim, collapse whitespace, normalize quotes) is deterministic, so every
        validator computes the same hash. This is the immutability anchor: any
        later report is bound to this hash.

        Args:
            doc_id: stable identifier for the logical document being tracked.
            text:   the full document text for this version.
            meta:   a JSON string with project name, category, importance, url.

        Returns:
            The new snapshot id.
        """
        normalized = _normalize_text(text)
        content_hash = _sha256_hex(normalized)

        snapshot_id = f"snap-{int(self.snapshot_count)}"
        self.snapshot_count = u256(int(self.snapshot_count) + 1)

        # Persist as a JSON string for portability in this conceptual version.
        # In the real GenVM, prefer a typed storage struct over JSON.
        record = _json_dump(
            {
                "id": snapshot_id,
                "doc_id": doc_id,
                "hash": content_hash,
                "text": text,
                "normalized": normalized,
                "meta": meta,
            }
        )
        self.snapshots[snapshot_id] = record

        # Append to the document history.
        if doc_id not in self.doc_history:
            self.doc_history[doc_id] = DynArray[str]()
        self.doc_history[doc_id].append(snapshot_id)

        return snapshot_id

    @gl.public.write
    def analyze_diff(self, old_snapshot_id: str, new_snapshot_id: str) -> str:
        """Compare two snapshots and notarize how the meaning changed.

        This is the AI consensus method. Each validator runs the same prompt
        through its LLM, then the network agrees under the equivalence principle
        described at the top of this file: categorical fields match exactly, the
        drift score matches within DRIFT_TOLERANCE, and free text is not part of
        consensus.

        Returns:
            The new report id (the report is also stored on chain).
        """
        old_raw = self.snapshots.get(old_snapshot_id)
        new_raw = self.snapshots.get(new_snapshot_id)
        if old_raw is None or new_raw is None:
            # Fail closed: do not notarize against missing snapshots.
            raise Exception("one or both snapshots do not exist")

        old_snap = _json_load(old_raw)
        new_snap = _json_load(new_raw)
        old_text = old_snap["normalized"]
        new_text = new_snap["normalized"]

        # The non deterministic block. Each validator executes this; the runtime
        # collects the structured results and applies the equivalence principle.
        #
        # PSEUDO CODE: the exact gl SDK call for an LLM under an equivalence
        # principle should be substituted here when deploying. The intent is:
        #   - build a strict prompt that forces a JSON answer with the closed
        #     vocabularies above
        #   - run it as a non deterministic step
        #   - validate categorical fields by exact match and the drift score by
        #     tolerance
        def _run_llm_classification() -> dict:
            prompt = _build_prompt(old_text, new_text)
            # raw = gl.nondet.exec_prompt(prompt)            # real SDK call
            # parsed = _parse_json(raw)
            # For this conceptual contract we fall back to the deterministic
            # heuristics so the file is runnable as a reference implementation.
            signals = _detect_signals(old_text, new_text)
            drift = calculate_semantic_drift(old_text, new_text)
            change_type = classify_change_type(signals)
            severity = _severity_from_drift(drift, signals)
            return {
                "change_type": change_type,
                "severity": severity,
                "semantic_drift_score": drift,
                "user_impact": _user_impact(change_type, severity),
                "consent_required": _consent_required(change_type, severity),
                "confidence": min(96, 60 + len(signals) * 8),
                "summary": _build_summary(change_type, severity, drift),
                "detected_signals": signals,
            }

        # Equivalence principle (conceptual). The real GenVM expresses this with
        # the SDK equivalence API. The leader proposes a result; validators accept
        # it only if their own categorical fields match exactly and their drift is
        # within tolerance.
        #
        #   result = gl.eq_principle.prompt_comparative(
        #       _run_llm_classification,
        #       criteria=_equivalence_criteria(),
        #   )
        result = _run_llm_classification()

        report = {
            "change_type": result["change_type"],
            "severity": result["severity"],
            "semantic_drift_score": int(result["semantic_drift_score"]),
            "user_impact": result["user_impact"],
            "consent_required": bool(result["consent_required"]),
            "confidence": int(result["confidence"]),
            "summary": result["summary"],
            "recommendations": _recommendations(result),
            "detected_signals": result["detected_signals"],
            # Bind the report to the exact content it was computed from.
            "old_hash": old_snap["hash"],
            "new_hash": new_snap["hash"],
            "old_snapshot_id": old_snapshot_id,
            "new_snapshot_id": new_snapshot_id,
        }
        return self.register_report(report)

    @gl.public.write
    def register_report(self, report: dict) -> str:
        """Persist a semantic impact report and return its id.

        Kept as a separate method so a report produced off chain (for example by
        the backend mock engine) can also be anchored on chain after review.
        """
        report_id = f"report-{int(self.report_count)}"
        self.report_count = u256(int(self.report_count) + 1)
        stored = dict(report)
        stored["id"] = report_id
        self.reports[report_id] = _json_dump(stored)
        return report_id

    # ----------------------------------------------------------------------
    # Read methods (view)
    # ----------------------------------------------------------------------

    @gl.public.view
    def get_report(self, report_id: str) -> str:
        """Return a stored report as a JSON string, or empty string if missing."""
        raw = self.reports.get(report_id)
        return raw if raw is not None else ""

    @gl.public.view
    def get_snapshot(self, snapshot_id: str) -> str:
        """Return a stored snapshot as a JSON string, or empty string if missing."""
        raw = self.snapshots.get(snapshot_id)
        return raw if raw is not None else ""

    @gl.public.view
    def latest_snapshot(self, doc_id: str) -> str:
        """Return the most recent snapshot id for a document, or empty string."""
        history = self.doc_history.get(doc_id)
        if not history or len(history) == 0:
            return ""
        return history[len(history) - 1]


# --------------------------------------------------------------------------
# Helper functions
#
# These are deterministic and would run identically on every validator. They are
# also the reference logic the LLM prompt is asked to follow, which keeps the
# off chain backend engine and the on chain contract conceptually aligned.
# --------------------------------------------------------------------------

AI_TRAINING_TERMS = (
    "ai training", "train ai", "improve our ai", "ai systems", "ai models",
    "machine learning", "model training",
)
DATA_SHARING_TERMS = (
    "third parties", "third party", "partners", "partner integrations",
    "share", "sell", "disclose",
)
DISCRETION_TERMS = (
    "may use", "reserve the right", "at our discretion", "we reserve",
)
PRICING_TERMS = ("pricing", "price", "fee", "fees", "subscription", "billing")
OWNERSHIP_TERMS = ("ownership", "license", "licence", "intellectual property")
PROMISE_TERMS = ("never", "do not", "does not", "will not", "only", "shall not")
WEAKENING_TERMS = ("may", "might", "improve our ai", "reserve the right", "at our discretion")


def _normalize_text(text: str) -> str:
    """Deterministic normalization: collapse whitespace and lowercase compare.

    The contract hashes the normalized text, so this must be identical across
    validators. It is intentionally simple and pure.
    """
    if not text:
        return ""
    # Collapse all whitespace to single spaces and trim.
    parts = text.split()
    return " ".join(parts)


def _sha256_hex(text: str) -> str:
    """sha256 hex of the input. In the real GenVM use the SDK provided hash.

    Shown with hashlib for clarity; swap for the GenVM hashing primitive when
    deploying if the SDK requires it.
    """
    import hashlib

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _contains(haystack: str, needle: str) -> bool:
    return needle in haystack.lower()


def _any(haystack: str, terms) -> bool:
    low = haystack.lower()
    for t in terms:
        if t in low:
            return True
    return False


def _newly(old_text: str, new_text: str, terms) -> list:
    old_low = old_text.lower()
    new_low = new_text.lower()
    return [t for t in terms if t in new_low and t not in old_low]


def _detect_signals(old_text: str, new_text: str) -> list:
    """Return the list of human readable signals found in the change."""
    signals = []
    old_promise = _any(old_text, PROMISE_TERMS)
    new_weak = _any(new_text, WEAKENING_TERMS)
    if old_promise and new_weak:
        signals.append("Original commitment weakened")
    if _newly(old_text, new_text, DISCRETION_TERMS):
        signals.append("Discretionary language introduced")
    if _newly(old_text, new_text, AI_TRAINING_TERMS):
        signals.append("AI training language introduced")
    if _newly(old_text, new_text, DATA_SHARING_TERMS):
        signals.append("Data sharing with partners or third parties")
    if _newly(old_text, new_text, PRICING_TERMS):
        signals.append("Pricing or fee terms changed")
    if _newly(old_text, new_text, OWNERSHIP_TERMS):
        signals.append("Ownership or licensing terms changed")
    return signals


def calculate_semantic_drift(old_text: str, new_text: str) -> int:
    """Compute a 0 to 100 semantic drift score.

    Drift starts from token level divergence (a Jaccard distance over word sets)
    and rises when risk signals appear: a weakened promise, discretionary
    language, AI training, data sharing, ownership or pricing changes. This is
    the numeric field that validators agree on within DRIFT_TOLERANCE.
    """
    old_tokens = set(old_text.lower().split())
    new_tokens = set(new_text.lower().split())
    if not old_tokens and not new_tokens:
        return 0
    inter = len(old_tokens & new_tokens)
    union = len(old_tokens | new_tokens)
    similarity = (inter / union) if union else 1.0
    drift = (1.0 - similarity) * 40.0

    old_promise = _any(old_text, PROMISE_TERMS)
    new_weak = _any(new_text, WEAKENING_TERMS)
    if old_promise and new_weak:
        drift += 25
    if _newly(old_text, new_text, DISCRETION_TERMS) or (new_weak and not _any(old_text, WEAKENING_TERMS)):
        drift += 15
    if _newly(old_text, new_text, AI_TRAINING_TERMS):
        drift += 8
    if _newly(old_text, new_text, DATA_SHARING_TERMS):
        drift += 8
    if _newly(old_text, new_text, OWNERSHIP_TERMS):
        drift += 8
    if _newly(old_text, new_text, PRICING_TERMS):
        drift += 6

    drift_int = int(round(drift))
    if drift_int < 0:
        return 0
    if drift_int > 100:
        return 100
    return drift_int


def classify_change_type(signals: list) -> str:
    """Map detected signals to a single categorical change type.

    Priority order matters: a weakened privacy promise dominates, then pricing,
    then ownership, then a general scope expansion. This closed vocabulary is
    what validators agree on exactly.
    """
    has_privacy = (
        "Original commitment weakened" in signals
        or (
            "AI training language introduced" in signals
            and "Data sharing with partners or third parties" in signals
        )
    )
    if has_privacy:
        return "Privacy weakened"
    if "Pricing or fee terms changed" in signals:
        return "Pricing change"
    if "Ownership or licensing terms changed" in signals:
        return "Ownership change"
    if (
        "Discretionary language introduced" in signals
        or "AI training language introduced" in signals
        or "Data sharing with partners or third parties" in signals
    ):
        return "Scope expanded"
    if signals:
        return "Minor wording"
    return "Stable"


def _severity_from_drift(drift: int, signals: list) -> str:
    privacy_weak = "Original commitment weakened" in signals
    if drift < 8:
        sev = "Stable"
    elif drift < 25:
        sev = "Minor"
    elif drift < 50:
        sev = "Medium"
    elif drift < 85:
        sev = "High"
    else:
        sev = "Critical"
    if privacy_weak and sev in ("Stable", "Minor"):
        sev = "Medium"
    return sev


def _user_impact(change_type: str, severity: str) -> str:
    if change_type in ("Privacy weakened", "Scope expanded", "Ownership change"):
        return "Negative"
    if severity in ("High", "Critical"):
        return "Negative"
    return "Neutral"


def _consent_required(change_type: str, severity: str) -> bool:
    if change_type in ("Privacy weakened", "Ownership change"):
        return True
    return severity in ("High", "Critical")


def _recommendations(result: dict) -> list:
    recs = []
    if result["consent_required"]:
        recs.append("Request explicit user consent before this change takes effect.")
    signals = result["detected_signals"]
    if "Original commitment weakened" in signals:
        recs.append("Notify users that prior commitments have been weakened.")
    if "AI training language introduced" in signals:
        recs.append("Offer a clear opt out for AI training on user content.")
    if "Data sharing with partners or third parties" in signals:
        recs.append("Disclose which partners or third parties receive user data.")
    if not recs:
        recs.append("Archive this version for the audit trail; no action needed.")
    return recs


def _build_summary(change_type: str, severity: str, drift: int) -> str:
    return (
        "Detected a " + change_type.lower() + " with " + severity.lower()
        + " severity. Semantic drift is " + str(drift) + " out of 100."
    )


def _build_prompt(old_text: str, new_text: str) -> str:
    """Build the strict, JSON forcing prompt for the validator LLM.

    The prompt pins the closed vocabularies so categorical consensus is well
    defined, and asks for an integer drift so numeric tolerance applies.
    """
    return (
        "You are a semantic notary. Compare the OLD and NEW versions of a public "
        "agreement and report how the meaning changed. Respond with strict JSON "
        "using only these vocabularies. change_type in "
        + str(list(CHANGE_TYPES)) + ", severity in " + str(list(SEVERITIES))
        + ", user_impact in " + str(list(USER_IMPACTS)) + ". Include an integer "
        "semantic_drift_score from 0 to 100, a boolean consent_required, a short "
        "summary, and a list of detected_signals.\n\nOLD:\n" + old_text
        + "\n\nNEW:\n" + new_text
    )


def _equivalence_criteria() -> dict:
    """Describe the equivalence rule the runtime applies across validators.

    Categorical fields must match exactly; the drift score must agree within
    DRIFT_TOLERANCE; free text is excluded from consensus.
    """
    return {
        "exact_match_fields": ["change_type", "severity", "consent_required", "user_impact"],
        "numeric_tolerance_fields": {"semantic_drift_score": DRIFT_TOLERANCE},
        "ignored_fields": ["summary", "recommendations"],
    }


# Lightweight JSON helpers. The real GenVM provides its own serialization; these
# keep the conceptual contract self contained and readable.
def _json_dump(obj: dict) -> str:
    import json

    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)


def _json_load(text: str) -> dict:
    import json

    return json.loads(text)
