/**
 * Cloudflare Pages Function — GET /api/arena/unlocks?address=0x…
 * Returns the cosmetic item ids a wallet has purchased (server-verified in
 * /api/arena/purchase). The frontend uses this to mark themes as owned.
 */
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const norm = a => (a || '').toLowerCase().replace(/^0x/, '').padStart(64, '0')

export async function onRequestGet({ request, env }) {
  const address = new URL(request.url).searchParams.get('address')
  if (!address || !/^0x[0-9a-fA-F]{1,64}$/.test(address)) return json({ unlocked: [] })
  try {
    const raw = await env?.SCROLLCAT_LEADERBOARD?.get(`arena:unlock:${norm(address)}`)
    return json({ unlocked: raw ? JSON.parse(raw) : [] })
  } catch { return json({ unlocked: [] }) }
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }) }
