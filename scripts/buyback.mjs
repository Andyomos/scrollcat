// ScrollCat $SCAT buyback via the official supra-l1-sdk (correct signing).
// Usage: node buyback.mjs [supraAmount=10]
// Reads ARENA_BUYBACK_KEY from ../.env. Buys $SCAT on the Atmos Pump curve.
import * as pkg from 'supra-l1-sdk'
import { readFileSync } from 'fs'
const { SupraClient, SupraAccount, BCS, HexString, TxnBuilderTypes } = pkg

const RPC  = 'https://rpc-mainnet.supra.com'   // SDK appends /rpc/vN paths itself
const PUMP = '0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234'
const POOL = '0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3'

// --- read key from .env ---
const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const KEY = (env.ARENA_BUYBACK_KEY || '').replace(/^0x/, '')
if (!KEY) throw new Error('ARENA_BUYBACK_KEY not found in .env')

const supraAmount = Number(process.argv[2] || 10)
const inMist = BigInt(Math.round(supraAmount * 1e8))

// --- min_out from the live curve (constant product, ~10% slippage) ---
const pres = await (await fetch(`https://rpc-mainnet.supra.com/rpc/v2/accounts/${POOL}/resources/${PUMP}::atmos_pump::Pool`)).json()
const vS = BigInt(pres.data.virtual_supra_reserves), vT = BigInt(pres.data.virtual_token_reserves)
const inNet = inMist * 99n / 100n
const estOut = vT - (vS * vT) / (vS + inNet)
const minOut = estOut * 90n / 100n
console.log(`buying ${supraAmount} SUPRA → ≥ ${(Number(minOut) / 1e6).toLocaleString()} SCAT (est ${(Number(estOut) / 1e6).toLocaleString()})`)

// --- account + client ---
const account = new SupraAccount(Buffer.from(KEY, 'hex'))
console.log('buyer:', account.address().toString())
const client = await SupraClient.init(RPC)
const info = await client.getAccountInfo(account.address())
const seq = BigInt(info.sequence_number)
console.log('sequence:', seq.toString())

// --- build atmos_pump::buy<0x1::string::String>(pool, in, minOut, false, integrator) ---
const stringType = new TxnBuilderTypes.TypeTagStruct(
  new TxnBuilderTypes.StructTag(
    TxnBuilderTypes.AccountAddress.fromHex('0x1'),
    new TxnBuilderTypes.Identifier('string'),
    new TxnBuilderTypes.Identifier('String'),
    [],
  ))
const args = [
  new HexString(POOL).toUint8Array(),
  BCS.bcsSerializeUint64(inMist),
  BCS.bcsSerializeUint64(minOut),
  BCS.bcsSerializeBool(false),
  new HexString(POOL).toUint8Array(),
]
const serialized = await client.createSerializedRawTxObject(
  account.address(), seq, PUMP, 'atmos_pump', 'buy', [stringType], args,
  { maxGas: 500000n },          // DEX swap needs far more than the 5k default
)

// sendTx simulates internally (enableTransactionSimulation) before submitting.
console.log('simulating + sending…')
const res = await client.sendTxUsingSerializedRawTransaction(account, serialized, {
  enableWaitForTransaction: true,
  enableTransactionSimulation: true,
})
console.log('RESULT:', JSON.stringify(res, null, 2))
