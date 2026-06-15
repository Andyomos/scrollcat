# ScrollCat Arena — Genesis Fighter Roster (from concept art)

> Source art: `properties/parent.png` (hero "Neon Blade") + `properties/ChatGPT Image Jun 12, 2026, 10_26_36 AM.png` (8-fighter roster sheet).
> Captured 2026-06-12. This is the canonical stat/skill spec extracted from the art. Will be ported to TS data (`src/arena/data/fighters.ts`) at scaffold time.

## Visual direction (locked by art)
- Dark cosmic background (deep purple/indigo nebula), neon **cyan + magenta/pink + violet** accents.
- Each fighter = an armored/cyberpunk **warrior cat**, glowing infinity-eye, $CAT neon tag, SUPRA logo.
- Brand lockup: **"FIGHT. UPGRADE. EARN. OWN YOUR LEGEND."** · scrollcat.org · SUPRA.

## Stat model (4 stats per fighter)
Order as shown on cards: **ATK** (red crossed-swords) · **DEF** (blue shield) · **SPD** (green) · **ENR/Energy** (yellow).
Each fighter has one **Active** skill and one **Ultimate**. Class/range tag sits top-left (Melee / Ranged / Magic / Explosive / Stealth).

| # | Name | Class / Tag | ATK | DEF | SPD | ENR | Active | Ultimate |
|---|------|-------------|-----|-----|-----|-----|--------|----------|
| 001 | **Neon Blade** | Melee / Slash | 85 | 70 | 95 | 60 | **Neon Dash** — dash across the arena with a neon-infused slash | **Cosmic Claw Barrage** — unleash a barrage of cosmic claw strikes |
| 002 | **Shadow Gunner** | Ranged / Pierce | 90 | 65 | 80 | 55 | **Echo Shot** — fire a high-speed shot that pierces through enemies | **Void Bullet Storm** — unleash a storm of void bullets |
| 003 | **Phantom Archer** | Ranged / Piercing Arrow | 78 | 60 | 90 | 70 | **Spectre Arrow** — fire an arrow that ignores defense and reveals enemies | **Spirit Rain** — summon a rain of phantom arrows from the sky |
| 004 | **Tech Mage** | Magic / Energy Burst | 55 | 70 | 55 | 95 | **Arcane Pulse** — release a pulse that damages and pierces enemies | **Dimensional Rift** — open a rift that pulls enemies in and disrupts them |
| 005 | **Rocket Cat** | Explosive | 92 | 75 | 60 | 50 | **Rocket Dash** — dash forward and explode, damaging nearby enemies | **Mega Rocket** — launch a massive rocket that devastates the zone |
| 006 | **Dual Wield** | Ranged / Rapid Fire | 88 | 60 | 95 | 55 | **Twin Strike** — attack rapidly with both weapons for massive damage | **Bullet Time** — slow down time and unleash a barrage of bullets |
| 007 | **Thunder Claw** | Melee / Shock | 93 | 80 | 85 | 60 | **Lightning Claw** — slash with lightning speed and stun the enemy | **Thunder Fury** — unleash a devastating thunderstorm |
| 008 | **Ninja Scat** | Stealth / Critical | 50 | 50 | 100 | 65 | **Shadow Step** — teleport behind the enemy and deal critical damage | **Shadow Clone** — create clones and attack from all directions |

## Power → Arena reaction (drives the colorful Fighters' Den)
Each Ultimate/Special repaints the Den:
- Neon Blade / cosmic → galaxy particles, violet bloom
- Shadow Gunner / void → purple darkness
- Phantom Archer / spirit → pale ghost-white arrow rain
- Tech Mage / arcane → blue energy rift
- Rocket Cat / explosive → lava-red blast
- Thunder Claw / shock → electric-yellow flashes
- Ninja Scat / stealth → shadow black-out + clone afterimages

## Programmable Frame system (footer of art)
- Actions: **Equip · Upgrade · Evolve**
- **Frame Module Slots:** Weapon · Core · Armor · Chip · Booster (modular — bought/traded separately, do NOT alter base stats beyond capped bonuses)
- **Rarity Tiers:** Common · Uncommon · Rare · Epic · Legendary (paw icons)

## OPEN reconciliation (needs Andy's call)
The 8 fighters above are a **new warrior-cat design language**, distinct from the **12 existing minted ScrollCat artworks** (Doomscroller, Grid Watcher, Feed Phantom, Chain Ghost, Cosmic Sovereign, Void Rider… — the meme/scroll cats, 316/500 minted). How do they relate?
- **Model A — Evolution skins:** existing cats map deterministically to one of the 8 fighter classes by trait (Prop→weapon, Effect→element, Pose→stance); the warrior art is the "battle form" of your existing cat. Preserves "your NFT is your fighter," reuses existing holders.
- **Model B — New Genesis Fighter drop:** the 8 are a fresh fighter collection; existing ScrollCat holders get guaranteed/airdropped access or a founder discount. Cleaner art identity, but a new mint.
- **Model C — Hybrid:** existing cat = access pass + identity badge; pick any of the 8 fighter frames to battle with. Decouples collectible from playable.
> Recommendation: **Model A** for the demo (no new mint, existing holders instantly have a fighter), keep B as a Season-2 expansion. Confirm before we wire the fighter-selection data model.
