// Seeded, deterministic PRNG (mulberry32). The whole combat engine draws from
// this so a match is fully reproducible from its seed — required for verifiable
// on-chain settlement in Phase 2.

export interface RNG {
  /** float in [0, 1) */
  next: () => number
  /** integer in [0, n) */
  int: (n: number) => number
  /** true with probability p */
  chance: (p: number) => boolean
}

export function makeRNG(seed: number): RNG {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
    chance: (p: number) => next() < p,
  }
}

/** Turn an arbitrary string (e.g. matchId) into a 32-bit seed. */
export function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h ^ (h >>> 16)) >>> 0
}
