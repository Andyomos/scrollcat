# ScrollCat Arena — Combat Spec (LOCKED 2026-06-12)

Hybrid round-based combat. Each round both players secretly pick one action (≤3s timer; on timeout in a live PvP a default is chosen). Both actions resolve **simultaneously** through a deterministic, seeded engine — same inputs always produce the same outcome (required for on-chain settlement in Phase 2). Implemented as a pure function: `simulateRound(state, actionA, actionB, rng) → state'`.

## Actions
| Action | Cost | Role |
|---|---|---|
| ⚔ **Attack** | free | Safe baseline damage. Builds energy. |
| 🛡 **Block** | free | Negates Attack; does no damage. **Pierced by Special.** |
| 💨 **Dodge** | free | Evades Attack & Special; deals nothing (tempo loss). |
| 🔥 **Special** | 30 ENR | Strong, **pierces Block**. Missed by Dodge. |
| ☄ **Ultimate** | 100 ENR (full) | Huge; **unblockable + undodgeable**. Only at full meter. |

## Interaction matrix (row = attacker's choice vs col = opponent's)
| | vs Attack | vs Block | vs Special | vs Dodge | vs Ultimate |
|---|---|---|---|---|---|
| **Attack** | both land | dmg ×0.2 | both land | **miss** | both land |
| **Block** | negate | — | **pierced (take full)** | — | take full (unblockable) |
| **Special** | both land | **full to blocker** | both land | **miss** | both land |
| **Dodge** | evade | — | evade | — | take full (undodgeable) |
| **Ultimate** | both land | full (unblockable) | both land | full (undodgeable) | both land |

Triangle: **Attack** → countered by **Block/Dodge** → **Special** punishes Block → **Dodge** evades Attack+Special but deals 0 → a dodge-turtle deals no damage and just feeds energy into the opponent's **Ultimate**, which it cannot avoid. Self-balancing.

## Numbers
- **HP** = `100 + DEF` (Defense = survivability).
- **Energy (ENR)** 0→100. `+20` start of each round, `+10` when you land a hit. Special spends 30, Ultimate spends 100.
- **Damage** = `skillBase × ATK / (ATK + targetDEF) × critMod`, floored to int.
  - `skillBase`: Attack 30 · Special 48 · Ultimate 80.
  - `critMod`: 1.5 on crit, else 1. **Crit chance** = `SPD / 320`.
- **SPD = initiative.** On a round where both could deal lethal damage, the higher-SPD fighter applies damage first; if that KOs, the opponent's damage does not land. Ties → seeded coin.

## Match end
HP ≤ 0 → opponent wins. Hard **round cap 20** → higher **HP%** wins → tie broken by higher ENR → seeded coin. No stalls.

## House bot AI (seeded, win-rate target 40–55%)
Heuristic weights: Ultimate if meter full (70%); Special if ENR≥30 and opp not likely dodging; Block when HP < 30%; Dodge to bait Specials; else Attack. All rolls from the match seed so the fight is replayable/verifiable.

## Demo vs Phase 2
- **Demo:** engine runs client-side; opponent = house bot; XP persisted in localStorage per NFT id; SUPRA/SCAT display-only.
- **Phase 2:** identical engine runs server-authoritative in a Cloudflare **Durable Object** (match room); seed + action log signed; outcome settles SUPRA on-chain. Zero engine rewrite because it's already pure.
