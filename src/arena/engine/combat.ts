// Pure, deterministic combat engine for ScrollCat Arena.
// Same inputs (fighters + seed + action sequence) always produce the same
// result. Runs client-side in the demo; the identical module runs
// server-authoritative in a Durable Object in Phase 2. See combat-spec.md.

import type { Combatant, Fighter, ActionKind, RoundEvent, MatchResult } from '../types'
import type { RNG } from './rng'

export const SPECIAL_COST = 30
export const ULT_COST     = 100
export const MAX_ENERGY   = 100
export const ENERGY_REGEN = 20
export const ENERGY_ON_HIT = 10
export const ROUND_CAP    = 20

const SKILL_BASE: Record<'attack' | 'special' | 'ultimate', number> = {
  attack: 30, special: 48, ultimate: 80,
}

export function initCombatant(fighter: Fighter): Combatant {
  const maxHp = 100 + fighter.def
  return { fighter, hp: maxHp, maxHp, energy: 0 }
}

export function legalActions(c: Combatant): ActionKind[] {
  const acts: ActionKind[] = ['attack', 'block', 'dodge']
  if (c.energy >= SPECIAL_COST) acts.push('special')
  if (c.energy >= ULT_COST)     acts.push('ultimate')
  return acts
}

/** +20 energy at the start of a round (capped). Returns a new Combatant. */
export function startRound(c: Combatant): Combatant {
  return { ...c, energy: Math.min(MAX_ENERGY, c.energy + ENERGY_REGEN) }
}

const critChance = (spd: number) => spd / 320

/** Base damage an actor's action deals, given the target's action. */
function actorBase(actor: ActionKind, target: ActionKind): number {
  switch (actor) {
    case 'attack':
      if (target === 'dodge') return 0          // miss
      if (target === 'block') return SKILL_BASE.attack * 0.2
      return SKILL_BASE.attack
    case 'special':
      if (target === 'dodge') return 0          // missed by dodge
      return SKILL_BASE.special                 // pierces block
    case 'ultimate':
      return SKILL_BASE.ultimate                // unblockable + undodgeable
    default:
      return 0                                  // block / dodge deal nothing
  }
}

function rolledDamage(atk: number, def: number, base: number, attackerSpd: number, rng: RNG) {
  if (base <= 0) return { dmg: 0, crit: false }
  const ratio = atk / (atk + def)
  const crit = rng.chance(critChance(attackerSpd))
  const dmg = Math.max(1, Math.floor(base * ratio * (crit ? 1.5 : 1)))
  return { dmg, crit }
}

/**
 * Resolve one round. `a` and `b` must already have had startRound() applied.
 * Returns the next states and a RoundEvent. Simultaneous, but on a mutually
 * lethal exchange the higher-SPD fighter lands first (SPD = initiative).
 */
export function resolveRound(
  a: Combatant, b: Combatant,
  actA: ActionKind, actB: ActionKind,
  rng: RNG, round: number,
): { a: Combatant; b: Combatant; event: RoundEvent } {
  // Spend energy on specials/ultimates.
  let ea = a.energy, eb = b.energy
  if (actA === 'special')  ea -= SPECIAL_COST
  if (actA === 'ultimate') ea -= ULT_COST
  if (actB === 'special')  eb -= SPECIAL_COST
  if (actB === 'ultimate') eb -= ULT_COST

  const baseAtoB = actorBase(actA, actB)
  const baseBtoA = actorBase(actB, actA)
  const hitAtoB = rolledDamage(a.fighter.atk, b.fighter.def, baseAtoB, a.fighter.spd, rng)
  const hitBtoA = rolledDamage(b.fighter.atk, a.fighter.def, baseBtoA, b.fighter.spd, rng)

  let dmgToB = hitAtoB.dmg
  let dmgToA = hitBtoA.dmg

  // Initiative: if both would deal damage, faster lands first and can cancel
  // the slower's hit by KO.
  if (dmgToA > 0 && dmgToB > 0) {
    const aFirst = a.fighter.spd >= b.fighter.spd
    if (aFirst && dmgToB >= b.hp) dmgToA = 0
    else if (!aFirst && dmgToA >= a.hp) dmgToB = 0
  }

  const hpA = Math.max(0, a.hp - dmgToA)
  const hpB = Math.max(0, b.hp - dmgToB)

  // Energy reward for landing a hit.
  if (dmgToB > 0) ea = Math.min(MAX_ENERGY, ea + ENERGY_ON_HIT)
  if (dmgToA > 0) eb = Math.min(MAX_ENERGY, eb + ENERGY_ON_HIT)

  // Which element flash, if a special/ultimate fired this round.
  const flash =
    actA === 'ultimate' || actA === 'special' ? a.fighter.cls.element
    : actB === 'ultimate' || actB === 'special' ? b.fighter.cls.element
    : undefined

  const event: RoundEvent = {
    round, actionA: actA, actionB: actB,
    dmgToA, dmgToB, critA: hitBtoA.crit && dmgToA > 0, critB: hitAtoB.crit && dmgToB > 0,
    flash,
    note: describeRound(a, b, actA, actB, dmgToA, dmgToB),
  }

  return {
    a: { ...a, hp: hpA, energy: ea },
    b: { ...b, hp: hpB, energy: eb },
    event,
  }
}

function describeRound(
  a: Combatant, b: Combatant, actA: ActionKind, actB: ActionKind,
  dmgToA: number, dmgToB: number,
): string {
  const A = a.fighter.nftName, B = b.fighter.nftName
  const parts: string[] = []
  if (dmgToB > 0) parts.push(`${A} ${verb(actA)} ${B} for ${dmgToB}`)
  else if (actA === 'attack' || actA === 'special') parts.push(`${A}'s ${actA} missed`)
  if (dmgToA > 0) parts.push(`${B} ${verb(actB)} ${A} for ${dmgToA}`)
  else if (actB === 'attack' || actB === 'special') parts.push(`${B}'s ${actB} missed`)
  if (parts.length === 0) parts.push('Both hold — no damage')
  return parts.join(' · ')
}

function verb(a: ActionKind): string {
  return a === 'ultimate' ? 'ULTIMATES' : a === 'special' ? 'specials' : 'hits'
}

/** House-bot action chooser. Seeded → reproducible. Target win-rate ~40–55%. */
export function chooseBotAction(self: Combatant, opp: Combatant, rng: RNG): ActionKind {
  const legal = legalActions(self)
  if (legal.includes('ultimate') && rng.chance(0.7)) return 'ultimate'
  if (self.hp < self.maxHp * 0.3 && rng.chance(0.5)) return 'block'
  if (legal.includes('special') && rng.chance(0.45)) return 'special'
  if (rng.chance(0.2)) return 'dodge'
  return 'attack'
}

export function winnerOf(a: Combatant, b: Combatant): 'A' | 'B' | 'draw' {
  if (a.hp <= 0 && b.hp <= 0) return 'draw'
  if (b.hp <= 0) return 'A'
  if (a.hp <= 0) return 'B'
  // Round cap reached: higher HP%, then energy, else draw.
  const pa = a.hp / a.maxHp, pb = b.hp / b.maxHp
  if (pa > pb) return 'A'
  if (pb > pa) return 'B'
  if (a.energy > b.energy) return 'A'
  if (b.energy > a.energy) return 'B'
  return 'draw'
}

/** Full auto-simulation (both sides bot-driven). Used for tests & house-vs-house. */
export function simulateMatch(fa: Fighter, fb: Fighter, rng: RNG): MatchResult {
  let a = initCombatant(fa)
  let b = initCombatant(fb)
  const rounds: RoundEvent[] = []
  for (let r = 1; r <= ROUND_CAP; r++) {
    a = startRound(a); b = startRound(b)
    const actA = chooseBotAction(a, b, rng)
    const actB = chooseBotAction(b, a, rng)
    const res = resolveRound(a, b, actA, actB, rng, r)
    a = res.a; b = res.b
    rounds.push(res.event)
    if (a.hp <= 0 || b.hp <= 0) break
  }
  return { winner: winnerOf(a, b), rounds, finalA: a, finalB: b }
}
