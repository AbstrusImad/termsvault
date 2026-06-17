from pathlib import Path

from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

# Load the deployable contract by file path. The sibling semantic_contract.py is
# conceptual documentation that also declares a class named TermsVault, so we
# target this file directly to avoid an ambiguous name lookup.
CONTRACT_FILE = str(Path(__file__).resolve().parents[2] / "contract.py")

CHANGE_TYPES = (
    "Privacy weakened",
    "Pricing change",
    "Ownership change",
    "Scope expanded",
    "Rights reduced",
    "Data sharing expanded",
    "Minor wording",
    "Stable",
)
SEVERITIES = ("Stable", "Minor", "Medium", "High", "Critical")

# Canonical NovaAI case: a privacy promise ("we do not train on your data") is
# reversed into broad data use for AI training and partner sharing. This is a
# clear weakening, so validators should agree on a high semantic drift.
OLD = (
    "We do not use user prompts or uploaded files to train AI models. "
    "User data is only processed to provide the service."
)
NEW = (
    "We may use anonymized prompts, uploaded files and interaction data to "
    "improve our AI systems, safety models and selected partner integrations."
)


def test_analyze_consensus():
    factory = get_contract_factory(contract_file_path=CONTRACT_FILE)
    contract = factory.deploy(args=[])

    # The AI consensus write. Validators must agree on the categorical verdict
    # exactly and the numeric scores within tolerance.
    rc = contract.analyze(
        args=["NovaAI", "Privacy Policy", OLD, NEW]
    ).transact()
    assert tx_execution_succeeded(rc)

    # A report was notarized and stored on chain.
    stats = contract.get_stats(args=[]).call()
    assert int(stats["analyses"]) == 1
    assert int(stats["reports"]) == 1

    reports = contract.get_reports(args=[0]).call()
    assert len(reports) == 1
    report = reports[0]
    assert report["id"] == "rep-0"
    assert report["project"] == "NovaAI"
    assert report["category"] == "Privacy Policy"

    # The categorical verdict is inside the closed vocabularies.
    assert report["changeType"] in CHANGE_TYPES
    assert report["severity"] in SEVERITIES

    # The report is bound to the two content hashes.
    assert report["oldHash"].startswith("0x")
    assert report["newHash"].startswith("0x")
    assert report["oldHash"] != report["newHash"]

    # This is a clear weakening case, so semantic drift should be a sane high
    # value. We do not hard-pin a number since the live LLM varies.
    drift = int(report["semanticDriftScore"])
    assert 0 <= drift <= 100
    assert drift >= 60, f"expected high drift for a privacy weakening, got {drift}"

    # get_report returns the same record.
    single = contract.get_report(args=["rep-0"]).call()
    assert single["id"] == "rep-0"
    assert single["changeType"] == report["changeType"]

    print(
        "OBSERVED VERDICT:",
        "changeType=", report["changeType"],
        "severity=", report["severity"],
        "drift=", drift,
        "userImpact=", report["userImpact"],
        "consentRequired=", report["consentRequired"],
        "confidence=", report["confidence"],
    )
