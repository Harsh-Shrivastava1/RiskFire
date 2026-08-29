import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from backend.app.schemas.attack import AttackAgentType, AttackStepSchema


class AttackEngine:
    """
    Deterministic adversarial attack execution engine.
    Generates synthetic attack transactions and evasion patterns.
    """

    def generate_attack_stream(
        self,
        simulation_id: str,
        agent_type: AttackAgentType,
        attack_count: int,
        start_time_iso: str,
        rng: random.Random,
        entity_pool: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        attacks: List[Dict[str, Any]] = []
        base_time = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))

        accounts = entity_pool.get("accounts", [])
        devices = entity_pool.get("devices", [])
        ips = entity_pool.get("ips", [])
        addresses = entity_pool.get("addresses", [])
        instruments = entity_pool.get("payment_instruments", [])

        if not accounts or not devices:
            return attacks

        if agent_type == AttackAgentType.IDENTITY_FRAGMENTER:
            # 8 accounts sharing ONE device and ONE address
            shared_device = devices[0]["id"]
            shared_address = addresses[0]["id"]
            adv_accounts = accounts[:min(8, len(accounts))]

            for i in range(attack_count):
                acc = adv_accounts[i % len(adv_accounts)]
                ip = ips[rng.randint(0, len(ips) - 1)]["id"]
                inst = instruments[rng.randint(0, len(instruments) - 1)]["id"]
                sim_dt = base_time + timedelta(seconds=i * 20)
                amount = float(rng.randint(2500, 7500))

                txn_id = f"txn-adv-{uuid.UUID(int=rng.getrandbits(128))}"
                attacks.append({
                    "id": txn_id,
                    "simulation_id": simulation_id,
                    "account_id": acc["id"],
                    "device_id": shared_device,
                    "ip_id": ip,
                    "address_id": shared_address,
                    "payment_instrument_id": inst,
                    "amount": amount,
                    "created_at_sim": sim_dt.isoformat(),
                    "is_adversarial": True,
                    "attack_type": agent_type.value,
                    "scenario_step": i + 1,
                })

        elif agent_type == AttackAgentType.VELOCITY_ATTACKER:
            # Account velocity attacker: pulsing at 10.1 minutes or fast bursts
            acc = accounts[0]["id"]
            dev = devices[0]["id"]
            ip = ips[0]["id"]
            addr = addresses[0]["id"]
            inst = instruments[0]["id"]

            for i in range(attack_count):
                # Micro pulse spaced at 610s (10.1 min) or rapid sub-burst
                step_offset = (i // 3) * 610 + (i % 3) * 15
                sim_dt = base_time + timedelta(seconds=step_offset)
                amount = float(rng.randint(3000, 8000))

                txn_id = f"txn-adv-{uuid.UUID(int=rng.getrandbits(128))}"
                attacks.append({
                    "id": txn_id,
                    "simulation_id": simulation_id,
                    "account_id": acc,
                    "device_id": dev,
                    "ip_id": ip,
                    "address_id": addr,
                    "payment_instrument_id": inst,
                    "amount": amount,
                    "created_at_sim": sim_dt.isoformat(),
                    "is_adversarial": True,
                    "attack_type": agent_type.value,
                    "scenario_step": i + 1,
                })

        else:
            # General multi-vector adversarial traffic
            for i in range(attack_count):
                acc = accounts[rng.randint(0, min(5, len(accounts) - 1))]["id"]
                dev = devices[rng.randint(0, min(3, len(devices) - 1))]["id"]
                ip = ips[rng.randint(0, len(ips) - 1)]["id"]
                addr = addresses[rng.randint(0, len(addresses) - 1)]["id"]
                inst = instruments[rng.randint(0, len(instruments) - 1)]["id"]
                sim_dt = base_time + timedelta(seconds=i * 30)
                amount = float(rng.randint(2000, 15000))

                txn_id = f"txn-adv-{uuid.UUID(int=rng.getrandbits(128))}"
                attacks.append({
                    "id": txn_id,
                    "simulation_id": simulation_id,
                    "account_id": acc,
                    "device_id": dev,
                    "ip_id": ip,
                    "address_id": addr,
                    "payment_instrument_id": inst,
                    "amount": amount,
                    "created_at_sim": sim_dt.isoformat(),
                    "is_adversarial": True,
                    "attack_type": agent_type.value,
                    "scenario_step": i + 1,
                })

        return attacks
