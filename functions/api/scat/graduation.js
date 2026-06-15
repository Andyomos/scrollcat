/**
 * Cloudflare Pages Function — GET /api/scat/graduation
 *
 * Reads the live $SCAT Atmos Pump bonding-curve pool on Supra and returns its
 * progress toward graduation (migration to a HyperAMM pool). Powers the
 * "% to Graduation" bar on /whitepaper and in the Arena.
 *
 * Pool (atmos_swap::atmos_pump::Pool) for SCAT:
 *   0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3
 * Curve math (constant product on virtual reserves):
 *   k = vSupra * vToken ;  graduation when vToken falls to remain_token_reserves
 *   raised = real SUPRA in the pool's CoinStore ;  target = vSupra@grad - vSupra_initial
 */

const RPC   = 'https://rpc-mainnet.supra.com/rpc/v2'
const MODULE = '0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234'
const POOL   = '0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3'
const SUPRA_DECIMALS = 8
const SCAT_DECIMALS  = 6

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
})

async function res(type) {
  const r = await fetch(`${RPC}/accounts/${POOL}/resources/${encodeURIComponent(type)}`)
  return r.ok ? (await r.json())?.data : null
}

export async function onRequestGet({ env }) {
  try {
    const cache = await env?.SCROLLCAT_LEADERBOARD?.get('scat:graduation').catch(() => null)
    if (cache) { try { return json({ ...JSON.parse(cache), cached: true }) } catch { /* recompute */ } }

    const pool = await res(`${MODULE}::atmos_pump::Pool`)
    const coin = await res('0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>')
    if (!pool || !coin) return json({ error: 'pool unavailable' }, 502)

    const vSupra = BigInt(pool.virtual_supra_reserves)
    const vToken = BigInt(pool.virtual_token_reserves)
    const remain = BigInt(pool.remain_token_reserves)       // virtual_token at graduation
    const raised = BigInt(coin.coin.value)                  // real SUPRA in pool
    const completed = !!pool.is_completed

    const k = vSupra * vToken
    const vSupraAtGrad = k / remain
    const vSupraInit   = vSupra - raised
    const target       = vSupraAtGrad - vSupraInit          // SUPRA needed (raw)

    const toS = (x) => Number(x) / 10 ** SUPRA_DECIMALS
    const pct = target > 0n ? Math.min(100, Number((raised * 10000n) / target) / 100) : 0
    const price = Number(vSupra) / 10 ** SUPRA_DECIMALS / (Number(vToken) / 10 ** SCAT_DECIMALS)

    const out = {
      completed,
      raisedSupra:  Math.round(toS(raised)),
      targetSupra:  Math.round(toS(target)),
      remainingSupra: Math.max(0, Math.round(toS(target - raised))),
      pct: Number(pct.toFixed(2)),
      priceSupraPerScat: price,
      fdvSupra: Math.round(price * 1_000_000_000),          // 1B supply
      pool: POOL,
      token: pool.token_address,
      updated: new Date().toISOString(),
    }
    await env?.SCROLLCAT_LEADERBOARD?.put('scat:graduation', JSON.stringify(out), { expirationTtl: 120 }).catch(() => {})
    return json(out)
  } catch (e) {
    return json({ error: `graduation read failed: ${e?.message || e}` }, 500)
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}
