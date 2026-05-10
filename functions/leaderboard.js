/**
 * Cloudflare Pages Function — /api/leaderboard
 * Scheduled: fetches LI.FI integrator transactions, aggregates by wallet, stores top 20 in KV.
 * GET /api/leaderboard        → returns cached leaderboard JSON
 * POST /api/leaderboard/sync  → manually trigger a sync (protected by secret)
 */

const INTEGRATOR    = 'ScrollCat'
const LIFI_API      = 'https://li.quest/v1/analytics/transfers'
const KV_KEY        = 'leaderboard:v1'
const TOP_N         = 20
const CLAIM_FEE_SUPRA = 10          // SUPRA required to claim the #1 NFT prize
const TREASURY_WALLET = '0xf4a915b5e29bb5e8bcad30ebf78495e6a6c3acd2bcaff2ce36b861a5b50f9988'

// Competition window — update these each season
const COMPETITION_START = '2026-05-10T00:00:00Z'
const COMPETITION_END   = '2026-06-10T00:00:00Z'

const REWARD_TIERS = [
  { rank: 1,       label: '🥇 #1',     reward: 'NFT + Claim Fee Required',  type: 'nft',      claimable: true  },
  { rank: 2,       label: '🥈 #2',     reward: '500,000 SCAT Tokens',       type: 'scat',     claimable: false },
  { rank: 3,       label: '🥈 #3',     reward: '250,000 SCAT Tokens',       type: 'scat',     claimable: false },
  { rank: 4,       label: '🥉 #4–#5',  reward: '100,000 SCAT Tokens',       type: 'scat',     claimable: false },
  { rank: 6,       label: '🎖️ #6–#10', reward: 'Swap Champion Discord Role', type: 'discord',  claimable: false },
  { rank: 11,      label: '🐱 #11–#20',reward: 'ScrollCat OG Discord Role', type: 'discord',  claimable: false },
]

function getTier(rank) {
  if (rank === 1)              return REWARD_TIERS[0]
  if (rank === 2)              return REWARD_TIERS[1]
  if (rank === 3)              return REWARD_TIERS[2]
  if (rank <= 5)               return REWARD_TIERS[3]
  if (rank <= 10)              return REWARD_TIERS[4]
  return REWARD_TIERS[5]
}

async function fetchAndAggregate() {
  // LI.FI analytics — fetch transfers tagged with our integrator
  const url = new URL(LIFI_API)
  url.searchParams.set('integrator', INTEGRATOR)
  url.searchParams.set('fromTimestamp', Math.floor(new Date(COMPETITION_START).getTime() / 1000))
  url.searchParams.set('toTimestamp',   Math.floor(new Date(COMPETITION_END).getTime()   / 1000))
  url.searchParams.set('status',        'DONE')
  url.searchParams.set('limit',         '1000')

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' }
  })

  if (!res.ok) throw new Error(`LI.FI API error: ${res.status}`)

  const data = await res.json()
  const transfers = data?.transfers ?? data?.data ?? []

  // Aggregate USD volume per sender wallet
  const volumes = {}
  for (const tx of transfers) {
    const wallet = (tx.sending?.address || tx.fromAddress || '').toLowerCase()
    const usd    = parseFloat(tx.sending?.amountUSD || tx.fromAmountUSD || 0)
    if (!wallet || isNaN(usd)) continue
    volumes[wallet] = (volumes[wallet] || 0) + usd
  }

  // Sort and take top N
  const ranked = Object.entries(volumes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_N)
    .map(([wallet, volume], i) => {
      const rank = i + 1
      const tier = getTier(rank)
      return {
        rank,
        wallet,
        shortWallet: wallet.slice(0, 6) + '…' + wallet.slice(-4),
        volumeUSD: Math.round(volume * 100) / 100,
        reward:    tier.reward,
        rewardType: tier.type,
        claimable: tier.claimable,
      }
    })

  return {
    updatedAt:        new Date().toISOString(),
    competitionStart: COMPETITION_START,
    competitionEnd:   COMPETITION_END,
    claimFeeSupra:    CLAIM_FEE_SUPRA,
    treasuryWallet:   TREASURY_WALLET,
    entries:          ranked,
  }
}

export async function onRequest(ctx) {
  const { request, env } = ctx
  const url = new URL(request.url)

  // CORS headers
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  // Manual sync trigger (POST /api/leaderboard/sync)
  if (request.method === 'POST' && url.pathname.endsWith('/sync')) {
    const authHeader = request.headers.get('Authorization') || ''
    const secret     = env.LEADERBOARD_SYNC_SECRET || ''
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }
    try {
      const board = await fetchAndAggregate()
      await env.SCROLLCAT_LEADERBOARD.put(KV_KEY, JSON.stringify(board), { expirationTtl: 300 })
      return new Response(JSON.stringify({ ok: true, entries: board.entries.length }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }
  }

  // GET — serve cached leaderboard
  if (request.method === 'GET') {
    let board = null
    try {
      const cached = await env.SCROLLCAT_LEADERBOARD.get(KV_KEY)
      if (cached) board = JSON.parse(cached)
    } catch (_) {}

    // If no cache, try to fetch live
    if (!board) {
      try {
        board = await fetchAndAggregate()
        await env.SCROLLCAT_LEADERBOARD.put(KV_KEY, JSON.stringify(board), { expirationTtl: 300 })
      } catch (e) {
        board = {
          updatedAt:        new Date().toISOString(),
          competitionStart: COMPETITION_START,
          competitionEnd:   COMPETITION_END,
          claimFeeSupra:    CLAIM_FEE_SUPRA,
          treasuryWallet:   TREASURY_WALLET,
          entries:          [],
          error:            'Could not fetch live data. Try again soon.',
        }
      }
    }

    return new Response(JSON.stringify(board), {
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    })
  }

  return new Response('Method Not Allowed', { status: 405, headers: cors })
}
