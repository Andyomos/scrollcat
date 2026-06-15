// Standalone balance check — run with: npx tsx src/arena/engine/sanity.mts
// Imports only the pure engine (no '@' alias), so it runs outside Vite.
import { makeRNG } from './rng'
import { simulateMatch } from './combat'
import type { Fighter } from '../types'

function mk(name: string, atk: number, def: number, spd: number): Fighter {
  return {
    nftId: Math.floor(Math.random() * 1e6), nftName: name, image: '', rarity: 'Common',
    atk, def, spd,
    cls: {
      archetype: 'neon-blade', name, tag: '', element: 'cosmic',
      atk, def, spd, enr: 60,
      active: { name: 'x', desc: '' }, ultimate: { name: 'y', desc: '' },
    },
  }
}

const roster = [
  mk('Neon Blade', 85, 70, 95),
  mk('Shadow Gunner', 90, 65, 80),
  mk('Tech Mage', 55, 70, 55),
  mk('Rocket Cat', 92, 75, 60),
  mk('Thunder Claw', 93, 80, 85),
  mk('Ninja Scat', 50, 50, 100),
]

let N = 0, aWins = 0, bWins = 0, draws = 0, totalRounds = 0, capped = 0
for (let i = 0; i < roster.length; i++) {
  for (let j = 0; j < roster.length; j++) {
    if (i === j) continue
    for (let s = 0; s < 200; s++) {
      const res = simulateMatch(roster[i], roster[j], makeRNG(s * 7919 + i * 131 + j))
      N++
      totalRounds += res.rounds.length
      if (res.rounds.length >= 20 && res.winner !== 'draw') capped++
      if (res.winner === 'A') aWins++
      else if (res.winner === 'B') bWins++
      else draws++
    }
  }
}

console.log(`matches: ${N}`)
console.log(`A (initiator) win%: ${(100 * aWins / N).toFixed(1)}  B win%: ${(100 * bWins / N).toFixed(1)}  draw%: ${(100 * draws / N).toFixed(1)}`)
console.log(`avg rounds: ${(totalRounds / N).toFixed(1)}  hit round cap: ${(100 * capped / N).toFixed(1)}%`)

// Determinism check: same seed → identical result.
const r1 = simulateMatch(roster[0], roster[1], makeRNG(42))
const r2 = simulateMatch(roster[0], roster[1], makeRNG(42))
console.log(`deterministic: ${JSON.stringify(r1) === JSON.stringify(r2)}`)
