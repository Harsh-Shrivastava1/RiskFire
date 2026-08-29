import sys
from pathlib import Path

# Delegate directly to backend/scripts/seed_database.py
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.scripts.seed_database import seed_database
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deterministic MongoDB Seeding for RiskFire")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe existing collections before seeding (DESTRUCTIVE). Use with intention."
    )
    args = parser.parse_args()
    seed_database(reset=args.reset)
