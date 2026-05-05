# ScrollCat ($SCAT)

> The Meme Protector of the Feed. Born on Supra. Built for degens.

**Live site:** https://scrollcat.org  
**Token:** [$SCAT on Atmos](https://app.atmos.ag/en/token-studio/0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109)  
**NFT Marketplace:** [Crystara](https://crystara.trade/marketplace/scrollcat)  
**Twitter/X:** [@cat_scroll](https://x.com/cat_scroll)  
**Telegram:** [@cat_scroll](https://t.me/cat_scroll)

---

## What is ScrollCat?

ScrollCat is a meme token and NFT collection on the **Supra blockchain** (HyperNova consensus) via the **Atmos Token Studio** protocol. The project features:

- **$SCAT token** — launched on Atmos Pump
- **12-piece NFT collection** — 6 rarity tiers, 200 supply each
- **Multi-chain swap** — powered by LI.FI, 0.05% fee (lowest in market)
- **ScrollKeeper community** — degens protecting the doomscroll

---

## NFT Collection

| Rarity | Supply | NFTs |
|--------|--------|------|
| ⬜ Common | 200 each | Doomscroller, Grid Watcher, Feed Phantom |
| 🟩 Uncommon | 200 each | Void Rider, Chain Ghost |
| 🟦 Rare | 200 each | Sigma Scroll, Degen Oracle |
| 🟪 Epic | 200 each | Flame Keeper, Shadow Glitch |
| 🟨 Legendary | 200 each | Genesis One, Cosmic Sovereign |
| 🌈 Mythic | 200 | The Infinite Scroller |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Routing | React Router v6 (SPA) |
| EVM Wallets | Wagmi v2 + Reown AppKit |
| Supra Wallet | StarKey (`window.starkey.supra`) |
| Swap | LI.FI Widget v3 |
| Hosting | Cloudflare Pages |

---

## Project Structure

```
scrollcat-main/
├── public/
│   ├── imgs/              # NFT images + logo
│   ├── _redirects         # Cloudflare SPA routing
│   ├── _headers           # Cloudflare security headers
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── home/          # Hero, NFTShowcase, Stats
│   │   ├── layout/        # Header, Footer
│   │   └── nfts/          # NFTCard, TraitBadge
│   ├── hooks/
│   │   └── useStarKey.ts  # Supra StarKey wallet hook
│   ├── lib/
│   │   ├── constants.ts   # All contract addresses, fees, socials, emails
│   │   ├── nfts.ts        # NFT metadata (12 items)
│   │   └── wagmi.ts       # AppKit + WagmiAdapter config
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── NFTs.tsx
│   │   ├── Swap.tsx       # LI.FI widget
│   │   └── About.tsx
│   ├── App.tsx
│   ├── main.tsx           # AppKit init + providers
│   └── index.css
└── index.html             # Full SEO meta tags
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env and set WalletConnect project ID
cp .env.example .env
# VITE_WC_PROJECT_ID=your_project_id

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_WC_PROJECT_ID` | WalletConnect / Reown project ID — get one at [dashboard.reown.com](https://dashboard.reown.com) |

---

## Build & Deploy

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
CLOUDFLARE_API_KEY=your_global_api_key \
CLOUDFLARE_EMAIL=your@email.com \
npx wrangler pages deploy dist --project-name scrollcat
```

> **Note:** Uses Cloudflare Global API Key (not API Token) for wrangler authentication.

---

## Key Addresses

| Item | Address |
|------|---------|
| $SCAT Contract | `0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109` |
| Fee Wallet (EVM) | `0xF6F25919dcca48eeEced8dcE1048fCa32AF3b7A0` |
| Supra Owner Wallet | `0xf4a915b5e29bb5e8bcad30ebf78495e6a6c3acd2bcaff2ce36b861a5b50f9988` |

---

## Contact

| Type | Email |
|------|-------|
| General | contact@scrollcat.org |
| NFTs | nft@scrollcat.org |
| Support | support@scrollcat.org |
| Info | info@scrollcat.org |
