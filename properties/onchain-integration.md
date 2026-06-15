# ScrollCat Arena — On-Chain Integration (Supra) — reverse-engineered 2026-06-12

Everything needed to verify ScrollCat NFT ownership on Supra for the Arena login gate (Path A — pure Supra RPC, no third-party indexer). All of this was confirmed against live mainnet.

## Identifiers (CONFIRMED on-chain)
| Thing | Value |
|---|---|
| Supra RPC | `https://rpc-mainnet.supra.com/rpc/v1` and `/rpc/v2` |
| Chain id | 6 (mainnet) |
| **NFT creator** (Token-v1 creator) | `0x05eb2a2c5c2b7572265c3271da23d106850313dee3c3b305df56e03fc0e18a38` ⚠️ the Crystara/Atmos mint account — **NOT** the treasury |
| Treasury / creator-of-record on Crystara UI | `0xf4a915b5e29bb5e8bcad30ebf78495e6a6c3acd2bcaff2ce36b861a5b50f9988` |
| Distributor (holds NFT stock for claims) | `0x56e54b29f9e518ea8944df0b11e65a20b026a6dc7ca22e1aeeed518d5dc6ee31` |
| Collection name | `ScrollCat` |
| Token (design) names | `TOKEN_1` … `TOKEN_12` (the 12 designs; `TOKEN_5` = Feed Phantom per claim.js) |
| Standard | Aptos **Token v1** (`0x3::token`) |
| Gacha contract | `0xfd566b048d7ea241ebd4d28a3d60a9eaaaa29a718dfff52f2ff4ca8581363b85::crystara_blindbox_v1` (`purchase_multiple_lootboxes`) |
| Mint status (2026-06-12) | 321 rolled / 179 stock / 500 max · 50 SUPRA/roll |

## The hard part (why a naive read fails)
Crystara mints **each gacha edition as a distinct `property_version` (1,2,3…)**, not pv0. And the Supra node API **cannot enumerate** a wallet's token table. So you can't list a wallet's ScrollCats by brute-forcing names. There is **no public Supra hosted indexer GraphQL** (the usual Aptos `current_token_ownerships_v2` host doesn't resolve for Supra). Crystara has its own indexer API (docs.crystara.trade/category/nft-data-indexer) but the docs host is Cloudflare-gated.

## The working method (verified, two-step)
1. **Discover candidates** — `GET /rpc/v2/accounts/{addr}/transactions?limit=100`. Events live at **`tx.output.Move.events`**. Collect every `0x3::token::Deposit` / `DepositEvent` where `data.id.token_data_id.creator == creator` and `.collection == "ScrollCat"` → set of `{name, property_version}` the wallet ever received.
2. **Confirm current holding (authoritative)** — `POST /rpc/v1/tables/{handle}/item` where `{handle}` = the wallet's `0x3::token::TokenStore.data.tokens.handle` (read from `/rpc/v2/accounts/{addr}/resources/0x3::token::TokenStore`). Body:
```json
{"key_type":"0x3::token::TokenId","value_type":"0x3::token::Token",
 "key":{"token_data_id":{"creator":"0x05eb2a…","collection":"ScrollCat","name":"TOKEN_5"},"property_version":"1"}}
```
Returns `null` (not held) or the Token `{amount, id, token_properties}`. **`amount ≥ 1` ⇒ owns.** Nets out anything sold/transferred.

### Verified positive
Distributor holds `TOKEN_5 pv1` → `{"amount":"1", … token_properties:{rarity:"Common", seed:0x3f5c…}}`. Treasury received TOKEN_5 pv1/2/3 + TOKEN_4 pv1 but sold all → `owns:false`. ✅ both branches correct.

### Bonus: on-chain rarity
`token_properties.map.data[key="rarity"].value` is a length-prefixed hex string, e.g. `0x06436f6d6d6f6e` = `"Common"`. So each held cat's real rarity is readable (maps to fighter stat scaling).

## Implementation
- `functions/api/arena/ownership.js` — Cloudflare Pages Function, `GET /api/arena/ownership?address=0x…` → `{owns, count, held:[{name,property_version,amount}]}`. Address normalized (strip 0x, pad 64) because events render creator unpadded (`0x5eb2a…`) vs config padded (`0x05eb2a…`).
- Frontend: `src/pages/Arena.tsx` gate calls it on wallet connect → checking/owns/none/error, with a demo-mode fallback for testing.
- Reuses Supra plumbing already in `functions/api/claim.js` (BCS, signing, tx submit) — that file is the reference for any future on-chain WRITE (e.g., SUPRA escrow in Phase 2).

## Covering transfer-received wallets — the "edition universe" (SOLVED 2026-06-12)
The tx-scan alone misses cats received via inbound transfer (never minted). Closed without a block-crawl indexer (the chain is 47M+ blocks, mostly empty, no global event feed — a crawler is impractical) by enumerating the **exact minted edition set**:
- The creator's `0x3::token::Collections` resource exposes `mint_token_events.counter` (= 321) and a `token_data` table (`handle`).
- Read each `TOKEN_n`'s `TokenData` (POST that handle, key_type `0x3::token::TokenDataId`, value_type `0x3::token::TokenData`) → **`largest_property_version`** = editions minted for that design. Universe = `TOKEN_n × pv 1..largest_n` = exactly **321** (matches mint_token_events). Supplies 2026-06-12: T1 43, T2 12, T3 29, T4 36, T5 36, T6 14, T7 13, T8 37, T9 24, T10 31, T11 3, T12 43.
- Check any wallet (minter OR transfer-recipient): sweep the 321 editions via table-item reads against the wallet's TokenStore handle, short-circuit on first `amount≥1`. Bounded & complete.

### Cloudflare subrequest cap → cursor-chunked
A single CF request allows ~50 subrequests, so the 321-sweep is **cursor-chunked**: `GET /api/arena/ownership?address=&cursor=N` sweeps `SWEEP_BATCH=25` editions per call → `{owns}` / `{done}` / `{nextCursor}`. Frontend loops `nextCursor` until settled (minters resolve at cursor 0 via tx-scan; transfer-recipients walk the universe). Edition universe + per-wallet result are KV-cached (`SCROLLCAT_LEADERBOARD`, keys `arena:editions:v1` / `arena:owns:v1:{addr}`). **Verified live:** distributor (transfer-received) resolves `owns:true TOKEN_5 pv1 Common` at cursor 100.
