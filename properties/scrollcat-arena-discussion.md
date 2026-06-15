# ScrollCat Arena — Planning Discussion (captured from ChatGPT)

> Source: https://chatgpt.com/share/6a2c2b35-d544-83e8-ac91-a0a4296aeee7
> Captured 2026-06-12. Title in ChatGPT: "NFT Fighting Character Design".
> This is the raw planning thread between Andy and GPT-5.5, reconstructed in chronological order.
> We continue this plan together inside `F:\bots\scrollcat-main`.

---

## Real-world anchors (links Andy gave)
- NFTs hosted on **Crystara**: https://crystara.trade/marketplace/scrollcat
- $SCAT token (Atmos Token Studio): https://app.atmos.ag/en/token-studio/0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109
- Token contract: `0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109`
- Chain: **Supra** · Wallet: **StarKey** (`window.starkey.supra`)
- Existing collection: ScrollCat, 500 supply, **316 minted** (~63%)

---

## 1. Andy's opening intent
> "Use this image to create an NFT that can fight. I'm trying to create a blockchain game for scrollcat.org. Make the characters a programmable frame."

GPT proposed an NFT structure: Character Core (artwork) + Programmable Frame (on-chain equipment layer) + stats (Attack/Defense/Speed/Intelligence/Energy) + abilities (passive/active/ultimate) + evolution levels + rarity tiers. Recommended separating **Character NFT / Frame NFT / Skill Modules**.

## 2. Modular asset architecture (GPT)
Split the NFT into modular assets rather than one static JPEG:
- **NFT 1 — Character** (never changes; identity)
- **NFT 2 — Weapon** (sword/gun/bow/rocket… swappable)
- **NFT 3 — Armor**
- **NFT 4 — Skill Chip** (unlock powers)
- **NFT 5 — Pet**
Game engine combines them into an "Equipped Character." One character can own hundreds of weapons → weapons become their own trading market (Pokémon + Axie + RPG equipment model).

## 3. Collection size debate
Andy: *"10,000 Character NFTs, is this not too much for an introduction to the market?"*
GPT: Yes, too much for a brand-new game. Recommended **scarcity**: Phase 1 Genesis Collection 250–1,000 (suggested **500 Genesis characters** + modular weapons; optionally a **100 Founder Pass** first to validate demand). Rarity breakdown example: 300 Common / 120 Rare / 60 Epic / 18 Legendary / 2 Mythic.
> ⚓ Real-world fit: ScrollCat already IS a 500-supply collection (316 minted) — the existing cats ARE the Genesis fighters.

## 4. Andy's core game spec (the brief)
> - Members log in with their **SUPRA wallet**; if the ScrollCat NFT isn't in the wallet → error; else enter the arena.
> - **Game arena:** a player waits for another player; if none after **10 seconds**, one of *our* house players fills in (always available to occupy logged-in players).
> - To play, each bets **10 SUPRA**; **winner takes 70%, house keeps 30%**.
> - Give the arena a **colorful scene that changes depending on the powers invoked**. Make it a **fighters den with a health progress bar**.
> - Research fighting-motion games, then write the code. Ask clarifying questions.

## 5. GPT's 5 clarifying questions → Andy's answers
GPT challenged assumptions (security/legality/scalability/trust), flagged the house-bot-stakes fairness issue (house bot should stake its own 10 SUPRA for transparency), and asked 5 questions. **Andy's answers:**
1. **Combat style** → **Hybrid** (active skill choice with a turn timer; not real-time, not pure auto-battle).
2. **NFT as avatar** → **The NFT itself is the fighter.** "That is why I want them single designs. Like a cat not card."
3. **Win rewards** → after **15–20 fights**, player wins house token **$SCAT (~5000)**; OR use an **XP threshold** to win $SCAT. "One of the two works."
4. **On/off-chain** → **Off-chain** gameplay (with on-chain rewards).
5. **Multiple NFTs** → **Yes** — a player can hold more than one and pick which one enters the fight. Scarcity + NFT-gated entry = the NFTs become "hot cake" if the game gets attention → healthy economy for the NFTs.

## 6. ScrollCat Arena v1 design (GPT, post-answers)
- **NFT = animated fighter** (SCAT #001 Samurai Cat, #002 Plasma Gunner, #003 Phantom Archer, #004 Thunder Monk, #005 Void Assassin…).
- **Hybrid combat:** each round ~3 seconds, choose Attack / Block / Dodge / Special / Ultimate; both actions resolve **simultaneously** (e.g. Attack vs Dodge = miss). Strategy without expensive real-time sync.
- **Arena** (Fighters Den): holographic crowd, neon pillars, scroll runes, floating crystals, dynamic lighting. Background **changes with the power invoked** — Fire→lava red, Lightning→electric yellow, Void→purple darkness, Cosmic→galaxy particles, Ice→frozen floor. Animated health bars.
- **Economy:** 10 SUPRA entry each → 20 pot → Winner 14 (70%) / Treasury 6 (30%). (GPT later floated **80/20** as friendlier to players + treasury used to buy back SCAT / fund tournaments.)
- **SCAT rewards** via **XP milestones** (not flat-per-wins, which gets farmed): e.g. 1000 XP→100 SCAT, 5000→600, 10000→1500.
- **Genesis scarcity:** ~300 fighters, fixed. House fighters shown transparently (BOT: Neon Ronin…), bot win-rate kept 40–55%.
- **Tech stack (GPT's suggestion):** Next.js + TS + Tailwind + Framer Motion frontend; **Phaser 3** (or PixiJS) game layer; Node/NestJS + Redis + PostgreSQL + Socket.io backend; SUPRA Wallet SDK; NFT verification via Crystara ownership check.

## 7. Stats: fixed vs leveling
GPT recommended **Option A — base stats fixed forever** + **XP-based cosmetic/rank progression** (prevents veterans becoming unbeatable, keeps matchmaking fair, keeps NFT value predictable for buyers). Discussed optional leveling-with-caps (+40 max), **Fighter DNA** (hidden growth tendencies A/B/C per stat), **Arena Leagues** (Bronze/Silver/Gold/Cosmic Den by level to stop vets farming beginners), **NFT visual evolution** (Lv1 → Lv20 Ascended → Lv50 Cosmic), and a no-stake **Training Grounds** mode vs bots to learn before risking SUPRA. Combat view: **2D side-view fighters** (more marketable than top-down).

## 8. Three-currency economy
Andy: *"can't we sell some actions using the XP or $SCAT for payment? So there will be $SCAT earned, XP earned, and SUPRA earned on the player viewing board."*
GPT — three distinct currencies:
- **SUPRA** = real-value stakes: arena entry (10), tournaments, high-roller arena, buy NFTs on Crystara.
- **XP** = non-tradeable progression: levels, titles, leagues, badges, unlock arenas/animations/emotes/finishers.
- **SCAT** = ecosystem/cosmetics: arena effects (500), entrance animations (1000), finishing moves (2500), taunts (250), arena themes (5000), rename fighter (1000), auras (500), tournament entry (500), seasonal battle pass (2000).
- **NFT** = required to enter; owns XP + unlocked skills; tradable on Crystara.
- **Player dashboard** (top-right): Wallet Connected · SUPRA · SCAT · XP · Selected Fighter.
- **SCAT sinks** are critical (tokens must come back, not just go out). Later: **NFT rentals** (owner 10% / renter 90%) to grow player base without minting more.
- **Hard rule:** SCAT does **NOT** buy combat power (no Attack/Defense/Health/Speed/Crit). Only cosmetics/access/tournaments. → no pay-to-win.

## 9. GPT's final recommendation — "ScrollCat Skill Tree System"
Every NFT has a unique **skill tree**. Players spend SCAT to **unlock abilities** but **cannot increase base stats**. Equip only 1 Basic + 2 Skills + 1 Ultimate at a time → strategy + SCAT demand + NFT uniqueness without wallet-size-wins. Add a **Skill Marketplace** (sell unlocked skill scrolls for SCAT or SUPRA), feeding NFT + SCAT + SUPRA economies into each other.

**Leanest shippable v1 (GPT):**
1. NFT login via SUPRA wallet
2. 300 Genesis fighters
3. Hybrid combat
4. XP ranking system
5. SCAT-powered skill trees
6. 10 SUPRA ranked matches
7. House bots after 10 seconds (transparent)
8. Seasonal leaderboard rewards

> Guiding principle GPT landed on: **Skill determines winners · NFTs determine access · SUPRA provides stakes · XP provides progression · SCAT powers cosmetics/tournaments/ecosystem.**

---

## Locked decisions (Andy, explicit)
- NFT **is** the fighter — single cat designs, not cards.
- **Hybrid** combat (timed action choice, simultaneous resolution).
- **Off-chain** gameplay, **on-chain** rewards.
- SUPRA-wallet + NFT-gated login (StarKey, Crystara ownership).
- 10 SUPRA entry; winner 70% / house 30% (revisit 80/20).
- House fighter fills after 10s; multiple NFTs per wallet, pick your fighter.
- Three currencies: SUPRA (stakes) · XP (progression) · SCAT (cosmetics/ecosystem).
- $SCAT won by XP threshold and/or fight-count milestone.

## Open questions to resolve before code
1. **Fighter classes vs existing art** — the 500 existing ScrollCats aren't pre-sorted into Samurai/Gunner/Archer/Assassin/Mystic. How do we map existing NFT traits → classes + base stats? (Deterministic from token ID/traits?)
2. **Stats source of truth** — fixed stats derived from each cat's existing metadata, or a fresh stat sheet we assign?
3. **Tech stack** — GPT's NestJS/Postgres/Redis/Socket.io is heavy. ScrollCat is Vite/React + Cloudflare Pages + Convex already. Recommend reusing that (Convex for off-chain game state + realtime, Phaser/PixiJS canvas) instead of standing up a new backend.
4. **SUPRA escrow** — how stakes are actually held/paid off-chain-with-on-chain-settlement (custodial house wallet? signed claims?). Legal/trust implications of real-money PvP.
5. **v1 scope** — full PvP economy, or a **playable single-player-vs-house demo first** (prove the combat feel + arena visuals) before wiring real SUPRA stakes?
