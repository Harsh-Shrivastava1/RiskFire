import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.engines.benchmark.dataset_exporter import DatasetExporter


def main():
    parser = argparse.ArgumentParser(
        description="RiskFire Deterministic Dataset Exporter & Manifest Generator"
    )
    parser.add_argument("--seed", type=int, default=49201, help="Deterministic RNG seed (default: 49201)")
    parser.add_argument("--dataset", type=str, default="ds-synthetic-v1", help="Dataset identifier")
    parser.add_argument("--legit", type=int, default=2240, help="Legitimate transaction count")
    parser.add_argument("--adv", type=int, default=960, help="Adversarial transaction count")
    parser.add_argument("--output", type=str, default="datasets", help="Target output directory")

    args = parser.parse_args()

    print("=" * 70)
    print("  RISKFIRE — DETERMINISTIC DATASET EXPORT & INTEGRITY GENERATOR")
    print("=" * 70)
    print(f"  Dataset ID:       {args.dataset}")
    print(f"  RNG Seed:         {args.seed}")
    print(f"  Legitimate Txns:  {args.legit}")
    print(f"  Adversarial Txns: {args.adv}")
    print(f"  Target Dir:       {args.output}")
    print("-" * 70)

    exporter = DatasetExporter(output_base_dir=args.output)
    manifest, split_dict = exporter.generate_and_export_dataset(
        seed=args.seed,
        dataset_id=args.dataset,
        legitimate_count=args.legit,
        adversarial_count=args.adv
    )

    print("\n[SUCCESS] Dataset generated and exported successfully:")
    print(f"  Total Records:    {manifest.total_records:,}")
    print(f"  Development Split (70%): {manifest.development_count:,} records ({manifest.development_count/manifest.total_records*100:.1f}%)")
    print(f"  Validation Split  (15%): {manifest.validation_count:,} records ({manifest.validation_count/manifest.total_records*100:.1f}%)")
    print(f"  Held-Out Split    (15%): {manifest.held_out_count:,} records ({manifest.held_out_count/manifest.total_records*100:.1f}%)")
    print("\nCryptographic SHA-256 Manifest:")
    for f in manifest.files:
        print(f"  - {f.split.upper():<12} | {f.file_name:<18} | {f.record_count:>5} txns | SHA-256: {f.sha256_hash}")

    print("\nVerifying dataset cryptographic integrity...")
    verified = exporter.verify_dataset_integrity()
    print(f"[VERIFIED] Cryptographic dataset integrity confirmed for {verified.dataset_id} (Seed: {verified.seed})")
    print("=" * 70)


if __name__ == "__main__":
    main()
