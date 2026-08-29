import hashlib
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.exceptions import DatasetIntegrityError
from backend.app.engines.attacks.attack_engine import AttackEngine
from backend.app.engines.simulation.simulation_engine import SimulationEngine
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.benchmark import DatasetFileManifest, DatasetManifestSchema
from backend.app.schemas.common import DatasetSplitType


class DatasetExporter:
    """
    Deterministic dataset generator, exporter, and cryptographic integrity validator.
    Enforces reproducible 70% Development / 15% Validation / 15% Held-Out splits with SHA-256 manifests.
    """

    def __init__(self, output_base_dir: str = "datasets"):
        self.output_base_dir = Path(output_base_dir)
        self.sim_engine = SimulationEngine()
        self.attack_engine = AttackEngine()

    def generate_and_export_dataset(
        self,
        seed: int = 49201,
        dataset_id: str = "ds-synthetic-v1",
        legitimate_count: int = 2240,
        adversarial_count: int = 960,
        start_time_iso: str = "2026-08-20T10:00:00Z"
    ) -> Tuple[DatasetManifestSchema, Dict[str, List[Dict[str, Any]]]]:
        """
        Deterministically generates a complete synthetic transaction dataset
        partitioned into 70% Development, 15% Validation, and 15% Held-Out splits.
        """
        rng = random.Random(seed)
        sim_id = f"sim-ds-{seed % 10000:04d}"

        # 1. Deterministic synthetic entity pool
        entity_pool = self.sim_engine._generate_entity_pool(rng)

        # 2. Deterministic legitimate traffic
        legit_txns = self.sim_engine._generate_legitimate_transactions(
            sim_id=sim_id,
            count=legitimate_count,
            start_time_iso=start_time_iso,
            rng=rng,
            entity_pool=entity_pool
        )

        # 3. Deterministic adversarial traffic across all supported attack agents
        attack_txns: List[Dict[str, Any]] = []
        attack_types = [
            AttackAgentType.IDENTITY_FRAGMENTER,
            AttackAgentType.VELOCITY_ATTACKER,
            AttackAgentType.COORDINATED_CLUSTER,
            AttackAgentType.PAYMENT_ROTATOR,
            AttackAgentType.REFUND_ABUSER,
            AttackAgentType.PROMOTION_ABUSER,
        ]
        per_agent_count = max(1, adversarial_count // len(attack_types))
        for agent_type in attack_types:
            attacks = self.attack_engine.generate_attack_stream(
                simulation_id=sim_id,
                agent_type=agent_type,
                attack_count=per_agent_count,
                start_time_iso=start_time_iso,
                rng=rng,
                entity_pool=entity_pool
            )
            attack_txns.extend(attacks)

        # 4. Merge and chronologically sort all transactions
        all_txns = legit_txns + attack_txns
        all_txns.sort(key=lambda t: t["created_at_sim"])

        # 5. Deterministic 70/15/15 Split Assignment
        dev_txns: List[Dict[str, Any]] = []
        val_txns: List[Dict[str, Any]] = []
        held_out_txns: List[Dict[str, Any]] = []

        for txn in all_txns:
            split_roll = rng.random()
            if split_roll < 0.70:
                txn["dataset_split"] = DatasetSplitType.DEVELOPMENT.value
                dev_txns.append(txn)
            elif split_roll < 0.85:
                txn["dataset_split"] = DatasetSplitType.VALIDATION.value
                val_txns.append(txn)
            else:
                txn["dataset_split"] = DatasetSplitType.HELD_OUT.value
                held_out_txns.append(txn)

        split_dict = {
            "development": dev_txns,
            "validation": val_txns,
            "held_out": held_out_txns
        }

        # 6. Ensure target directories exist
        manifests_dir = self.output_base_dir / "manifests"
        manifests_dir.mkdir(parents=True, exist_ok=True)

        file_manifests: List[DatasetFileManifest] = []

        for split_name, txns in split_dict.items():
            split_dir = self.output_base_dir / split_name
            split_dir.mkdir(parents=True, exist_ok=True)

            file_path = split_dir / "transactions.json"
            json_content = json.dumps(txns, indent=2, sort_keys=True)
            file_bytes = json_content.encode("utf-8")
            file_sha256 = hashlib.sha256(file_bytes).hexdigest()

            with open(file_path, "wb") as f:
                f.write(file_bytes)

            file_manifests.append(
                DatasetFileManifest(
                    split=split_name,
                    file_name="transactions.json",
                    file_path=str(file_path.as_posix()),
                    record_count=len(txns),
                    sha256_hash=file_sha256,
                    byte_size=len(file_bytes)
                )
            )

        # 7. Write Manifest
        created_at_iso = datetime.now(timezone.utc).isoformat()
        manifest = DatasetManifestSchema(
            dataset_id=dataset_id,
            generator_version="1.0.0",
            schema_version="1.0.0",
            seed=seed,
            total_records=len(all_txns),
            development_count=len(dev_txns),
            validation_count=len(val_txns),
            held_out_count=len(held_out_txns),
            split_strategy="70_15_15_DETERMINISTIC",
            files=file_manifests,
            created_at=created_at_iso
        )

        manifest_bytes = manifest.model_dump_json(indent=2).encode("utf-8")
        manifest_path = manifests_dir / f"dataset_{dataset_id}_manifest.json"
        with open(manifest_path, "wb") as f:
            f.write(manifest_bytes)

        # Also write canonical active manifest
        canonical_manifest_path = manifests_dir / "dataset_manifest.json"
        with open(canonical_manifest_path, "wb") as f:
            f.write(manifest_bytes)

        return manifest, split_dict

    def verify_dataset_integrity(
        self,
        manifest_path: Optional[str] = None
    ) -> DatasetManifestSchema:
        """
        Cryptographically verifies dataset integrity against the manifest SHA-256 hashes.
        Raises DatasetIntegrityError if any file was tampered with, corrupted, or missing.
        """
        if manifest_path is None:
            manifest_file = self.output_base_dir / "manifests" / "dataset_manifest.json"
        else:
            manifest_file = Path(manifest_path)

        if not manifest_file.exists():
            raise DatasetIntegrityError(f"Dataset manifest not found at '{manifest_file}'")

        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            manifest = DatasetManifestSchema.model_validate(manifest_data)
        except Exception as e:
            raise DatasetIntegrityError(f"Failed to parse dataset manifest '{manifest_file}': {str(e)}")

        for file_info in manifest.files:
            candidate_path = self.output_base_dir / file_info.split / file_info.file_name
            if candidate_path.exists():
                file_path = candidate_path
            else:
                file_path = Path(file_info.file_path)

            if not file_path.exists():
                raise DatasetIntegrityError(
                    f"Dataset file missing for split '{file_info.split}' at '{file_path}'"
                )

            with open(file_path, "rb") as f:
                content = f.read()

            actual_sha256 = hashlib.sha256(content).hexdigest()
            if actual_sha256 != file_info.sha256_hash:
                raise DatasetIntegrityError(
                    f"Dataset cryptographic checksum mismatch for '{file_info.split}/{file_info.file_name}'. "
                    f"Expected {file_info.sha256_hash}, computed {actual_sha256}. "
                    "Dataset tampering or corruption detected."
                )

            try:
                records = json.loads(content.decode("utf-8"))
                if len(records) != file_info.record_count:
                    raise DatasetIntegrityError(
                        f"Dataset record count mismatch for '{file_info.split}'. "
                        f"Expected {file_info.record_count}, found {len(records)} records."
                    )
            except json.JSONDecodeError as e:
                raise DatasetIntegrityError(f"Dataset JSON decode failure for '{file_path}': {str(e)}")

        return manifest
