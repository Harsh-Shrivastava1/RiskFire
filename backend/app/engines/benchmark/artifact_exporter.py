import csv
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.app.engines.benchmark.scenarios import BenchmarkScenarioDefinition
from backend.app.schemas.benchmark import BatchBenchmarkReportSchema


class ArtifactExporter:
    """
    Exports structured benchmark reports, scenario manifests, and configs in JSON and CSV formats.
    Ensures zero secrets, full auditable reproducibility, and clean tabular data for manual review.
    """

    def __init__(self, base_dir: str = "benchmarks"):
        self.base_dir = Path(base_dir)
        self.reports_dir = self.base_dir / "reports"
        self.scenarios_dir = self.base_dir / "scenarios"
        self.configs_dir = self.base_dir / "configs"

        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.scenarios_dir.mkdir(parents=True, exist_ok=True)
        self.configs_dir.mkdir(parents=True, exist_ok=True)

    def export_report_json(self, report: BatchBenchmarkReportSchema) -> Path:
        """Exports the complete structured benchmark report as JSON."""
        file_path = self.reports_dir / f"benchmark_{report.benchmark_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))
        return file_path

    def export_report_csv(self, report: BatchBenchmarkReportSchema) -> Path:
        """
        Exports a comprehensive CSV spreadsheet with aggregate comparisons and per-scenario metrics.
        """
        file_path = self.reports_dir / f"benchmark_{report.benchmark_id}.csv"
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)

            # Section 1: Metadata Header
            writer.writerow(["=== RISKFIRE BENCHMARK REPORT ==="])
            writer.writerow(["Benchmark ID", report.benchmark_id])
            writer.writerow(["Dataset ID", report.dataset_id])
            writer.writerow(["Seed", report.seed])
            writer.writerow(["Dataset Split", report.dataset_split.value])
            writer.writerow(["Total Scenarios", report.scenarios_evaluated_count])
            writer.writerow(["Total Transactions", report.total_transactions_evaluated])
            writer.writerow(["Integrity Status", report.integrity_status])
            writer.writerow(["Held-Out Isolation", report.held_out_isolation_status])
            writer.writerow(["Created At", report.created_at])
            writer.writerow([])

            # Section 2: Aggregate Metrics Comparison
            writer.writerow(["=== AGGREGATE METRICS COMPARISON ==="])
            writer.writerow(["Metric", "Baseline", "Candidate", "Delta"])

            b = report.baseline_metrics
            c = report.candidate_metrics
            comp = report.comparison

            writer.writerow([
                "Detection Accuracy (Recall)",
                f"{b.recall}%",
                f"{c.recall}%" if c else "N/A",
                f"{comp.delta_recall}%" if comp else "N/A"
            ])
            writer.writerow([
                "Precision",
                f"{b.precision}%",
                f"{c.precision}%" if c else "N/A",
                f"{comp.delta_precision}%" if comp else "N/A"
            ])
            writer.writerow([
                "False Positive Rate (FPR)",
                f"{b.false_positive_rate}%",
                f"{c.false_positive_rate}%" if c else "N/A",
                f"{comp.delta_fpr}%" if comp else "N/A"
            ])
            writer.writerow([
                "Attack Success Rate (ASR)",
                f"{b.attack_success_rate}%",
                f"{c.attack_success_rate}%" if c else "N/A",
                f"{round(c.attack_success_rate - b.attack_success_rate, 1)}%" if c else "N/A"
            ])
            writer.writerow([
                "Successful Bypasses",
                b.successful_bypasses,
                c.successful_bypasses if c else "N/A",
                (c.successful_bypasses - b.successful_bypasses) if c else "N/A"
            ])
            writer.writerow([
                "Simulated Financial Exposure",
                f"INR {b.simulated_exposure:,.2f}",
                f"INR {c.simulated_exposure:,.2f}" if c else "N/A",
                f"INR {comp.delta_exposure:,.2f}" if comp else "N/A"
            ])
            if comp:
                writer.writerow(["Net Improvement Score", comp.net_improvement_score])
                writer.writerow(["Recommendation", comp.recommendation])
            writer.writerow([])

            # Section 3: Per-Scenario Detailed Breakdown
            writer.writerow(["=== PER-SCENARIO BREAKDOWN ==="])
            writer.writerow([
                "Scenario ID",
                "Scenario Name",
                "Attack Type",
                "Total Txns",
                "Adversarial",
                "Legitimate",
                "Bypasses",
                "Intercepted",
                "Recall (%)",
                "FPR (%)",
                "Attack Success Rate (%)",
                "Exposure (INR)",
                "Status"
            ])

            for s in report.scenario_results:
                writer.writerow([
                    s.scenario_id,
                    s.scenario_name,
                    s.attack_type,
                    s.total_transactions,
                    s.adversarial_count,
                    s.legitimate_count,
                    s.bypasses_count,
                    s.intercepted_count,
                    f"{s.recall}%",
                    f"{s.false_positive_rate}%",
                    f"{s.attack_success_rate}%",
                    f"INR {s.simulated_exposure:,.2f}",
                    s.status
                ])

        return file_path

    def export_scenario_definitions(self, scenarios: List[BenchmarkScenarioDefinition]) -> Path:
        """Exports the canonical scenario definitions into benchmarks/scenarios/."""
        file_path = self.scenarios_dir / "canonical_scenarios.json"
        with open(file_path, "w", encoding="utf-8") as f:
            data = [s.model_dump() for s in scenarios]
            json.dump(data, f, indent=2)
        return file_path

    def export_config(self, config: Dict[str, Any], config_id: str) -> Path:
        """Exports benchmark run configuration."""
        file_path = self.configs_dir / f"benchmark_{config_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return file_path
