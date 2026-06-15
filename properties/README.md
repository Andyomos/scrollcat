# ScrollCat Arena — Design Dossier (packed up 2026-06-12)

Everything needed to resume building **ScrollCat Arena** (product) / **Fighters' Den** (the arena). Read in this order:

1. **`scrollcat-arena-discussion.md`** — the full original planning thread (Andy ↔ ChatGPT), reconstructed. Locked decisions + open questions.
2. **`fighters-roster.md`** — the 8 Genesis fighter classes, stats, skills, Programmable Frame system, rarity tiers — extracted from the concept art.
3. **`combat-spec.md`** — LOCKED hybrid combat ruleset: action matrix, damage/energy formulas, match-end, bot AI, demo-vs-Phase-2.
4. **`economy-spec.md`** — LOCKED three-currency model (XP free/infinite · $SCAT real/treasury-funded · SUPRA stakes) + the solvency flywheel.
5. **`onchain-integration.md`** — reverse-engineered Supra ownership gate: real creator `0x05eb2a…`, TOKEN_1..12, the verified tx-scan + table-read method. The real NFT-gated login.

## Art
- `parent.png` — hero "Neon Blade" (visual North Star).
- `ChatGPT Image Jun 12, 2026, 10_26_36 AM.png` — the 8-fighter roster sheet.

## Decisions locked with Andy (2026-06-12)
- Name: **ScrollCat Arena** / venue **Fighters' Den**.
- NFT model: **existing 500 = the gate now** (Model A — each cat maps to a warrior battle-form). Dedicated Fighter NFTs = **Season 2**.
- Stack: **Vite/React/TS/Tailwind/Framer on Cloudflare Pages**; combat = pure deterministic TS engine; PvP later via **Durable Objects**. (No Node/Postgres/Redis.)
- v1 = **playable single-player-vs-house demo**, no real SUPRA. XP real, SUPRA/SCAT simulated.
- Combat: hybrid, 5 actions, simultaneous resolution, energy-gated ultimates.
- Economy: 80/20 SUPRA split; SCAT never buys power; payouts treasury-capped.

## Code home
`src/arena/` — `types.ts`, `data/fighters.ts` (8 archetypes + NFT→fighter mapping), `engine/combat.ts` (pure), `engine/rng.ts`. Page: `src/pages/Arena.tsx`, route `/arena` (StarKey + NFT gated).

## Next steps (Phase 1 polish → Phase 2)
- [ ] PixiJS visual layer for the Den (currently React/Framer-rendered).
- [ ] Animated fighter sprites (Higgsfield) for side-view combat.
- [ ] Cloudflare D1/KV for XP persistence (currently localStorage).
- [ ] Phase 2: Durable Object match rooms, real SUPRA escrow + settlement, SCAT treasury + buyback.
