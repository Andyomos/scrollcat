/**
 * Cloudflare Pages Function — GET /api/arena/ownership?address=0x...
 *
 * Real on-chain ScrollCat ownership gate (Path A — pure Supra RPC, no 3rd-party
 * indexer). Covers BOTH minters and wallets that received a cat by transfer.
 *
 * Why this works without a block-crawling indexer (the Supra chain is 47M+
 * blocks, mostly empty, with no global event feed — a naive crawler is doomed):
 *   The collection's on-chain `TokenData.largest_property_version` gives the exact
 *   set of minted editions — TOKEN_n × pv 1..largest_n = exactly the 321 cats.
 *   So we maintain that **edition universe** (KV-cached) and resolve any wallet by
 *   reading its own TokenStore table against it. Bounded, complete, no crawl.
 *
 * Lookup strategy (cheap → thorough):
 *   1. KV result cache (per wallet, short TTL).
 *   2. Fast path: scan the wallet's own tx history for ScrollCat deposits
 *      (instant for the common case — people who minted), confirm via table read.
 *   3. Thorough path (only if 2 finds nothing): sweep the edition universe against
 *      the wallet's TokenStore handle, short-circuit on first hit. Catches
 *      transfer-received cats the tx-scan can't see.
 *
 * Verified identifiers — see functions/api/claim.js + properties/onchain-integration.md.
 */

const SUPRA_V1   = 'https://rpc-mainnet.supra.com/rpc/v1'
const SUPRA_V2   = 'https://rpc-mainnet.supra.com/rpc/v2'
const NFT_CREATOR    = '0x05eb2a2c5c2b7572265c3271da23d106850313dee3c3b305df56e03fc0e18a38'
const NFT_COLLECTION = 'ScrollCat'
const TOKEN_COUNT    = 12          // TOKEN_1..TOKEN_12
const TX_PAGE        = 100
const SWEEP_BATCH    = 25          // table reads per chunk — stays under CF's 50-subrequest cap
const EDITIONS_KEY   = 'arena:editions:v1'
const EDITIONS_TTL   = 3600        // refresh edition universe hourly (supply only grows)
const RESULT_TTL     = 300         // per-wallet result cache

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  })
}

const norm = a => (a || '').toLowerCase().replace(/^0x/, '').padStart(64, '0')
const CREATOR_N = norm(NFT_CREATOR)

async function getJSON(url, opts) {
  const res = await fetch(url, opts)
  if (!res.ok) return null
  try { return await res.json() } catch { return null }
}
const kvGet = async (env, k) => { try { return await env?.SCROLLCAT_LEADERBOARD?.get(k) } catch { return null } }
const kvPut = async (env, k, v, ttl) => { try { await env?.SCROLLCAT_LEADERBOARD?.put(k, v, { expirationTtl: ttl }) } catch { /* ignore */ } }

/** decode the length-prefixed hex rarity string in token_properties */
function decodeRarity(props) {
  try {
    const e = props?.map?.data?.find(x => x.key === 'rarity')
    const hex = (e?.value?.value || '').replace(/^0x/, '')
    if (!hex) return null
    const bytes = []
    for (let i = 2; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16)) // skip 1-byte uleb length
    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch { return null }
}

/** The wallet's TokenStore.tokens table handle (null ⇒ owns no Token-v1 NFTs). */
async function tokenTableHandle(address) {
  const r = await getJSON(`${SUPRA_V2}/accounts/${address}/resources/0x3::token::TokenStore`)
  return r?.data?.tokens?.handle ?? null
}

/** Build (or read from KV) the universe of minted editions: ~321 {name, property_version}. */
async function editionUniverse(env) {
  const cached = await kvGet(env, EDITIONS_KEY)
  if (cached) { try { return JSON.parse(cached) } catch { /* rebuild */ } }

  const coll = await getJSON(`${SUPRA_V2}/accounts/${NFT_CREATOR}/resources/0x3::token::Collections`)
  const tdHandle = coll?.data?.token_data?.handle
  if (!tdHandle) return []

  const editions = []
  for (let n = 1; n <= TOKEN_COUNT; n++) {
    const name = `TOKEN_${n}`
    const td = await getJSON(`${SUPRA_V1}/tables/${tdHandle}/item`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key_type: '0x3::token::TokenDataId', value_type: '0x3::token::TokenData',
        key: { creator: NFT_CREATOR, collection: NFT_COLLECTION, name },
      }),
    })
    const lpv = Number((td?.largest_property_version ?? td?.result?.largest_property_version) || 0)
    for (let pv = 1; pv <= lpv; pv++) editions.push({ name, property_version: String(pv) })
  }
  if (editions.length) await kvPut(env, EDITIONS_KEY, JSON.stringify(editions), EDITIONS_TTL)
  return editions
}

/** Authoritative: does `handle` currently contain this TokenId with amount≥1? */
async function stillHolds(handle, edition) {
  const r = await getJSON(`${SUPRA_V1}/tables/${handle}/item`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key_type: '0x3::token::TokenId', value_type: '0x3::token::Token',
      key: {
        token_data_id: { creator: NFT_CREATOR, collection: NFT_COLLECTION, name: edition.name },
        property_version: edition.property_version,
      },
    }),
  })
  const amount = r?.amount ?? r?.result?.amount
  if (amount == null || BigInt(amount) <= 0n) return null
  return { ...edition, amount: String(amount), rarity: decodeRarity(r.token_properties ?? r?.result?.token_properties) }
}

/** Fast path: editions discoverable from the wallet's own tx history (minters). */
async function txScanEditions(address) {
  const data = await getJSON(`${SUPRA_V2}/accounts/${address}/transactions?limit=${TX_PAGE}`)
  const txs = data?.record || data?.transactions || (Array.isArray(data) ? data : [])
  const seen = new Map()
  for (const tx of txs) {
    for (const ev of (tx?.output?.Move?.events || tx?.events || [])) {
      if (!/0x3::token::Deposit/.test(ev?.type || '')) continue
      const id = ev?.data?.id, tdi = id?.token_data_id
      if (!tdi || norm(tdi.creator) !== CREATOR_N || tdi.collection !== NFT_COLLECTION) continue
      const k = `${tdi.name}#${id.property_version}`
      if (!seen.has(k)) seen.set(k, { name: tdi.name, property_version: String(id.property_version) })
    }
  }
  return [...seen.values()]
}

/** Sweep editions against a handle in one budget-safe batch, return any hits. */
async function sweep(handle, editions) {
  const res = await Promise.all(editions.map(e => stillHolds(handle, e)))
  return res.filter(Boolean)
}

/**
 * Cursor-chunked so a single request never exceeds Cloudflare's ~50-subrequest
 * cap. Returns ALL cats held in the scanned range (no short-circuit) so the
 * frontend can accumulate the COMPLETE roster across calls — `owns` flips true
 * as soon as any cat is found, but the sweep continues to find every design.
 * cursor 0 also runs the fast tx-scan (minted cats) for instant entry.
 */
export async function onRequestGet(ctx) {
  const { request, env } = ctx
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get('address')
    if (!address || !/^0x[0-9a-fA-F]{1,64}$/.test(address))
      return json({ error: 'valid ?address= required' }, 400)
    const cursor = Math.max(0, parseInt(url.searchParams.get('cursor') || '0', 10) || 0)
    const addr = '0x' + norm(address)

    const handle = await tokenTableHandle(addr)
    if (!handle) return json({ owns: false, held: [], done: true, reason: 'no token store' })

    const universe = await editionUniverse(env)

    // Collect hits for this call: tx-scan cats (cursor 0 only) + this edition chunk.
    const held = cursor === 0 ? await sweep(handle, await txScanEditions(addr)) : []
    const seen = new Set(held.map(h => `${h.name}#${h.property_version}`))
    for (const h of await sweep(handle, universe.slice(cursor, cursor + SWEEP_BATCH))) {
      const k = `${h.name}#${h.property_version}`
      if (!seen.has(k)) { seen.add(k); held.push(h) }
    }

    const next = cursor + SWEEP_BATCH
    const done = next >= universe.length
    return json({
      held, owns: held.length > 0, done,
      nextCursor: done ? null : next,
      scanned: Math.min(next, universe.length), total: universe.length,
    })
  } catch (e) {
    return json({ error: `ownership check failed: ${e?.message || e}` }, 500)
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}
