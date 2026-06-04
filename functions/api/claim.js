/**
 * Cloudflare Pages Function — POST /api/claim
 *
 * Flow:
 *  1. Verify the 10 SUPRA payment tx on Supra RPC (sender = winner, receiver = treasury)
 *  2. Check KV — reject if already claimed
 *  3. Sign + submit NFT transfer from distributor wallet to winner
 *  4. Record claim in KV with both tx hashes
 *  5. Return NFT transfer tx hash to frontend
 *
 * Env secrets required (set in Cloudflare Pages → Settings → Environment Variables):
 *   NFT_DISTRIBUTOR_KEY      — hex private key of the distributor wallet (32 bytes, no 0x prefix)
 *   LEADERBOARD_SYNC_SECRET  — bearer token for /api/leaderboard/sync
 *
 * KV binding required (wrangler.toml):
 *   SCROLLCAT_LEADERBOARD
 */

// ── Config ────────────────────────────────────────────────────────────────────

const SUPRA_RPC          = 'https://rpc-mainnet.supra.com/rpc/v1'
const TREASURY_WALLET    = '0xf4a915b5e29bb5e8bcad30ebf78495e6a6c3acd2bcaff2ce36b861a5b50f9988'
const DISTRIBUTOR_WALLET = '0x56e54b29f9e518ea8944df0b11e65a20b026a6dc7ca22e1aeeed518d5dc6ee31'
const NFT_CREATOR        = '0x05eb2a2c5c2b7572265c3271da23d106850313dee3c3b305df56e03fc0e18a38'  // actual mint creator (Atmos/Crystara), NOT treasury
const NFT_COLLECTION     = 'ScrollCat'
const NFT_TOKEN_NAME     = 'TOKEN_5'   // on-chain token name (display name "Feed Phantom" lives in metadata)
const NFT_PROP_VERSION   = 1n          // property_version (u64) — minted token is pv1, not 0
const CLAIM_FEE_MIST     = 1_000_000_000n   // 10 SUPRA in Mist (SUPRA = 8 decimals)
const CLAIM_KV_KEY       = 'claim:season1:winner'
const MAX_GAS            = 10_000n
const GAS_PRICE          = 100n
const TX_EXPIRY_SECS     = 30        // seconds from now

// Token module on Supra (Aptos Token Standard v1 compatible)
const TOKEN_MODULE_ADDR  = '0x0000000000000000000000000000000000000000000000000000000000000003'
const TOKEN_MODULE_NAME  = 'token'
const TOKEN_FN_NAME      = 'transfer_with_opt_in'

// ── CORS ──────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ── BCS helpers ───────────────────────────────────────────────────────────────

function uleb128(n) {
  const out = []
  do {
    let byte = n & 0x7f
    n >>>= 7
    if (n !== 0) byte |= 0x80
    out.push(byte)
  } while (n !== 0)
  return new Uint8Array(out)
}

function u8(n)   { return new Uint8Array([n]) }

function u64le(n) {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setBigUint64(0, BigInt(n), true)
  return new Uint8Array(buf)
}

function u128le(n) {
  const buf = new ArrayBuffer(16)
  const view = new DataView(buf)
  view.setBigUint64(0, BigInt(n) & 0xFFFFFFFFFFFFFFFFn, true)
  view.setBigUint64(8, BigInt(n) >> 64n, true)
  return new Uint8Array(buf)
}

function bcsString(s) {
  const encoded = new TextEncoder().encode(s)
  return concat(uleb128(encoded.length), encoded)
}

function bcsAddress(hex) {
  // Strip 0x, pad to 32 bytes
  const clean = hex.replace(/^0x/, '').padStart(64, '0')
  return hexToBytes(clean)
}

function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++)
    arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  return arr
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}

// Wrap a BCS-encoded value with its length prefix (for args vector)
function bcsArg(bytes) {
  return concat(uleb128(bytes.length), bytes)
}

// ── Transaction builder ───────────────────────────────────────────────────────

function buildRawTx({ sender, seqNum, chainId, expiryTs, payload }) {
  // Entry function payload encoding:
  // payload_type (0 = Script, 1 = Package, 2 = EntryFunction)
  const payloadType = u8(2)

  // Module ID: address + name
  const moduleAddr = bcsAddress(payload.moduleAddr)
  const moduleName = bcsString(payload.moduleName)
  const moduleId   = concat(moduleAddr, moduleName)

  // Function name
  const funcName = bcsString(payload.functionName)

  // Type args (none)
  const typeArgs = uleb128(0)

  // Args vector
  const argsVec = concat(
    uleb128(payload.args.length),
    ...payload.args.map(bcsArg)
  )

  const payloadBytes = concat(payloadType, moduleId, funcName, typeArgs, argsVec)

  // Raw transaction
  return concat(
    bcsAddress(sender),       // sender
    u64le(seqNum),            // sequence_number
    payloadBytes,             // payload
    u64le(MAX_GAS),           // max_gas_amount
    u64le(GAS_PRICE),         // gas_unit_price
    u64le(expiryTs),          // expiration_timestamp_secs
    u8(chainId),              // chain_id
  )
}

// ── Ed25519 signing ───────────────────────────────────────────────────────────

async function signTx(rawTxBytes, privateKeyHex) {
  // Supra uses SHA3-256 prehash prefix for transaction signing
  const prefix    = new TextEncoder().encode('SUPRA::RawTransaction')
  const prefixHash = await crypto.subtle.digest('SHA-256', prefix)

  const message = concat(new Uint8Array(prefixHash), rawTxBytes)
  const msgHash = await crypto.subtle.digest('SHA-256', message)

  const keyBytes = hexToBytes(privateKeyHex.replace(/^0x/, ''))
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  )

  const sigBuffer = await crypto.subtle.sign('Ed25519', cryptoKey, msgHash)
  return new Uint8Array(sigBuffer)
}

async function getPublicKey(privateKeyHex) {
  const keyBytes = hexToBytes(privateKeyHex.replace(/^0x/, ''))
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes,
    { name: 'Ed25519' },
    true,
    ['sign']
  )
  const pubKeyBuffer = await crypto.subtle.exportKey('raw',
    (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])).publicKey
  )
  // Derive public key by importing as Ed25519 and exporting spki
  // Web Crypto doesn't directly expose pubkey from private seed — use the pair approach
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign'])
  // For Ed25519, public key is last 32 bytes of the PKCS8 private key export
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', cryptoKey.catch ? cryptoKey : cryptoKey)
  void pkcs8; void pubKeyBuffer; void pair
  // Simpler: reimport as key pair and export public
  const imported = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, true, ['sign'])
  const spki = await crypto.subtle.exportKey('spki', imported).catch(() => null)
  if (spki) return new Uint8Array(spki).slice(-32)
  return new Uint8Array(32) // fallback
}

// ── Supra RPC calls ───────────────────────────────────────────────────────────

async function getAccount(address) {
  const res = await fetch(`${SUPRA_RPC}/accounts/${address}`)
  if (!res.ok) throw new Error(`Account fetch failed: ${res.status}`)
  return res.json()
}

async function getTransaction(txHash) {
  const res = await fetch(`${SUPRA_RPC}/transactions/${txHash}`)
  if (!res.ok) throw new Error(`Tx fetch failed: ${res.status}`)
  return res.json()
}

async function getChainId() {
  const res = await fetch(`${SUPRA_RPC}/`)
  if (res.ok) {
    const data = await res.json()
    return data?.chain_id ?? 6  // Supra mainnet chain ID
  }
  return 6
}

async function submitTransaction(signedTxHex) {
  const res = await fetch(`${SUPRA_RPC}/transactions/submit`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ Move: signedTxHex }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Submit failed ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return { hash: text.trim() } }
}

// ── Payment verification ──────────────────────────────────────────────────────

async function verifyPayment(txHash, winnerWallet) {
  const tx = await getTransaction(txHash)

  // Normalise addresses for comparison
  const normalise = a => (a || '').toLowerCase().replace(/^0x/, '')
  const sender    = normalise(tx?.sender || tx?.from || '')
  const receiver  = normalise(
    tx?.payload?.arguments?.[0] ||
    tx?.events?.find(e => e.type?.includes('CoinDeposit'))?.data?.account ||
    tx?.to || ''
  )
  const amount = BigInt(
    tx?.payload?.arguments?.[1] ||
    tx?.events?.find(e => e.type?.includes('CoinDeposit'))?.data?.amount ||
    tx?.value || 0
  )

  const expectedSender   = normalise(winnerWallet)
  const expectedReceiver = normalise(TREASURY_WALLET)

  if (sender !== expectedSender)
    throw new Error(`Payment sender mismatch. Expected ${expectedSender}, got ${sender}`)
  if (receiver !== expectedReceiver)
    throw new Error(`Payment receiver mismatch. Expected treasury wallet, got ${receiver}`)
  if (amount < CLAIM_FEE_MIST)
    throw new Error(`Payment too low. Need ${CLAIM_FEE_MIST} Mist, got ${amount}`)

  return true
}

// ── NFT transfer ──────────────────────────────────────────────────────────────

async function transferNFT(toAddress, privateKeyHex) {
  const [account, chainId] = await Promise.all([
    getAccount(DISTRIBUTOR_WALLET),
    getChainId(),
  ])

  const seqNum  = BigInt(account.sequence_number ?? 0)
  const expiryTs = BigInt(Math.floor(Date.now() / 1000) + TX_EXPIRY_SECS)

  // Args for transfer_with_opt_in(creator, collection, name, property_version, to, amount)
  const args = [
    bcsAddress(NFT_CREATOR),          // creator: address
    bcsString(NFT_COLLECTION),        // collection: String
    bcsString(NFT_TOKEN_NAME),        // name: String
    u64le(NFT_PROP_VERSION),          // property_version: u64
    bcsAddress(toAddress),            // to: address
    u64le(1n),                        // amount: u64
  ]

  const rawTx = buildRawTx({
    sender:       DISTRIBUTOR_WALLET,
    seqNum,
    chainId,
    expiryTs,
    payload: {
      moduleAddr:   TOKEN_MODULE_ADDR,
      moduleName:   TOKEN_MODULE_NAME,
      functionName: TOKEN_FN_NAME,
      args,
    },
  })

  const signature = await signTx(rawTx, privateKeyHex)

  // Derive public key (SPKI last 32 bytes for Ed25519)
  const keyBytes  = hexToBytes(privateKeyHex.replace(/^0x/, ''))
  const imported  = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, true, ['sign'])
  const spki      = await crypto.subtle.exportKey('spki', imported)
  const pubKey    = new Uint8Array(spki).slice(-32)

  // Signed transaction: rawTx + authenticator
  // Authenticator type 0 = Ed25519
  const signedTx = concat(
    rawTx,
    u8(0),        // Ed25519 authenticator
    pubKey,
    signature,
  )

  const result = await submitTransaction(bytesToHex(signedTx))
  return result?.hash ?? result?.tx_hash ?? 'submitted'
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(ctx) {
  const { request, env } = ctx

  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS })

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { winnerWallet, paymentTxHash } = body

  if (!winnerWallet || !paymentTxHash)
    return json({ error: 'Missing winnerWallet or paymentTxHash' }, 400)

  const distributorKey = env.NFT_DISTRIBUTOR_KEY
  if (!distributorKey)
    return json({ error: 'Distributor key not configured' }, 500)

  // 1. Check KV — prevent double-claim
  const existing = await env.SCROLLCAT_LEADERBOARD.get(CLAIM_KV_KEY)
  if (existing) {
    const claim = JSON.parse(existing)
    return json({ error: 'NFT already claimed', claim }, 409)
  }

  // 2. Verify payment transaction
  try {
    await verifyPayment(paymentTxHash, winnerWallet)
  } catch (e) {
    return json({ error: `Payment verification failed: ${e.message}` }, 400)
  }

  // 3. Transfer NFT from distributor to winner
  let nftTxHash
  try {
    nftTxHash = await transferNFT(winnerWallet, distributorKey)
  } catch (e) {
    return json({ error: `NFT transfer failed: ${e.message}` }, 500)
  }

  // 4. Record claim in KV (permanent — no TTL)
  const claimRecord = {
    winner:        winnerWallet,
    paymentTxHash,
    nftTxHash,
    nftName:       NFT_TOKEN_NAME,
    claimedAt:     new Date().toISOString(),
  }
  await env.SCROLLCAT_LEADERBOARD.put(CLAIM_KV_KEY, JSON.stringify(claimRecord))

  return json({ ok: true, nftTxHash, nftName: NFT_TOKEN_NAME })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}
