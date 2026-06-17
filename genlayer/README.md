# TermsVault GenLayer Contract

This directory holds the conceptual GenLayer Intelligent Contract for TermsVault,
a semantic notary for human agreements. The contract is in
`semantic_contract.py`.

## The idea

A traditional smart contract can prove that the bytes of a document changed: two
hashes differ. It cannot prove that the meaning changed, because deciding whether
"we do not use your data to train AI" became "we may use your data to improve our
AI" requires natural language judgement. GenLayer validators can each run a large
language model and then reach consensus on the result, which is exactly what a
semantic notary needs. TermsVault uses that capability to notarize the meaning of
agreements, not only their bytes.

## What the contract models

The `TermsVault` contract (a `gl.Contract`) provides:

- Storage for snapshots, reports, and per document history.
- `create_snapshot(doc_id, text, meta)`: stores an immutable snapshot. The
  snapshot hash is the sha256 of the normalized text, which anchors immutability.
- `analyze_diff(old_snapshot_id, new_snapshot_id)`: the AI consensus method. It
  builds a strict prompt, runs the classification as a non deterministic step,
  and the network agrees on the result under an equivalence principle. It stores
  and returns a semantic impact report.
- `register_report(report)`: anchors a report on chain. Useful when a report was
  produced off chain and is being committed after review.
- `get_report(report_id)`, `get_snapshot(snapshot_id)`, `latest_snapshot(doc_id)`:
  view methods.
- Helper functions `calculate_semantic_drift(old, new)` and
  `classify_change_type(signals)`, plus the supporting signal detection. These
  are deterministic and run identically on every validator. They double as the
  reference logic the LLM prompt is asked to follow, which keeps the off chain
  backend engine and the on chain contract aligned.

## Consensus model

LLM output is non deterministic, so the contract never compares raw model text
byte for byte across validators. The equivalence principle is split into three
parts:

1. Categorical fields (`change_type`, `severity`, `consent_required`,
   `user_impact`) must match exactly. They come from small closed vocabularies
   declared in the contract, so exact agreement is well defined and is what gives
   a report its authority.
2. The numeric `semantic_drift_score` must agree within a tolerance band
   (`DRIFT_TOLERANCE`, for example plus or minus 7). Validators will not produce
   identical integers, so a tolerance is the correct rule.
3. Free text fields such as `summary` and `recommendations` are excluded from
   consensus. Only the leader's prose is kept; validators verify the structured
   fields.

The snapshot sha256 hash binds each report to the exact normalized content it was
computed from, so a report can never be silently re-pointed at different text.

## Status and pseudo code

This is a conceptual contract. The structure, storage model, vocabularies, and
consensus reasoning are concrete. A few calls are written as clearly marked
pseudo code where the precise GenVM SDK signature is uncertain:

- the non deterministic LLM execution call inside `analyze_diff`
- the equivalence principle invocation that compares validator results
- the typed storage generics (shown as typed mappings) and the hashing primitive

So the file remains runnable as a reference, those spots fall back to the
deterministic helper functions. The runner header at the top of the file pins the
GenVM dependency:

```
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
```

## Path to a real deployment

1. Replace the pseudo code LLM block in `analyze_diff` with the real
   non deterministic execution call from the GenVM SDK, feeding it the prompt
   built by `_build_prompt`.
2. Wire the equivalence principle using `_equivalence_criteria` so validators
   compare categorical fields exactly and the drift score within tolerance.
3. Swap the JSON string storage for typed GenVM storage structs and the SDK
   hashing primitive, keeping the normalization step identical across validators.
4. Test in a GenLayer development environment with the NovaAI demo case (see the
   top level README), confirming the network agrees on Privacy weakened, High
   severity, consent required, and a drift score near 84 within tolerance.
5. Deploy and expose the contract address to the backend, which can then replace
   its mock semantic engine with real on chain calls through the prepared client
   seam.
