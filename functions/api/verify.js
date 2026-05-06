// Cloudflare Pages Function — Supra wallet verification endpoint
// Mounted at: POST /api/verify
// Called by scrollcat.org/verify page after user signs with StarKey.

const SUPRA_RPC    = 'https://rpc-mainnet.supra.com/rpc/v1';
const SCAT_ADDRESS = '0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109';
const NONCE_TTL    = 10 * 60; // 10 minutes in seconds

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS — allow scrollcat.org
  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin.includes('scrollcat.org') ? origin : 'https://scrollcat.org',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400, headers: corsHeaders }); }

  const { wallet, signature, publicKey, nonce, userId } = body ?? {};

  if (!wallet || !nonce || !userId) {
    return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400, headers: corsHeaders });
  }

  // ── 1. Verify HMAC nonce (not expired, belongs to this Discord user) ──
  const nonceOk = await verifyNonce(nonce, userId, env.HMAC_SECRET);
  if (!nonceOk) {
    return Response.json({
      success: false,
      error: 'Verification link is invalid or has expired. Run /verify in Discord again.',
    }, { status: 400, headers: corsHeaders });
  }

  // ── 2. Verify Ed25519 wallet signature (if StarKey provided one) ──────
  if (signature && publicKey) {
    const sigOk = await verifyEd25519(publicKey, nonce, signature);
    if (!sigOk) {
      return Response.json({
        success: false,
        error: 'Wallet signature is invalid. Make sure you are signing with the correct wallet.',
      }, { status: 400, headers: corsHeaders });
    }
  }

  // ── 3. Check Supra chain for $SCAT or ScrollCat NFT holdings ──────────
  const { holds, debug } = await checkSupraHoldings(wallet);
  if (!holds) {
    return Response.json({
      success: false,
      error: 'Wallet has no qualifying holdings. DEBUG RESOURCE TYPES:\n' + debug,
    }, { status: 403, headers: corsHeaders });
  }

  // ── 4. Assign 💎 SCAT Holder role in Discord ──────────────────────────
  try {
    await assignDiscordRole(userId, env.DISCORD_GUILD_ID, env.DISCORD_ROLE_ID, env.DISCORD_BOT_TOKEN);
  } catch (err) {
    console.error('Discord role assignment failed:', err);
    return Response.json({
      success: false,
      error: 'Verified! But failed to assign the Discord role — please contact a mod.',
    }, { status: 500, headers: corsHeaders });
  }

  return Response.json(
    { success: true, message: '💎 SCAT Holder role assigned! Head back to Discord.' },
    { headers: corsHeaders }
  );
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  'https://scrollcat.org',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── Verify HMAC nonce ─────────────────────────────────────────────────────
async function verifyNonce(nonce, userId, secret) {
  try {
    const parts = nonce.split(':');
    if (parts.length !== 3) return false;
    const [nonceUser, ts, providedMac] = parts;
    if (nonceUser !== userId) return false;

    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(ts, 10) > NONCE_TTL) return false;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${nonceUser}:${ts}`));
    const expectedHex = bytesToHex(new Uint8Array(expected));
    return timingSafeEqual(expectedHex, providedMac);
  } catch { return false; }
}

// ── Verify StarKey Ed25519 signature ──────────────────────────────────────
async function verifyEd25519(publicKeyHex, message, signatureHex) {
  try {
    const key = await crypto.subtle.importKey(
      'raw', hexToBytes(publicKeyHex), { name: 'Ed25519' }, false, ['verify']
    );
    return crypto.subtle.verify(
      'Ed25519', key, hexToBytes(signatureHex), new TextEncoder().encode(message)
    );
  } catch { return false; }
}

// ── Check Supra account resources for $SCAT / ScrollCat NFT ──────────────
async function checkSupraHoldings(walletAddress) {
  try {
    const res = await fetch(`${SUPRA_RPC}/accounts/${walletAddress}/resources`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { holds: false, debug: `RPC ${res.status}` };

    const body = await res.json();

    // Supra RPC returns { Resources: { resource: [ [typeString, dataObj], ... ] } }
    const resourceList = body?.Resources?.resource ?? [];

    const types = resourceList.map(([t]) => t).filter(Boolean);

    const holds = resourceList.some(([type, data]) => {
      if (!type?.includes(SCAT_ADDRESS)) return false;
      const bal = data?.coin?.value ?? data?.amount ?? data?.balance ?? data?.supply ?? 0;
      try { return BigInt(bal) > 0n; }
      catch { return Number(bal) > 0; }
    });

    return { holds, debug: `wallet=${walletAddress}\n` + types.join('\n') };
  } catch (err) {
    console.error('Supra RPC error:', err);
    return { holds: false, debug: String(err) };
  }
}

// ── Assign Discord role via REST API ─────────────────────────────────────
async function assignDiscordRole(userId, guildId, roleId, botToken) {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': 'Automated SCAT holder verification',
      },
    }
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Discord API ${res.status}: ${err}`);
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────
function hexToBytes(hex) {
  const h = hex.replace(/^0x/, '');
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return a;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
