// One-time script: registers the /verify slash command on the ScrollCat Discord server.
// Run once after deploying: node register-slash-command.mjs

const APP_ID   = '1501306415547945132';
const GUILD_ID = '1501305393006117024';
const TOKEN    = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.error('Set DISCORD_BOT_TOKEN env var before running.');
  process.exit(1);
}

const res = await fetch(
  `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`,
  {
    method:  'POST',
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:        'verify',
      description: 'Verify your $SCAT wallet to unlock the 💎 SCAT Holder role',
      type:        1,
    }),
  }
);

const data = await res.json();
if (data.id) {
  console.log('✅ /verify command registered:', data.id);
} else {
  console.error('✗ Failed:', JSON.stringify(data, null, 2));
}
