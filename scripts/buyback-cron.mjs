// ScrollCat $SCAT buyback — VPS cron. Buys $SCAT with Arena Treasury revenue
// above a SUPRA floor (keeps gas reserve), pushing graduation. Correct signing
// via supra-l1-sdk. Reads ARENA_BUYBACK_KEY from .env next to this file.
// Run: node buyback-cron.mjs   (hourly via cron)
import * as pkg from 'supra-l1-sdk'
import { readFileSync, appendFileSync } from 'fs'
const { SupraClient, SupraAccount, BCS, HexString, TxnBuilderTypes } = pkg

const RPC  = 'https://rpc-mainnet.supra.com'
const PUMP = '0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234'
const POOL = '0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3'
const MIN_BUY_SUPRA = 5       // don't bother for tiny amounts
const SLIPPAGE_BPS  = 1000    // 10%
const LOG = new URL('./buyback.log', import.meta.url)

const log = (m) => { const line = `${new Date().toISOString()} ${m}`; console.log(line); try { appendFileSync(LOG, line + '\n') } catch {} }

try {
  const env = Object.fromEntries(readFileSync(new URL('./.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
  const KEY = (env.ARENA_BUYBACK_KEY || '').replace(/^0x/, '')
  if (!KEY) throw new Error('ARENA_BUYBACK_KEY missing in .env')
  const FLOOR_SUPRA = Number(env.BUYBACK_FLOOR || 200)   // keep this much SUPRA (gas + reserve); tune in .env

  const account = new SupraAccount(Buffer.from(KEY, 'hex'))
  const client = await SupraClient.init(RPC)
  const balMist = await client.getAccountSupraCoinBalance(account.address())
  const balSupra = Number(balMist) / 1e8
  const spendSupra = Math.floor(balSupra - FLOOR_SUPRA)

  if (spendSupra < MIN_BUY_SUPRA) { log(`skip — balance ${balSupra.toFixed(2)} SUPRA, nothing above floor ${FLOOR_SUPRA}`); process.exit(0) }

  const inMist = BigInt(spendSupra) * 100000000n
  const pres = await (await fetch(`${RPC}/rpc/v2/accounts/${POOL}/resources/${PUMP}::atmos_pump::Pool`)).json()
  const vS = BigInt(pres.data.virtual_supra_reserves), vT = BigInt(pres.data.virtual_token_reserves)
  const inNet = inMist * 99n / 100n
  const estOut = vT - (vS * vT) / (vS + inNet)
  const minOut = estOut * BigInt(10000 - SLIPPAGE_BPS) / 10000n

  log(`buying ${spendSupra} SUPRA → ≥ ${(Number(minOut) / 1e6).toLocaleString()} SCAT (balance was ${balSupra.toFixed(2)})`)

  const stringType = new TxnBuilderTypes.TypeTagStruct(new TxnBuilderTypes.StructTag(
    TxnBuilderTypes.AccountAddress.fromHex('0x1'), new TxnBuilderTypes.Identifier('string'), new TxnBuilderTypes.Identifier('String'), []))
  const args = [
    new HexString(POOL).toUint8Array(), BCS.bcsSerializeUint64(inMist),
    BCS.bcsSerializeUint64(minOut), BCS.bcsSerializeBool(false), new HexString(POOL).toUint8Array(),
  ]
  const seq = (await client.getAccountInfo(account.address())).sequence_number
  const serialized = await client.createSerializedRawTxObject(
    account.address(), seq, PUMP, 'atmos_pump', 'buy', [stringType], args, { maxGas: 500000n })
  const res = await client.sendTxUsingSerializedRawTransaction(account, serialized, { enableWaitForTransaction: true, enableTransactionSimulation: true })
  log(`RESULT ${res.result} tx ${res.txHash}`)
} catch (e) {
  log(`ERROR ${e?.message || e}`)
  process.exit(1)
}
