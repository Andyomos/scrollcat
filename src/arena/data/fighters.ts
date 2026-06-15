import type { Archetype, Element, FighterClass, Fighter } from '../types'
import { NFTS, type NFT } from '@/lib/nfts'
import type { Rarity } from '@/lib/constants'

/** The 8 Genesis fighter classes — stats & skills straight from the roster art. */
export const FIGHTER_CLASSES: Record<Archetype, FighterClass> = {
  'neon-blade': {
    archetype: 'neon-blade', name: 'Neon Blade', tag: 'Melee / Slash', element: 'cosmic',
    atk: 85, def: 70, spd: 95, enr: 60,
    active:   { name: 'Neon Dash',          desc: 'Dash across the arena with a neon-infused slash.' },
    ultimate: { name: 'Cosmic Claw Barrage', desc: 'Unleash a barrage of cosmic claw strikes.' },
  },
  'shadow-gunner': {
    archetype: 'shadow-gunner', name: 'Shadow Gunner', tag: 'Ranged / Pierce', element: 'void',
    atk: 90, def: 65, spd: 80, enr: 55,
    active:   { name: 'Echo Shot',        desc: 'Fire a high-speed shot that pierces through enemies.' },
    ultimate: { name: 'Void Bullet Storm', desc: 'Unleash a storm of void bullets.' },
  },
  'phantom-archer': {
    archetype: 'phantom-archer', name: 'Phantom Archer', tag: 'Ranged / Piercing Arrow', element: 'spirit',
    atk: 78, def: 60, spd: 90, enr: 70,
    active:   { name: 'Spectre Arrow', desc: 'Fire an arrow that ignores defense and reveals enemies.' },
    ultimate: { name: 'Spirit Rain',   desc: 'Summon a rain of phantom arrows from the sky.' },
  },
  'tech-mage': {
    archetype: 'tech-mage', name: 'Tech Mage', tag: 'Magic / Energy Burst', element: 'arcane',
    atk: 55, def: 70, spd: 55, enr: 95,
    active:   { name: 'Arcane Pulse',    desc: 'Release a pulse that damages and pierces enemies.' },
    ultimate: { name: 'Dimensional Rift', desc: 'Open a rift that pulls enemies in and disrupts them.' },
  },
  'rocket-cat': {
    archetype: 'rocket-cat', name: 'Rocket Cat', tag: 'Explosive', element: 'fire',
    atk: 92, def: 75, spd: 60, enr: 50,
    active:   { name: 'Rocket Dash', desc: 'Dash forward and explode, damaging nearby enemies.' },
    ultimate: { name: 'Mega Rocket', desc: 'Launch a massive rocket that devastates the zone.' },
  },
  'dual-wield': {
    archetype: 'dual-wield', name: 'Dual Wield', tag: 'Ranged / Rapid Fire', element: 'rapid',
    atk: 88, def: 60, spd: 95, enr: 55,
    active:   { name: 'Twin Strike', desc: 'Attack rapidly with both weapons for massive damage.' },
    ultimate: { name: 'Bullet Time', desc: 'Slow down time and unleash a barrage of bullets.' },
  },
  'thunder-claw': {
    archetype: 'thunder-claw', name: 'Thunder Claw', tag: 'Melee / Shock', element: 'shock',
    atk: 93, def: 80, spd: 85, enr: 60,
    active:   { name: 'Lightning Claw', desc: 'Slash with lightning speed and stun the enemy.' },
    ultimate: { name: 'Thunder Fury',   desc: 'Unleash a devastating thunderstorm.' },
  },
  'ninja-scat': {
    archetype: 'ninja-scat', name: 'Ninja Scat', tag: 'Stealth / Critical', element: 'shadow',
    atk: 50, def: 50, spd: 100, enr: 65,
    active:   { name: 'Shadow Step',  desc: 'Teleport behind the enemy and deal critical damage.' },
    ultimate: { name: 'Shadow Clone', desc: 'Create clones and attack from all directions.' },
  },
}

export const ARCHETYPE_LIST = Object.keys(FIGHTER_CLASSES) as Archetype[]

/** Element → arena flash colour (Fighters' Den reaction). */
export const ELEMENT_COLOR: Record<Element, string> = {
  cosmic: '#a855f7',
  void:   '#6d28d9',
  spirit: '#e0e7ff',
  arcane: '#3b82f6',
  fire:   '#f97316',
  rapid:  '#22d3ee',
  shock:  '#facc15',
  shadow: '#111827',
}

const RARITY_SCALE: Record<Rarity, number> = {
  Common: 1.0, Uncommon: 1.05, Rare: 1.1, Epic: 1.16, Legendary: 1.22, Mythic: 1.3,
}

/**
 * Deterministically assign one of the 8 warrior archetypes to an existing
 * ScrollCat NFT, using its real traits (Model A — the cat's "battle form").
 * Same NFT always yields the same fighter class.
 */
export function archetypeForNFT(nft: NFT): Archetype {
  const { Prop, Effect, Pose } = nft.traits
  const e = Effect.toLowerCase()
  const p = Prop.toLowerCase()
  const pose = Pose.toLowerCase()

  if (e.includes('lightning')) return 'thunder-claw'
  if (e.includes('fire'))      return 'rocket-cat'
  if (e.includes('glitch'))    return 'ninja-scat'
  if (p.includes('crystal'))   return 'tech-mage'
  if (p.includes('scroll'))    return 'phantom-archer'
  if (p.includes('smartphone') || p.includes('hologram') || p.includes('phone')) return 'shadow-gunner'
  if (e.includes('speed') || pose.includes('running')) return 'neon-blade'
  if (pose.includes('surfing')) return 'dual-wield'
  // Stable fallback spread across remaining classes by id.
  return ARCHETYPE_LIST[nft.id % ARCHETYPE_LIST.length]
}

/** Build a battle-ready Fighter from an NFT (stats scaled by rarity). */
export function fighterFromNFT(nft: NFT): Fighter {
  const cls = FIGHTER_CLASSES[archetypeForNFT(nft)]
  const s = RARITY_SCALE[nft.rarity]
  return {
    nftId: nft.id, nftName: nft.name, image: nft.image, rarity: nft.rarity, cls,
    atk: Math.round(cls.atk * s),
    def: Math.round(cls.def * s),
    spd: Math.min(100, Math.round(cls.spd * s)),
  }
}

/** Full playable roster derived from the live collection. */
export const ROSTER: Fighter[] = NFTS.map(fighterFromNFT)

/** Pick a house opponent — any fighter other than the player's. */
export function houseOpponent(playerNftId: number, seedInt: number): Fighter {
  const pool = ROSTER.filter(f => f.nftId !== playerNftId)
  return pool[seedInt % pool.length]
}

/** On-chain TOKEN_n → design slug (from the collection metadata URIs). */
const TOKEN_SLUG: Record<string, string> = {
  TOKEN_1: 'chainghost',  TOKEN_2: 'cosmicsovereign', TOKEN_3: 'dgenoracle',
  TOKEN_4: 'doomscroller', TOKEN_5: 'feedphantom',     TOKEN_6: 'flamekeeper',
  TOKEN_7: 'genesisone',   TOKEN_8: 'gridwatcher',     TOKEN_9: 'shadowglitch',
  TOKEN_10: 'sigmascroll', TOKEN_11: 'infinitescroller', TOKEN_12: 'voidrider',
}

export interface HeldCat { name: string; property_version?: string; rarity?: string }

/** Build a Fighter from an on-chain held token (TOKEN_n + real rarity). */
export function fighterFromToken(held: HeldCat): Fighter | null {
  const slug = TOKEN_SLUG[held.name]
  if (!slug) return null
  const nft = NFTS.find(n => n.image.includes(slug))
  if (!nft) return null
  const onchain = held.rarity as Rarity | undefined
  const merged: NFT = onchain ? { ...nft, rarity: onchain } : nft
  return fighterFromNFT(merged)
}

/** The player's actual roster, from the ownership-check `held` list. */
export function myFighters(held: HeldCat[]): Fighter[] {
  return held.map(fighterFromToken).filter((f): f is Fighter => f !== null)
}
