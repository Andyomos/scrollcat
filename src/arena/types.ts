import type { Rarity } from '@/lib/constants'

/** The 8 Genesis fighter classes from the concept art (fighters-roster.md). */
export type Archetype =
  | 'neon-blade'
  | 'shadow-gunner'
  | 'phantom-archer'
  | 'tech-mage'
  | 'rocket-cat'
  | 'dual-wield'
  | 'thunder-claw'
  | 'ninja-scat'

/** Visual power element — drives the Fighters' Den colour reaction. */
export type Element = 'cosmic' | 'void' | 'spirit' | 'arcane' | 'fire' | 'rapid' | 'shock' | 'shadow'

export type ActionKind = 'attack' | 'block' | 'dodge' | 'special' | 'ultimate'

export interface Skill {
  name: string
  desc: string
}

/** Static definition of an archetype (base stats + skills). */
export interface FighterClass {
  archetype: Archetype
  name:      string
  tag:       string      // e.g. "Melee / Slash"
  element:   Element
  atk: number
  def: number
  spd: number
  enr: number            // flavour stat shown on card; ult cost is fixed at 100
  active:   Skill
  ultimate: Skill
}

/** A concrete fighter taken into battle: an archetype bound to a real NFT. */
export interface Fighter {
  /** NFT token id this fighter is derived from (the access pass). */
  nftId:   number
  nftName: string
  image:   string
  rarity:  Rarity
  cls:     FighterClass
  // Effective combat stats after rarity scaling.
  atk: number
  def: number
  spd: number
}

/** Mutable per-fighter combat state during a match. */
export interface Combatant {
  fighter: Fighter
  hp:    number
  maxHp: number
  energy: number         // 0..100
}

export interface RoundEvent {
  round:    number
  actionA:  ActionKind
  actionB:  ActionKind
  dmgToA:   number
  dmgToB:   number
  critA:    boolean
  critB:    boolean
  /** element to flash the arena with this round, if a special/ultimate fired */
  flash?:   Element
  note:     string
}

export interface MatchResult {
  winner: 'A' | 'B' | 'draw'
  rounds: RoundEvent[]
  finalA: Combatant
  finalB: Combatant
}
