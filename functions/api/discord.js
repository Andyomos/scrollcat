// Cloudflare Pages Function — Discord slash command handler
// Mounted at: POST /api/discord
// Discord sends every slash command interaction here.

export async function onRequestPost(context) {
  const { request, env } = context;

  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp  = request.headers.get('X-Signature-Timestamp');
  if (!signature || !timestamp) {
    return new Response('Missing signature headers', { status: 401 });
  }

  const body = await request.text();

  const valid = await verifyDiscordSignature(env.DISCORD_PUBLIC_KEY, signature, timestamp, body);
  if (!valid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  const data = JSON.parse(body);

  // PING — Discord health check
  if (data.type === 1) return Response.json({ type: 1 });

  // APPLICATION_COMMAND
  if (data.type === 2 && data.data?.name === 'verify') {
    const userId = data.member?.user?.id ?? data.user?.id;
    const nonce  = await generateNonce(userId, env.HMAC_SECRET);
    const url    = `https://scrollcat.org/verify?nonce=${encodeURIComponent(nonce)}&user=${userId}`;

    return Response.json({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        flags: 64, // EPHEMERAL — only the user who ran /verify sees this
        content: [
          '🐱 **ScrollCat Wallet Verification**',
          '',
          'Click the link, connect your **StarKey wallet**, and sign the message.',
          'If your wallet holds **$SCAT** or a **ScrollCat NFT** you\'ll receive the 💎 **SCAT Holder** role instantly.',
          '',
          `👉 ${url}`,
          '',
          '⏱️ *Link expires in 10 minutes.*',
        ].join('\n'),
      },
    });
  }

  return Response.json({ type: 1 });
}

// ── Discord Ed25519 signature verification ────────────────────────────────
async function verifyDiscordSignature(publicKeyHex, signature, timestamp, body) {
  try {
    const key = await crypto.subtle.importKey(
      'raw', hexToBytes(publicKeyHex), { name: 'Ed25519' }, false, ['verify']
    );
    return await crypto.subtle.verify(
      { name: 'Ed25519' }, key, hexToBytes(signature), new TextEncoder().encode(timestamp + body)
    );
  } catch (e) {
    console.error('Ed25519 verify error:', e?.message ?? e);
    return false;
  }
}

// ── HMAC nonce: "userId:timestamp:hmac" ───────────────────────────────────
async function generateNonce(userId, secret) {
  const ts      = Math.floor(Date.now() / 1000);
  const payload = `${userId}:${ts}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}:${bytesToHex(new Uint8Array(sig))}`;
}

function hexToBytes(hex) {
  const h = hex.replace(/^0x/, '');
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return a;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
