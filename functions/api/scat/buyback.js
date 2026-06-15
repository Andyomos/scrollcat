/**
 * Cloudflare Pages Function — POST /api/scat/buyback   (REAL MONEY)
 *
 * Buys $SCAT on the Atmos Pump bonding curve from the buyback wallet — the
 * engine behind "play-to-graduate." Converts the buyback wallet's SUPRA into
 * SCAT (both stay in our wallet), pushing SCAT up the curve toward graduation.
 *
 * SAFETY (deliberate):
 *  - Inert until env secrets are set (returns 503 otherwise).
 *  - Admin-gated: requires `Authorization: Bearer <ARENA_ADMIN_SECRET>`.
 *  - Per-call cap (MAX_SUPRA). Hardcoded module/pool/token — NO caller-supplied
 *    addresses, so it can only ever buy SCAT into our own wallet (worst case:
 *    forced buys, never theft).
 *  - Slippage-protected min_tokens_out read live from the curve.
 *
 * Env (set in Cloudflare Pages → Settings → Environment Variables):
 *   ARENA_ADMIN_SECRET   — bearer token to authorize a buyback
 *   ARENA_BUYBACK_WALLET — buyback wallet address (0x…)
 *   ARENA_BUYBACK_KEY    — that wallet's ed25519 private key (hex, no 0x)
 * KV: SCROLLCAT_LEADERBOARD (logs each buy)
 */

const RPC_V1 = 'https://rpc-mainnet.supra.com/rpc/v1'
const RPC_V2 = 'https://rpc-mainnet.supra.com/rpc/v2'
const PUMP   = '0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234'
const POOL   = '0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3'
const MAX_SUPRA      = 10_000          // hard cap per call (SUPRA)
const SUPRA_DECIMALS = 8
const FEE_BPS        = 100             // assume ~1% curve fee when sizing min_out
const SLIPPAGE_BPS   = 500            // 5% slippage tolerance on min_out
const MAX_GAS = 20_000n, GAS_PRICE = 100n, TX_EXPIRY = 30

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })

// ── BCS ──
const uleb=n=>{const o=[];do{let b=n&0x7f;n>>>=7;if(n)b|=0x80;o.push(b)}while(n);return new Uint8Array(o)}
const u8=n=>new Uint8Array([n])
const u64le=n=>{const b=new ArrayBuffer(8);new DataView(b).setBigUint64(0,BigInt(n),true);return new Uint8Array(b)}
const hexToBytes=h=>{const a=new Uint8Array(h.length/2);for(let i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);return a}
const bytesToHex=b=>Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('')
const concat=(...as)=>{const t=as.reduce((s,a)=>s+a.length,0),o=new Uint8Array(t);let f=0;for(const a of as){o.set(a,f);f+=a.length}return o}
const bcsString=s=>{const e=new TextEncoder().encode(s);return concat(uleb(e.length),e)}
const bcsAddress=h=>hexToBytes(h.replace(/^0x/,'').padStart(64,'0'))
const bcsArg=b=>concat(uleb(b.length),b)

// TypeTag for 0x1::string::String  (Struct variant = 7)
function typeArgsStringString(){
  return concat(uleb(1), u8(7), bcsAddress('0x1'), bcsString('string'), bcsString('String'), uleb(0))
}

function buildRawTx({ sender, seqNum, chainId, expiryTs, args }){
  const payload = concat(
    u8(2),                                   // EntryFunction
    bcsAddress(PUMP), bcsString('atmos_pump'),
    bcsString('buy'),
    typeArgsStringString(),                  // <0x1::string::String>
    concat(uleb(args.length), ...args.map(bcsArg)),
  )
  return concat(bcsAddress(sender), u64le(seqNum), payload, u64le(MAX_GAS), u64le(GAS_PRICE), u64le(expiryTs), u8(chainId))
}

async function signTx(raw, keyHex){
  const prefixHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('SUPRA::RawTransaction'))
  const msgHash = await crypto.subtle.digest('SHA-256', concat(new Uint8Array(prefixHash), raw))
  const key = await crypto.subtle.importKey('raw', hexToBytes(keyHex.replace(/^0x/,'')), { name:'Ed25519' }, true, ['sign'])
  const sig = await crypto.subtle.sign('Ed25519', key, msgHash)
  const spki = await crypto.subtle.exportKey('spki', key)
  return { sig:new Uint8Array(sig), pub:new Uint8Array(spki).slice(-32) }
}

async function getJSON(u,o){const r=await fetch(u,o);return r.ok?r.json():null}

export async function onRequestPost({ request, env }){
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS })
  const { ARENA_ADMIN_SECRET, ARENA_BUYBACK_WALLET, ARENA_BUYBACK_KEY } = env
  if (!ARENA_ADMIN_SECRET || !ARENA_BUYBACK_WALLET || !ARENA_BUYBACK_KEY)
    return json({ error: 'buyback not configured (set ARENA_ADMIN_SECRET / ARENA_BUYBACK_WALLET / ARENA_BUYBACK_KEY)' }, 503)
  if (request.headers.get('Authorization') !== `Bearer ${ARENA_ADMIN_SECRET}`)
    return json({ error: 'unauthorized' }, 401)

  let body; try { body = await request.json() } catch { return json({ error:'bad json' }, 400) }
  const supra = Number(body?.supraAmount)
  if (!(supra > 0) || supra > MAX_SUPRA) return json({ error:`supraAmount must be 0 < x ≤ ${MAX_SUPRA}` }, 400)

  try {
    // size min_tokens_out from the live curve (constant product on virtual reserves)
    const pool = (await getJSON(`${RPC_V2}/accounts/${POOL}/resources/${PUMP}::atmos_pump::Pool`))?.data
    if (!pool) return json({ error:'pool read failed' }, 502)
    const vS = BigInt(pool.virtual_supra_reserves), vT = BigInt(pool.virtual_token_reserves)
    const inRaw = BigInt(Math.round(supra * 10 ** SUPRA_DECIMALS))
    const inNet = inRaw * BigInt(10000 - FEE_BPS) / 10000n
    const k = vS * vT
    const estOut = vT - k / (vS + inNet)                         // SCAT out (raw, 6dp)
    const minOut = estOut * BigInt(10000 - SLIPPAGE_BPS) / 10000n
    if (minOut <= 0n) return json({ error:'computed minOut <= 0' }, 400)

    const [acct, chain] = await Promise.all([
      getJSON(`${RPC_V1}/accounts/${ARENA_BUYBACK_WALLET}`),
      getJSON(`${RPC_V1}/`),
    ])
    const seq = BigInt(acct?.sequence_number ?? 0)
    const chainId = chain?.chain_id ?? 8
    const expiry = BigInt(Math.floor(Date.now()/1000) + TX_EXPIRY)

    const args = [
      bcsAddress(POOL),            // pool_address
      u64le(inRaw),                // supra_in_with_fee
      u64le(minOut),               // min_tokens_out
      u8(0),                       // to_coin = false (FA)
      bcsAddress(POOL),            // integrator (matches observed buys)
    ]
    const raw = buildRawTx({ sender: ARENA_BUYBACK_WALLET, seqNum: seq, chainId, expiryTs: expiry, args })
    const { sig, pub } = await signTx(raw, ARENA_BUYBACK_KEY)
    const signed = concat(raw, u8(0), pub, sig)   // Ed25519 authenticator

    const res = await fetch(`${RPC_V1}/transactions/submit`, {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ Move: bytesToHex(signed) }),
    })
    const txt = await res.text()
    if (!res.ok) return json({ error:`submit failed ${res.status}: ${txt}` }, 502)
    let hash; try { hash = JSON.parse(txt)?.hash ?? JSON.parse(txt) } catch { hash = txt.trim() }

    const rec = { supra, minOut: minOut.toString(), estOut: estOut.toString(), txHash: hash, at: new Date().toISOString() }
    await env?.SCROLLCAT_LEADERBOARD?.put(`scat:buyback:${Date.now()}`, JSON.stringify(rec), { expirationTtl: 60*60*24*90 }).catch(()=>{})
    return json({ ok:true, ...rec })
  } catch (e) {
    return json({ error:`buyback failed: ${e?.message || e}` }, 500)
  }
}

export async function onRequestOptions(){ return new Response(null, { status:204, headers:CORS }) }
