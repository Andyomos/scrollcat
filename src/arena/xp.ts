// XP store — the only "real" currency in the demo. Per-NFT, persisted in
// localStorage now; moves to Cloudflare D1/KV in Phase 2. SCAT/SUPRA are
// display-only until the loop is proven. See economy-spec.md.

const KEY = 'scrollcat-arena-xp-v1'

export const XP_WIN = 100
export const XP_DRAW = 50
export const XP_LOSS = 25

type XpMap = Record<number, number>

function read(): XpMap {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write(m: XpMap) {
  try { localStorage.setItem(KEY, JSON.stringify(m)) } catch { /* ignore */ }
}

export function getXP(nftId: number): number {
  return read()[nftId] || 0
}

export function addXP(nftId: number, amount: number): number {
  const m = read()
  m[nftId] = (m[nftId] || 0) + amount
  write(m)
  return m[nftId]
}

/** Level curve: level N requires ~ 250 * N^1.6 cumulative XP. */
export function levelForXP(xp: number): number {
  let lvl = 1
  while (xp >= Math.floor(250 * Math.pow(lvl, 1.6))) { xp -= Math.floor(250 * Math.pow(lvl, 1.6)); lvl++ }
  return lvl
}

export function xpReward(result: 'win' | 'draw' | 'loss'): number {
  return result === 'win' ? XP_WIN : result === 'draw' ? XP_DRAW : XP_LOSS
}
