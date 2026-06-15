#!/usr/bin/env node
// ScrollCat Discord auto-poster — runs daily on VPS cron.
// Self-contained: webhooks (no auth), content bank, state file for no-repeats.
// Posts 1 general + 1 update every run. holders ~Mon/Thu, alpha ~Wed/Sat (only if
// a webhook for that channel exists in .env). Fires a milestone announcement when
// $SCAT crosses a graduation threshold.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const BANK = JSON.parse(readFileSync(join(DIR, 'bank.json'), 'utf8'));
const STATE_PATH = join(DIR, 'state.json');
const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  : { posted: {}, lastMilestone: 1 };
state.posted ||= {};

// --- env / webhooks ---------------------------------------------------------
const env = {};
for (const line of readFileSync(join(DIR, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const HOOKS = {
  general: env.WEBHOOK_GENERAL,
  updates: env.WEBHOOK_UPDATES,
  announcements: env.WEBHOOK_ANNOUNCEMENTS,
  holders: env.WEBHOOK_HOLDERS,
  alpha: env.WEBHOOK_ALPHA,
};

const now = Date.now(), DAY = 86400000;
const today = new Date().toISOString().slice(0, 10);
const DRY = process.env.DRY === '1';
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

// --- live stats (read the bonding curve straight off Supra RPC — the VPS IP is
//     Cloudflare-challenged on scrollcat.org, but Supra RPC is reachable) --------
const RPC = 'https://rpc-mainnet.supra.com/rpc/v2';
const POOL_MODULE = '0xa4a4a31116e114bf3c4f4728914e6b43db73279a4421b0768993e07248fe2234';
const POOL = '0x44a2dc0956177a712d6fa88193718af8730bac51229eefc9f0de7261f20d88d3';
async function rpcRes(type) {
  const r = await fetch(`${RPC}/accounts/${POOL}/resources/${encodeURIComponent(type)}`, { signal: AbortSignal.timeout(20000) });
  return r.ok ? (await r.json())?.data : null;
}
async function getStats() {
  try {
    const pool = await rpcRes(`${POOL_MODULE}::atmos_pump::Pool`);
    const coin = await rpcRes('0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>');
    if (!pool || !coin) { log('stats: pool/coin resource unavailable'); return null; }
    const vSupra = BigInt(pool.virtual_supra_reserves), vToken = BigInt(pool.virtual_token_reserves);
    const remain = BigInt(pool.remain_token_reserves), raised = BigInt(coin.coin.value);
    const target = (vSupra * vToken) / remain - (vSupra - raised);
    const toS = x => Number(x) / 1e8;
    const pctNum = target > 0n ? Math.min(100, Number((raised * 10000n) / target) / 100) : 0;
    return {
      pct: Number(pctNum.toFixed(2)), pctNum,
      raised: Math.round(toS(raised)).toLocaleString('en-US'),
      remaining: Math.max(0, Math.round(toS(target - raised))).toLocaleString('en-US'),
    };
  } catch (e) { log('stats fetch failed:', e.message); return null; }
}
const fill = (t, st) => st ? t.replaceAll('{pct}', st.pct).replaceAll('{raised}', st.raised).replaceAll('{remaining}', st.remaining) : t;

// --- pick next unused item in a category (oldest-posted / never-posted first)
function pickNext(items) {
  let cands = items.filter(it => {
    const d = state.posted[it.id];
    return !d || (now - new Date(d).getTime()) > 30 * DAY;
  });
  if (!cands.length) cands = items;
  cands.sort((a, b) => (new Date(state.posted[a.id] || 0)) - (new Date(state.posted[b.id] || 0)));
  return cands[0];
}

async function post(channel, content, id) {
  const url = HOOKS[channel];
  if (!url) { log(`skip ${channel} (no webhook configured)`); return; }
  if (DRY) { log(`DRY ${channel} ${id || ''} → ${content.slice(0, 90).replace(/\n/g, ' ')}…`); return; }
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ScrollCat', content }),
  });
  if (r.status === 204) { log(`posted ${channel} ${id || ''} ✅`); if (id) state.posted[id] = today; }
  else log(`FAILED ${channel} ${id || ''} → HTTP ${r.status}: ${await r.text().catch(()=> '')}`);
}

// --- invite watchdog: catch an expired/expiring Discord invite before the
//     community does. Permanent invites won't trigger this; it's insurance. ----
async function checkInvite() {
  const code = env.INVITE_CODE;
  if (!code) return;
  try {
    const r = await fetch(`https://discord.com/api/v10/invites/${code}?with_expiration=true`, { signal: AbortSignal.timeout(15000) });
    if (r.status === 404 || r.status === 410) {
      log(`⚠️ INVITE DEAD (${code}) → alerting #updates`);
      await post('updates', '⚠️ Quick heads-up — our Discord invite needs a refresh. A fresh link is on the way. (If you got here, you’re already in 😼)');
      return;
    }
    const inv = await r.json();
    if (inv.expires_at) {
      const days = (new Date(inv.expires_at) - now) / DAY;
      log(`invite ${code} expires in ${days.toFixed(1)}d (${inv.expires_at})`);
      if (days < 7) log(`⚠️ INVITE EXPIRES SOON (${inv.expires_at}) — set it to "Never" in Discord!`);
    } else {
      log(`invite ${code} is permanent ✅`);
    }
  } catch (e) { log('invite check failed:', e.message); }
}

// --- main -------------------------------------------------------------------
const stats = await getStats();
const dow = new Date().getUTCDay(); // 0 Sun .. 6 Sat
await checkInvite();

// milestone announcement (highest newly-crossed threshold)
if (stats) {
  const crossed = Object.keys(BANK.milestones).map(Number)
    .filter(m => stats.pctNum >= m && m > (state.lastMilestone || 1)).sort((a, b) => a - b);
  if (crossed.length) {
    const m = crossed[crossed.length - 1];
    await post('announcements', fill(BANK.milestones[String(m)], stats), `M-${m}`);
    state.lastMilestone = m;
  }
}

// daily content. If stats failed, avoid items with {placeholders} so we never post literal "{pct}".
const ok = items => stats ? items : items.filter(it => !it.text.includes('{'));
const g = pickNext(ok(BANK.general)); if (g) await post('general', fill(g.text, stats), g.id);
const u = pickNext(ok(BANK.updates)); if (u) await post('updates', fill(u.text, stats), u.id);
if (dow === 1 || dow === 4) { const h = pickNext(ok(BANK.holders)); if (h) await post('holders', fill(h.text, stats), h.id); }
if (dow === 3 || dow === 6) { const a = pickNext(ok(BANK.alpha)); if (a) await post('alpha', fill(a.text, stats), a.id); }

if (!DRY) writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
log(`${DRY ? '[DRY] ' : ''}run complete. lastMilestone =`, state.lastMilestone, '| pct =', stats?.pct ?? 'n/a');
