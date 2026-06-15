/**
 * Cloudflare Pages Function — POST /api/arena/purchase
 *
 * Closes the play-to-graduate loop: player pays SUPRA (via StarKey) for a
 * cosmetic → we verify the payment on-chain → unlock the item → a cut of the
 * revenue auto-buys $SCAT on the curve (best-effort, via /api/scat/buyback).
 *
 * Body: { buyer:"0x…", txHash:"0x…", itemId:"inferno" }
 * Server-side price catalog (so the client can't tamper with prices).
 */

const SUPRA_RPC = 'https://rpc-mainnet.supra.com/rpc/v1'
const TREASURY  = '0xf9aceecd8696b8df7adfa3496d87ea2e0334585245b12216279446b5d4110cff'  // Arena Treasury (revenue + buyback)
const BUYBACK_PCT = 0.30          // 30% of revenue buys $SCAT
const PRICES = { inferno: 200, void: 200, cosmic: 500 }   // SUPRA, must match themes.ts

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
const norm = a => (a || '').toLowerCase().replace(/^0x/, '').padStart(64, '0')

async function getTx(hash) {
  for (let i = 0; i < 6; i++) {        // tx may take a moment to finalize
    const r = await fetch(`${SUPRA_RPC}/transactions/${hash}`)
    if (r.ok) { const t = await r.json().catch(() => null); if (t) return t }
    await new Promise(res => setTimeout(res, 1500))
  }
  return null
}

const unwrap = v => (v && typeof v === 'object' && 'Move' in v) ? v.Move : v   // {Move:"0x…"} → "0x…"

/** Pull (sender, recipient, amount, success) from a supra_account::transfer tx. */
function extractTransfer(tx) {
  const p = tx?.payload?.Move || tx?.payload || {}
  const args = p.arguments || p.args || []
  let to = args[0], amount = args[1]
  // fallback: scan events for a SUPRA deposit
  const events = tx?.output?.Move?.events || tx?.events || []
  if (to == null || amount == null) {
    const dep = events.find(e => /coin::(CoinDeposit|DepositEvent)|fungible_asset::Deposit/.test(e?.type || '') && e?.data)
    if (dep) { to = to ?? (dep.data.account || dep.data.store); amount = amount ?? dep.data.amount }
  }
  const sender = unwrap(tx?.sender ?? tx?.header?.sender ?? p.sender)
  const success = tx?.status === 'Success' || tx?.output?.Move?.vm_status === 'Executed successfully' || tx?.success === true
  return { sender: unwrap(sender), to: unwrap(to), amount, success }
}

export async function onRequestPost({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  let body; try { body = await request.json() } catch { return json({ error: 'bad json' }, 400) }
  const { buyer, txHash, itemId } = body || {}
  if (!buyer || !txHash || !itemId) return json({ error: 'buyer, txHash, itemId required' }, 400)
  const price = PRICES[itemId]
  if (!price) return json({ error: 'unknown item' }, 400)

  const buyerN = norm(buyer)
  try {
    // 1. replay guard
    const usedKey = `arena:tx:${txHash}`
    if (await env?.SCROLLCAT_LEADERBOARD?.get(usedKey).catch(() => null))
      return json({ error: 'tx already used' }, 409)

    // 2. verify the payment on-chain
    const tx = await getTx(txHash)
    if (!tx) return json({ error: 'tx not found yet — try again in a moment' }, 404)
    const { sender, to, amount, success } = extractTransfer(tx)
    if (!success) return json({ error: 'tx did not succeed on-chain' }, 400)
    if (norm(sender) !== buyerN) return json({ error: 'sender ≠ buyer' }, 400)
    if (norm(to) !== norm(TREASURY)) return json({ error: 'recipient ≠ treasury' }, 400)
    const paidMist = BigInt(amount || 0)
    const needMist = BigInt(Math.round(price * 1e8))
    if (paidMist < needMist) return json({ error: `underpaid: need ${price} SUPRA` }, 400)

    // 3. record unlock + mark tx used
    const unlockKey = `arena:unlock:${buyerN}`
    let unlocked = []
    try { unlocked = JSON.parse(await env.SCROLLCAT_LEADERBOARD.get(unlockKey) || '[]') } catch { unlocked = [] }
    if (!unlocked.includes(itemId)) unlocked.push(itemId)
    await env?.SCROLLCAT_LEADERBOARD?.put(unlockKey, JSON.stringify(unlocked)).catch(() => {})
    await env?.SCROLLCAT_LEADERBOARD?.put(usedKey, JSON.stringify({ buyer: buyerN, itemId, at: Date.now() }), { expirationTtl: 60 * 60 * 24 * 365 }).catch(() => {})

    // Buyback is handled by the VPS cron (supra-l1-sdk — correct signing), which
    // converts Arena Treasury revenue above its floor into $SCAT hourly. The
    // payment already landed in the treasury here, so nothing more to do.
    return json({ ok: true, unlocked, itemId })
  } catch (e) {
    return json({ error: `purchase failed: ${e?.message || e}` }, 500)
  }
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }) }
