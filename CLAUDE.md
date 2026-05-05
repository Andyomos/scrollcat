# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ScrollCat ($SCAT)** — NFT & token website for a meme token on the **Supra blockchain** via the **Atmos protocol** (Token Studio). Deploying to **Cloudflare Pages**.

## Current State

Single-file static site (`index.html`) with 6 NFT images in `imgs/`. No build system — pure HTML/CSS.

## Planned Features

- Multi-page NFT website with richer UI
- **StarKey Wallet** login (Supra's official wallet — `window.starkey` injected provider)
- **Token swap** via Atmos DEX
- Cloudflare Pages deployment

## Blockchain Context

| Item | Value |
|---|---|
| Chain | Supra (HyperNova consensus) |
| Token contract | `0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109` |
| Launchpad | Atmos Pump — `app.atmos.ag` |
| Wallet | StarKey (`window.starkey.supra`) |

## StarKey Wallet Integration

StarKey injects `window.starkey` into the browser. Key calls:
```js
const provider = window.starkey?.supra
await provider.connect()            // returns accounts array
await provider.account()            // current connected account
provider.on('accountChanged', cb)
provider.on('disconnect', cb)
```

## Deployment

Static files → Cloudflare Pages. No server needed. `_redirects` or `_headers` file in root for Cloudflare config if required.
