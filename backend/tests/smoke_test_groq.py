"""
RiskFire Phase 4 — Real Groq API Live Smoke Test
Tests all four AI modules against the live Groq API using configured GROQ_API_KEY.
Ensures JSON parsing, Pydantic validation, and domain grounding succeed end-to-end.
"""

import asyncio
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.ai.providers.groq import GroqProvider
from backend.app.ai.modules.attack_planner import AttackPlanner
from backend.app.ai.modules.vulnerability_explainer import VulnerabilityExplainer
from backend.app.ai.modules.patch_generator import PatchGenerator
from backend.app.ai.modules.report_generator import ReportGenerator
from backend.app.ai.schemas.attack_plan import AttackPlannerInput, AttackPlan
from backend.app.ai.schemas.explanation import VulnerabilityExplanationInput, VulnerabilityExplanation
from backend.app.ai.schemas.patch_proposal import PatchProposalInput, PatchProposal
from backend.app.ai.schemas.report_narrative import ReportNarrativeInput, ReportNarrative
from backend.app.schemas.attack import AttackAgentType
from backend.app.core.config import settings


async def run_live_groq_smoke_test():
    print("\n" + "=" * 65)
    print("RISKFIRE PHASE 4 -- REAL GROQ API LIVE SMOKE TEST")
    print("=" * 65)

    if not settings.GROQ_API_KEY:
        print("[FAIL] GROQ_API_KEY is not configured in backend/.env.")
        sys.exit(1)

    print(f"* Model: {settings.GROQ_MODEL}")
    print(f"* Timeout: {settings.GROQ_TIMEOUT}s")
    print(f"* Max Retries: {settings.GROQ_MAX_RETRIES}")

    provider = GroqProvider()

    # 1. Health Check
    print("\n[1/5] Probing Groq API Health Check...")
    start = time.perf_counter()
    is_healthy = await provider.health_check()
    health_latency = (time.perf_counter() - start) * 1000
    if not is_healthy:
        print("[FAIL] Groq API health check returned False.")
        sys.exit(1)
    print(f"[PASS] Health check succeeded in {health_latency:.1f}ms")

    # 2. Attack Planner Module
    print("\n[2/5] Testing AI Attack Planner (Groq)...")
    planner = AttackPlanner(provider)
    attack_input = AttackPlannerInput(
        merchant_id="m-dev-01",
        simulation_id="sim-live-smoke",
        active_policy_names=["Velocity & Identity Collision Guard"],
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
        difficulty="HIGH",
        available_entity_counts={"accounts": 12, "devices": 2, "cards": 6}
    )
    start = time.perf_counter()
    attack_plan = await planner.generate_plan(attack_input)
    plan_latency = (time.perf_counter() - start) * 1000

    assert isinstance(attack_plan, AttackPlan)
    assert attack_plan.attack_type in list(AttackAgentType)
    print(f"[PASS] Attack Plan generated in {plan_latency:.1f}ms:")
    print(f"   - Attack Type: {attack_plan.attack_type.value}")
    print(f"   - Actors Count: {attack_plan.actors_count}")
    print(f"   - Shared Device: {attack_plan.shared_device}")
    print(f"   - Transaction Count: {attack_plan.transaction_count}")
    print(f"   - Objective: {attack_plan.objective[:80]}...")

    # 3. Vulnerability Explainer Module
    print("\n[3/5] Testing AI Vulnerability Explainer (Groq)...")
    explainer = VulnerabilityExplainer(provider)
    vuln_input = VulnerabilityExplanationInput(
        vulnerability_id="vuln-smoke-01",
        attack_type="IDENTITY_FRAGMENTER",
        target_policy_name="Velocity & Identity Collision Guard",
        bypass_count=84,
        total_attack_count=120,
        simulated_exposure=1180000.0,
        key_evidence_summary="Device fingerprint DEV-9102 was observed cycling across 8 newly registered synthetic accounts."
    )
    start = time.perf_counter()
    explanation = await explainer.explain_vulnerability(vuln_input)
    expl_latency = (time.perf_counter() - start) * 1000

    assert isinstance(explanation, VulnerabilityExplanation)
    assert len(explanation.summary) > 10
    print(f"[PASS] Vulnerability Explained in {expl_latency:.1f}ms:")
    print(f"   - Summary: {explanation.summary[:80]}...")
    print(f"   - Key Signal Missed: {explanation.key_signal_missed[:80]}...")
    print(f"   - Confidence: {explanation.confidence}")
    print(f"   - Contributing Factors: {len(explanation.contributing_factors)} items")

    # 4. Patch Generator Module
    print("\n[4/5] Testing AI Patch Generator (Groq)...")
    patch_gen = PatchGenerator(provider)
    patch_input = PatchProposalInput(
        vulnerability_id="vuln-smoke-01",
        vulnerability_title="Cross-Account Device Collision Evasion",
        why_failed="Policy evaluated transaction rate limits solely per account_id, missing hardware fingerprint DEV-9102.",
        current_policy_id="pol-01",
        current_policy_name="Velocity & Identity Collision Guard",
        simulated_exposure=1180000.0
    )
    start = time.perf_counter()
    patch_proposal = await patch_gen.propose_patch(patch_input)
    patch_latency = (time.perf_counter() - start) * 1000

    assert isinstance(patch_proposal, PatchProposal)
    assert len(patch_proposal.proposed_changes) > 0
    print(f"[PASS] Patch Proposed in {patch_latency:.1f}ms:")
    print(f"   - Identified Weakness: {patch_proposal.identified_weakness[:80]}...")
    print(f"   - Proposed Changes: {len(patch_proposal.proposed_changes)} rule modification(s)")
    for i, chg in enumerate(patch_proposal.proposed_changes):
        print(f"     [{i+1}] {chg.operation} {chg.rule_type}: {chg.proposed_rule_text[:60]}...")
    print(f"   - Confidence: {patch_proposal.confidence}")

    # 5. Executive Report Generator Module
    print("\n[5/5] Testing AI Executive Report Generator (Groq)...")
    report_gen = ReportGenerator(provider)
    report_input = ReportNarrativeInput(
        simulation_id="sim-live-smoke",
        merchant_name="Acme Payments India Pvt Ltd",
        policy_name="Velocity & Identity Collision Guard",
        total_transactions=3200,
        bypasses_found=84,
        simulated_exposure=1180000.0,
        detection_recall=76.2,
        false_positive_rate=1.8,
        vulnerabilities_summary=["Cross-Account Device Collision Evasion", "Sliding-Window Sub-Threshold Skimming"]
    )
    start = time.perf_counter()
    report_narrative = await report_gen.generate_narrative(report_input)
    rep_latency = (time.perf_counter() - start) * 1000

    assert isinstance(report_narrative, ReportNarrative)
    assert "synthetic" in report_narrative.disclaimer.lower()
    print(f"[PASS] Report Narrative generated in {rep_latency:.1f}ms:")
    print(f"   - Executive Summary: {report_narrative.executive_summary[:80]}...")
    print(f"   - Risk Posture: {report_narrative.risk_posture_assessment[:80]}...")
    print(f"   - Key Findings: {len(report_narrative.key_findings_summary)} items")
    print(f"   - Recommended Actions: {len(report_narrative.recommended_actions)} items")
    print(f"   - Disclaimer: {report_narrative.disclaimer[:80]}...")

    print("\n" + "=" * 65)
    print("ALL 4 AI MODULES PASSED LIVE GROQ SMOKE TEST COMPREHENSIVELY!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(run_live_groq_smoke_test())
