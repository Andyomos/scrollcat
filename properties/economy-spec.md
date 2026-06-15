# ScrollCat Arena — Economy Spec (LOCKED 2026-06-12)

Three currencies, three jobs. The cardinal rule: **XP is free and infinite (ours to mint); $SCAT is real, finite, on-chain (must be treasury-funded).** Never let SCAT payouts exceed treasury inflows or the game goes insolvent.

## Currencies
| | XP | $SCAT | SUPRA |
|---|---|---|---|
| Nature | DB counter (off-chain) | Real token (Atmos, fixed supply) | Real L1 gas/value token |
| Supply | Infinite — we mint | Finite — cannot print | External |
| Tradeable | No (per-NFT) | Yes | Yes |
| Job | **Progression** | **Ecosystem / cosmetics** | **Stakes** |

## XP — how it's made
Pure database increment bound to each cat's fighter record (per-NFT, so a leveled cat is worth more on resale). Sources: **Win +100 · Draw +50 · Loss +25**, plus first-win-of-day bonus and win-streak multipliers. Unlocks: levels, ranks, leagues (Bronze→Cosmic), titles, cosmetic evolution, and **gates SCAT milestone payouts**. Never tradeable, never buys combat power.

## $SCAT — solvency by design
We cannot conjure SCAT, so every reward is paid from a pre-funded **Rewards Treasury** wallet, and payouts are **capped + periodic** (XP milestones + leaderboard), never per-fight (which gets farmed to zero).
- Earn (out of treasury): `1000 XP→100 SCAT · 5000→600 · 10000→1500`; monthly leaderboard `Top10→50k · Top50→10k · Top100→5k`.
- Spend (back to treasury / burn) — **cosmetics & access only, never power**: arena themes (5000) · finishing moves (2500) · entrance animations (1000) · rename (1000) · auras (500) · taunts (250) · tournament entry (500) · seasonal battle pass (2000).

## SUPRA — stakes
Ranked entry 10 SUPRA each → 20 pot → **Winner 80% (16) / Treasury 20% (4)** *(revised down from 70/30 for retention — Andy's dial)*. House bot stakes its own 10 for transparency. Treasury SUPRA partly **buys $SCAT on the open market** → buy pressure + refills the SCAT Rewards Treasury.

## The flywheel
```
SUPRA stakes → house cut → buy $SCAT (price ↑) → refill Rewards Treasury
   → players earn $SCAT (XP milestones/leaderboard) → spend on cosmetics
   → back to treasury/burn.   NFTs gate entry → existing 500 floor ↑ as game grows.
```

## Player dashboard (top-right, always visible)
`Wallet ✓ · SUPRA balance · $SCAT balance · XP/level · Selected Fighter`

## Demo scope
XP is **real** (localStorage per NFT now → D1/KV later). SUPRA + SCAT are **simulated/display-only** until the loop is proven fun. No real token moves in v1. Real treasury + buyback + on-chain settlement = Phase 2/3. See [[combat-spec]] and `fighters-roster.md`.
