import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStarKey } from '@/hooks/useStarKey'
import { rarityColor } from '@/lib/nfts'
import { CRYSTARA_URL, ARENA_TREASURY } from '@/lib/constants'
import { applyPageSeo } from '@/lib/seo'
import GraduationBar from '@/components/GraduationBar'
import { DEN_THEMES, getThemeId, setThemeId, themeById, type DenTheme } from '@/arena/themes'

const hexCss = (n: number) => '#' + n.toString(16).padStart(6, '0')

const NFT_CREATOR_SHORT = '0x05eb…18a38'
import type { Fighter, Combatant, ActionKind, RoundEvent, Element } from '@/arena/types'
import { ROSTER, houseOpponent, ELEMENT_COLOR, myFighters, type HeldCat } from '@/arena/data/fighters'
import { lazy, Suspense } from 'react'
const ArenaCanvas = lazy(() => import('@/arena/ArenaCanvas'))
import {
  initCombatant, startRound, resolveRound, chooseBotAction, legalActions,
  winnerOf, ROUND_CAP, SPECIAL_COST, ULT_COST,
} from '@/arena/engine/combat'
import { makeRNG, seedFromString, type RNG } from '@/arena/engine/rng'
import { getXP, addXP, levelForXP, xpReward } from '@/arena/xp'

type Phase = 'gate' | 'select' | 'fighting' | 'over'

const ACTION_META: Record<ActionKind, { icon: string; label: string }> = {
  attack:   { icon: '⚔', label: 'Attack' },
  block:    { icon: '🛡', label: 'Block' },
  dodge:    { icon: '💨', label: 'Dodge' },
  special:  { icon: '🔥', label: 'Special' },
  ultimate: { icon: '☄', label: 'Ultimate' },
}

export default function Arena() {
  const { address, connect, installed, loading, paySupra } = useStarKey()
  const [demo, setDemo] = useState(false)
  const [unlocks, setUnlocks] = useState<string[]>([])
  const [buying, setBuying] = useState<string | null>(null)
  const [buyErr, setBuyErr] = useState<string | null>(null)
  const [own, setOwn] = useState<'idle' | 'checking' | 'owns' | 'none' | 'error'>('idle')
  const [held, setHeld] = useState<HeldCat[]>([])
  const [themeId, setTheme] = useState(getThemeId())
  const entered = own === 'owns' || demo
  const myCats = demo ? ROSTER : myFighters(held)

  // Real on-chain ScrollCat ownership check (Path A — Supra RPC via /api/arena/ownership).
  // The endpoint is cursor-chunked (Cloudflare subrequest cap), so we follow
  // nextCursor until it settles: minters resolve on the first call, transfer-
  // received wallets walk the edition universe a chunk at a time.
  useEffect(() => {
    if (!address) { setOwn('idle'); return }
    let cancelled = false
    setOwn('checking')
    const all = new Map<string, HeldCat>()
    const BATCH = 25
    const merge = (cats?: HeldCat[]) => {
      for (const h of (cats || [])) all.set(`${h.name}#${h.property_version}`, h)
      if (all.size > 0) { setHeld([...all.values()]); setOwn('owns') }   // enter on first cat
    }
    const fetchCursor = (c: number) =>
      fetch(`/api/arena/ownership?address=${address}&cursor=${c}`).then(r => r.json()).catch(() => ({} as Record<string, unknown>))
    ;(async () => {
      try {
        // First call: tx-scan (minted cats, instant entry) + chunk 0 + total count.
        const first = await fetchCursor(0) as { held?: HeldCat[]; total?: number }
        if (cancelled) return
        merge(first.held)
        const total = first.total ?? 0
        const cursors: number[] = []
        for (let c = BATCH; c < total; c += BATCH) cursors.push(c)
        // Sweep the rest in parallel, 4 chunks at a time (fast, but gentle on the RPC).
        for (let i = 0; i < cursors.length; i += 4) {
          if (cancelled) return
          const res = await Promise.all(cursors.slice(i, i + 4).map(fetchCursor)) as { held?: HeldCat[] }[]
          res.forEach(d => merge(d.held))
        }
        if (!cancelled && all.size === 0) setOwn('none')
      } catch { if (!cancelled) setOwn('error') }
    })()
    return () => { cancelled = true }
  }, [address])

  const [phase, setPhase] = useState<Phase>('gate')
  const [player, setPlayer] = useState<Combatant | null>(null)
  const [bot, setBot] = useState<Combatant | null>(null)
  const [round, setRound] = useState(1)
  const [log, setLog] = useState<RoundEvent[]>([])
  const [flash, setFlash] = useState<Element | null>(null)
  const [result, setResult] = useState<'win' | 'draw' | 'loss' | null>(null)
  const [xpGain, setXpGain] = useState(0)
  const rng = useRef<RNG | null>(null)

  useEffect(() => { if (entered && phase === 'gate') setPhase('select') }, [entered, phase])

  // Per-route SEO for the game (SPA — set client-side; Googlebot renders it).
  useEffect(() => applyPageSeo({
    title: "ScrollCat Arena — NFT Fighting Game on Supra | Fighters' Den",
    description: "Battle your ScrollCat NFT in the Fighters' Den — a hybrid PvP fighting game on the Supra blockchain. Pick your cat, fight, earn XP, own your legend.",
    canonical: 'https://scrollcat.org/arena',
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'VideoGame',
      name: 'ScrollCat Arena', url: 'https://scrollcat.org/arena',
      description: "Hybrid PvP fighting game where your ScrollCat NFT is the fighter. Battle in the Fighters' Den, earn XP, climb the arena.",
      genre: ['Fighting', 'Blockchain Game'], gamePlatform: 'Web Browser',
      applicationCategory: 'GameApplication', operatingSystem: 'Any',
      image: 'https://scrollcat.org/imgs/feedphantom.webp',
      publisher: { '@type': 'Organization', name: 'ScrollCat', url: 'https://scrollcat.org/' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  }), [])

  // Load purchased cosmetics for this wallet.
  useEffect(() => {
    if (!address) { setUnlocks([]); return }
    let cancelled = false
    fetch(`/api/arena/unlocks?address=${address}`).then(r => r.json())
      .then(d => { if (!cancelled) setUnlocks(d.unlocked || []) }).catch(() => {})
    return () => { cancelled = true }
  }, [address])

  // Buy a locked cosmetic: pay SUPRA via StarKey → verify + unlock server-side → equip.
  const buyTheme = useCallback(async (t: DenTheme) => {
    if (!address || !t.priceSupra) return
    setBuyErr(null); setBuying(t.id)
    try {
      const txHash = await paySupra(ARENA_TREASURY, t.priceSupra)
      const r = await fetch('/api/arena/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: address, txHash, itemId: t.id }),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || 'purchase failed')
      setUnlocks(d.unlocked || [])
      setThemeId(t.id); setTheme(t.id)          // auto-equip the new theme
    } catch (e) {
      setBuyErr((e as Error)?.message || 'purchase failed')
    } finally {
      setBuying(null)
    }
  }, [address, paySupra])

  const start = useCallback((f: Fighter) => {
    const seed = seedFromString(`${f.nftId}-${Date.now()}`)
    const r = makeRNG(seed)
    rng.current = r
    const opp = houseOpponent(f.nftId, seed)
    setPlayer(startRound(initCombatant(f)))
    setBot(startRound(initCombatant(opp)))
    setRound(1); setLog([]); setResult(null); setXpGain(0); setFlash(null)
    setPhase('fighting')
  }, [])

  const act = useCallback((a: ActionKind) => {
    if (!player || !bot || !rng.current || phase !== 'fighting') return
    const botAct = chooseBotAction(bot, player, rng.current)
    const res = resolveRound(player, bot, a, botAct, rng.current, round)
    setLog(l => [res.event, ...l])
    if (res.event.flash) { setFlash(res.event.flash); setTimeout(() => setFlash(null), 550) }

    const ended = res.a.hp <= 0 || res.b.hp <= 0 || round >= ROUND_CAP
    if (ended) {
      const w = winnerOf(res.a, res.b)
      const r: 'win' | 'draw' | 'loss' = w === 'A' ? 'win' : w === 'B' ? 'loss' : 'draw'
      const gain = xpReward(r)
      addXP(player.fighter.nftId, gain)
      setPlayer(res.a); setBot(res.b); setResult(r); setXpGain(gain); setPhase('over')
    } else {
      setPlayer(startRound(res.a)); setBot(startRound(res.b)); setRound(round + 1)
    }
  }, [player, bot, round, phase])

  // ---- Gate ----
  if (phase === 'gate') {
    return (
      <Shell>
        <div className="max-w-lg mx-auto text-center py-20">
          <h1 className="font-display text-4xl font-bold neon-text mb-3">Fighters' Den</h1>
          <p className="text-gray-400 mb-8">
            Connect your Supra wallet to verify your ScrollCat and enter the arena.
            One cat = one fighter.
          </p>

          {!address && (
            <button
              onClick={connect} disabled={loading}
              className="px-6 py-3 rounded-xl font-semibold border border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20 transition">
              {loading ? '…' : installed ? '⚡ Connect StarKey' : '⚡ Get StarKey'}
            </button>
          )}

          {address && own === 'checking' && (
            <div className="text-neon-cyan text-sm animate-pulse">Verifying your ScrollCat on Supra…</div>
          )}

          {address && own === 'none' && (
            <div className="space-y-4">
              <div className="text-neon-pink font-semibold">No ScrollCat found in this wallet.</div>
              <p className="text-sm text-gray-400">You need to hold a ScrollCat to enter the arena.</p>
              <a href={CRYSTARA_URL} target="_blank" rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-xl font-semibold border border-neon-purple/40 text-white bg-neon-purple/15 hover:bg-neon-purple/30 transition">
                Mint a ScrollCat on Crystara →
              </a>
            </div>
          )}

          {address && own === 'error' && (
            <div className="text-amber-400 text-sm">Couldn't reach Supra to verify right now — try again shortly.</div>
          )}

          <div className="mt-8">
            <button onClick={() => setDemo(true)} className="text-xs text-gray-500 hover:text-gray-300 underline">
              Continue in demo mode (no wallet) →
            </button>
          </div>
          <p className="mt-6 text-[11px] text-gray-600">
            Ownership is checked live on Supra (creator {NFT_CREATOR_SHORT} · ScrollCat). SUPRA &amp; $SCAT shown are simulated; XP is real.
          </p>
        </div>
      </Shell>
    )
  }

  // ---- Fighter select ----
  if (phase === 'select') {
    return (
      <Shell>
        <Dashboard xp={0} fighter={null} />
        <GraduationBar compact />
        <h1 className="font-display text-3xl font-bold neon-text mb-1">
          {demo ? 'Choose your fighter' : 'Your ScrollCats'}
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          {demo
            ? 'Each ScrollCat enters the arena in its battle-form.'
            : `${myCats.length} cat${myCats.length === 1 ? '' : 's'} in your wallet — each enters the arena in its battle-form.`}
        </p>
        <ThemeSelector themeId={themeId} unlocks={unlocks} buying={buying} buyErr={buyErr}
          canBuy={!!address && !demo} onPick={id => { setThemeId(id); setTheme(id) }} onBuy={buyTheme} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {myCats.map((f, i) => (
            <button key={`${f.nftId}-${i}`} onClick={() => start(f)}
              className="text-left bg-card-gradient border border-white/10 rounded-2xl p-4 hover:border-neon-purple/50 hover:shadow-neon-purple transition group">
              <img src={f.image} alt={f.nftName} className="w-full aspect-square object-cover rounded-xl mb-3 group-hover:scale-[1.02] transition" />
              <div className="font-display font-bold text-sm">{f.cls.name}</div>
              <div className={`text-[11px] ${rarityColor[f.rarity]}`}>{f.nftName} · {f.rarity}</div>
              <div className="text-[10px] text-gray-500 mt-1">{f.cls.tag}</div>
              <StatRow f={f} />
            </button>
          ))}
        </div>
      </Shell>
    )
  }

  // ---- Fighting / Over ----
  if (!player || !bot) return null
  const denColor = flash ? ELEMENT_COLOR[flash] : '#0e0e2a'

  return (
    <Shell>
      <Dashboard xp={getXP(player.fighter.nftId)} fighter={player.fighter} />

      {/* Arena — PixiJS Fighters' Den with a React HUD overlay */}
      <motion.div
        animate={{ boxShadow: flash ? `0 0 120px ${denColor}` : '0 0 30px rgba(0,0,0,0.4)' }}
        transition={{ duration: 0.25 }}
        className="relative rounded-3xl border border-white/10 overflow-hidden mb-5 bg-dark-900">
        <Suspense fallback={<div style={{ aspectRatio: '880 / 420' }} className="bg-dark-900" />}>
          <ArenaCanvas player={player} bot={bot} lastEvent={log[0] ?? null}
            theme={{ bg: themeById(themeId).bg, accent: themeById(themeId).accent }} />
        </Suspense>
        <div className="absolute inset-x-0 top-0 flex justify-between gap-3 p-4 pointer-events-none">
          <FighterHUD c={player} side="left" />
          <FighterHUD c={bot} side="right" />
        </div>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono text-gray-400/90 drop-shadow">
          ROUND {round} / {ROUND_CAP}
        </div>
      </motion.div>

      {/* Controls or result */}
      {phase === 'fighting' ? (
        <div className="flex flex-wrap gap-2 justify-center">
          {(['attack', 'block', 'dodge', 'special', 'ultimate'] as ActionKind[]).map(a => {
            const legal = legalActions(player).includes(a)
            const cost = a === 'special' ? SPECIAL_COST : a === 'ultimate' ? ULT_COST : 0
            return (
              <button key={a} onClick={() => act(a)} disabled={!legal}
                className={`px-4 py-3 rounded-xl font-semibold text-sm border transition min-w-[96px]
                  ${legal ? 'border-neon-purple/40 bg-neon-purple/10 hover:bg-neon-purple/25 text-white'
                          : 'border-white/5 text-gray-600 cursor-not-allowed'}`}>
                <div className="text-lg">{ACTION_META[a].icon}</div>
                <div>{ACTION_META[a].label}</div>
                {cost > 0 && <div className="text-[10px] text-neon-cyan">{cost} ENR</div>}
              </button>
            )
          })}
        </div>
      ) : (
        <ResultCard result={result!} xpGain={xpGain} player={player}
          onAgain={() => start(player.fighter)} onPick={() => setPhase('select')} />
      )}

      {/* Round log */}
      <div className="mt-6 max-w-2xl mx-auto">
        <div className="text-xs font-mono text-gray-500 space-y-1 max-h-40 overflow-auto">
          {log.map((e, i) => (
            <div key={log.length - i} className={i === 0 ? 'text-gray-300' : ''}>
              <span className="text-gray-600">R{e.round}</span> {e.note}
              {(e.critA || e.critB) && <span className="text-neon-gold"> CRIT!</span>}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// ---------- sub-components ----------

function Shell({ children }: { children: React.ReactNode }) {
  // min-h-screen matches the App Suspense fallback so the footer doesn't shift on
  // lazy load (CLS). ScrollToTop handles landing at the top on navigation.
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 min-h-screen">{children}</div>
  )
}

function ThemeSelector({ themeId, unlocks, buying, buyErr, canBuy, onPick, onBuy }: {
  themeId: string; unlocks: string[]; buying: string | null; buyErr: string | null
  canBuy: boolean; onPick: (id: string) => void; onBuy: (t: DenTheme) => void
}) {
  return (
    <div className="mb-6">
      <div className="text-xs text-gray-500 mb-2 font-mono">DEN THEME</div>
      <div className="flex flex-wrap gap-2">
        {DEN_THEMES.map(t => {
          const owned = t.free || unlocks.includes(t.id)
          const active = t.id === themeId
          const swatch = (
            <span className="w-4 h-4 rounded-full border border-white/20"
              style={{ background: hexCss(t.bg), boxShadow: `0 0 8px ${hexCss(t.accent)}` }} />
          )
          if (owned) {
            return (
              <button key={t.id} onClick={() => onPick(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition
                  ${active ? 'border-neon-cyan/60 bg-neon-cyan/10 text-white' : 'border-white/10 hover:border-white/25 text-gray-300'}`}>
                {swatch}<span>{t.name}</span>
              </button>
            )
          }
          // locked → buy
          return (
            <button key={t.id} disabled={!canBuy || buying !== null} onClick={() => onBuy(t)}
              title={canBuy ? `Buy with ${t.priceSupra} SUPRA` : 'Connect your wallet to buy'}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition
                border-neon-gold/30 bg-neon-gold/5 hover:bg-neon-gold/15 text-gray-300
                ${(!canBuy || buying !== null) ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {swatch}<span>{t.name}</span>
              <span className="text-neon-gold text-[10px]">{buying === t.id ? 'paying…' : `🔒 ${t.priceSupra} SUPRA`}</span>
            </button>
          )
        })}
      </div>
      <div className="text-[10px] text-gray-600 mt-1.5">Buy a theme with $SUPRA — a cut auto-buys $SCAT and pushes graduation.</div>
      {buyErr && <div className="text-[10px] text-neon-pink mt-1">{buyErr}</div>}
    </div>
  )
}

function StatRow({ f }: { f: Fighter }) {
  return (
    <div className="flex gap-2 mt-2 text-[10px] font-mono">
      <span className="text-red-400">⚔{f.atk}</span>
      <span className="text-blue-400">🛡{f.def}</span>
      <span className="text-green-400">💨{f.spd}</span>
    </div>
  )
}

function FighterHUD({ c, side }: { c: Combatant; side: 'left' | 'right' }) {
  const hpPct = Math.max(0, (c.hp / c.maxHp) * 100)
  const enPct = (c.energy / ULT_COST) * 100
  const right = side === 'right'
  return (
    <div className={`w-[42%] ${right ? 'text-right' : ''}`}>
      <div className="font-display font-bold text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{c.fighter.cls.name}</div>
      <div className="text-[10px] text-gray-300 mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{c.fighter.nftName}</div>
      <div className="h-3 rounded-full bg-black/50 border border-white/10 overflow-hidden mb-1">
        <motion.div className={`h-full bg-gradient-to-r from-green-500 to-emerald-400 ${right ? 'ml-auto' : ''}`}
          animate={{ width: `${hpPct}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="text-[10px] font-mono text-gray-200 mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{c.hp} / {c.maxHp} HP</div>
      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
        <motion.div className={`h-full bg-neon-cyan ${right ? 'ml-auto' : ''}`}
          animate={{ width: `${enPct}%` }} transition={{ duration: 0.3 }} />
      </div>
    </div>
  )
}

function Dashboard({ xp, fighter }: { xp: number; fighter: Fighter | null }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="flex items-center gap-4 text-xs font-mono bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2">
        <span className="text-neon-cyan">{xp} XP · Lv {levelForXP(xp)}</span>
        {fighter && <span className="text-gray-400">{fighter.cls.name}</span>}
      </div>
    </div>
  )
}

function ResultCard({ result, xpGain, player, onAgain, onPick }: {
  result: 'win' | 'draw' | 'loss'; xpGain: number; player: Combatant
  onAgain: () => void; onPick: () => void
}) {
  const head = result === 'win' ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'DRAW'
  const color = result === 'win' ? 'text-neon-gold' : result === 'loss' ? 'text-neon-pink' : 'text-gray-300'
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="text-center bg-card-gradient border border-white/10 rounded-2xl p-6 max-w-md mx-auto">
      <div className={`font-display text-3xl font-bold mb-2 ${color}`}>{head}</div>
      <div className="text-sm text-neon-cyan mb-1">+{xpGain} XP</div>
      <div className="text-xs text-gray-500 mb-5">
        {player.fighter.nftName} now at {getXP(player.fighter.nftId)} XP · Lv {levelForXP(getXP(player.fighter.nftId))}
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={onAgain} className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-neon-purple/40 bg-neon-purple/15 hover:bg-neon-purple/30">
          Fight again
        </button>
        <button onClick={onPick} className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-white/10 text-gray-300 hover:bg-white/5">
          Pick fighter
        </button>
      </div>
    </motion.div>
  )
}
