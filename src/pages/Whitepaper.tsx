import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { applyPageSeo } from '@/lib/seo'
import { CRYSTARA_URL, ATMOS_URL, SOCIAL } from '@/lib/constants'
import GraduationBar from '@/components/GraduationBar'

export default function Whitepaper() {
  useEffect(() => applyPageSeo({
    title: 'ScrollCat Whitepaper — $SCAT Tokenomics & Game Economy on Supra',
    description: 'How ScrollCat works: the 500-cat NFT, the $SCAT token on Atmos, the Arena fighting game, the play-to-graduate flywheel, and the roadmap to a real on-chain economy on Supra.',
    canonical: 'https://scrollcat.org/whitepaper',
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: 'ScrollCat Whitepaper — Tokenomics & Game Economy',
      author: { '@type': 'Organization', name: 'ScrollCat' },
      publisher: { '@type': 'Organization', name: 'ScrollCat', url: 'https://scrollcat.org/' },
      mainEntityOfPage: 'https://scrollcat.org/whitepaper',
    },
  }), [])

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
        <div className="text-xs font-mono text-neon-cyan tracking-widest mb-3">LITEPAPER · v1</div>
        <h1 className="font-display font-black text-4xl sm:text-5xl neon-text mb-4">ScrollCat</h1>
        <p className="text-gray-400 leading-relaxed max-w-xl mx-auto">
          A meme-native NFT collection, fighting game, and token economy on the <b className="text-white">Supra</b> blockchain.
          Own a cat. Fight in the arena. Grow the economy. <i>Own your legend.</i>
        </p>
      </motion.div>

      <GraduationBar />

      <Section n="01" title="The vision">
        ScrollCat turns a 500-piece meme collection into a living economy. The NFT is your identity and your
        fighter; <b className="text-white">$SCAT</b> is the ecosystem currency; the Arena is where it all comes
        alive. The goal isn't a quick mint — it's a community that compounds value together.
      </Section>

      <Section n="02" title="Three assets, one loop">
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <Asset t="ScrollCat NFT" c="neon-purple" d="500 hard cap. Your access pass + fighter. Levels, XP and cosmetics bind to it, so a played cat is worth more." />
          <Asset t="$SCAT" c="neon-pink" d="The ecosystem currency on Atmos. Powers cosmetics, rewards and the economy. 1B supply." />
          <Asset t="SUPRA" c="neon-cyan" d="Supra's native coin — settlement + stakes. Real value in, real value out." />
        </div>
      </Section>

      <Section n="03" title="ScrollCat Arena">
        Your cat enters the Fighters' Den in its battle-form. Hybrid combat — choose Attack / Block / Dodge /
        Special / Ultimate each round, resolved simultaneously by an open-source, deterministic engine seeded by
        Supra <b className="text-white">dVRF</b> (provably fair — no one can rig a crit). Win fights, earn XP,
        climb the ladder. NFT-gated: one cat, one fighter.
      </Section>

      <Section n="04" title="$SCAT tokenomics">
        <p>
          $SCAT launched on the <a className="text-neon-cyan underline" href={ATMOS_URL} target="_blank" rel="noreferrer">Atmos&nbsp;Pump</a> bonding
          curve — 1B supply, no pre-sale, fair launch. As SUPRA flows in, the price climbs the curve until it
          <b className="text-white"> graduates</b> into a deep HyperAMM liquidity pool. Graduation is the moment the
          full economy unlocks.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
          <li>• <b className="text-white">800M</b> SCAT sold along the curve · <b className="text-white">200M</b> seeded into the AMM at graduation.</li>
          <li>• A fixed share of <b className="text-white">all Arena revenue auto-buys $SCAT</b> on the curve — the game pushes graduation.</li>
          <li>• Post-graduation, $SCAT becomes the in-game currency for rewards, the marketplace and (optional) stakes.</li>
        </ul>
      </Section>

      <Section n="05" title="Cosmetics & sinks — the two tiers">
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <Asset t="Standard — the fuel" c="neon-cyan" d="Themes, taunts, finishers, auras. Unlimited, bound to your cat (no resale). Every purchase buys $SCAT. They make your NFT worth more." />
          <Asset t="Prestige — the flex" c="neon-gold" d="A thin layer of limited, tradeable cosmetic NFTs on Crystara — scarcity, status, and resale royalties. Won in seasons or sold in windows." />
        </div>
        <p className="mt-3 text-sm text-gray-500">Unlimited consumables keep perpetual buy-pressure on $SCAT; the NFT itself is the store of value; prestige items add collectible depth without starving the engine.</p>
      </Section>

      <Section n="06" title="The play-to-graduate flywheel">
        <pre className="text-[11px] sm:text-xs font-mono text-neon-cyan/90 bg-black/30 border border-white/10 rounded-xl p-4 overflow-x-auto leading-relaxed">{`Play  →  SUPRA in (NFT entry · cosmetics · tournaments)
      →  a cut buys $SCAT on the curve
      →  $SCAT climbs toward graduation
      →  graduation → deep HyperAMM liquidity
      →  $SCAT economy unlocks (rewards · stakes · market)
   NFTs gate play  →  the 500 floor rises as the game grows`}</pre>
      </Section>

      <Section n="07" title="Roadmap">
        <Phase done t="Phase 01 — Genesis" items={['$SCAT launched on Atmos', 'Website live', 'Community built']} />
        <Phase done t="Phase 02 — Collection" items={['500-cat NFT collection', '6 rarity tiers', 'Crystara mint live']} />
        <Phase done t="Phase 03 — Swap" items={['Multi-chain swap aggregator', 'LI.FI integration', '0.05% fee live']} />
        <Phase live t="Phase 04 — Arena" items={['NFT-gated fighting game', 'Provably-fair dVRF combat', 'Play-to-graduate economy', 'Autonomous $SCAT buyback']} />
        <Phase t="Phase 05 — Graduate & Beyond" items={['$SCAT graduation to deep liquidity', 'Cosmetics — fuel + prestige NFTs', 'Expanded roster + tournaments', 'Supra bridge + governance']} />
      </Section>

      <Section n="08" title="Fairness & trust">
        Combat randomness is Supra <b className="text-white">dVRF</b> — verifiable, unriggable. The engine is
        deterministic and open: every match can be replayed from its seed + action log and independently verified.
        Ownership, buybacks and payouts happen on-chain, in public.
      </Section>

      <div className="mt-12 flex flex-wrap gap-3 justify-center text-sm">
        <a href={CRYSTARA_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border border-neon-purple/40 bg-neon-purple/10 hover:bg-neon-purple/25 transition">Mint a ScrollCat</a>
        <a href={ATMOS_URL} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border border-neon-pink/40 bg-neon-pink/10 hover:bg-neon-pink/25 transition">Buy $SCAT</a>
        <Link to="/arena" className="px-4 py-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 hover:bg-neon-cyan/25 transition">Enter the Arena</Link>
        <a href={SOCIAL.twitter} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition">@Scroll_Cat</a>
      </div>
      <p className="mt-10 text-center text-[11px] text-gray-600 max-w-lg mx-auto">
        Not financial advice. $SCAT is a community token; participate responsibly. Competitive stakes, if introduced,
        will be skill-based and subject to applicable rules in your jurisdiction.
      </p>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-60px' }}
      className="mb-10">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-mono text-neon-purple/70">{n}</span>
        <h2 className="font-display font-bold text-xl text-white">{title}</h2>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </motion.section>
  )
}

const ASSET_COLOR: Record<string, string> = {
  'neon-purple': 'text-neon-purple', 'neon-pink': 'text-neon-pink',
  'neon-cyan': 'text-neon-cyan', 'neon-gold': 'text-neon-gold',
}

function Asset({ t, c, d }: { t: string; c: string; d: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <div className={`font-display font-bold text-sm ${ASSET_COLOR[c] ?? 'text-white'} mb-1`}>{t}</div>
      <div className="text-xs text-gray-400 leading-relaxed">{d}</div>
    </div>
  )
}

function Phase({ t, items, done, live }: { t: string; items: string[]; done?: boolean; live?: boolean }) {
  return (
    <div className="mb-4">
      <div className={`font-display font-bold text-sm mb-1.5 flex items-center gap-2 ${done || live ? 'text-neon-cyan' : 'text-white'}`}>
        {done && '✓ '}{t}
        {live && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-neon-cyan/60 text-neon-cyan">live</span>}
      </div>
      <ul className="space-y-1 text-sm text-gray-400">
        {items.map((i, k) => <li key={k} className="flex gap-2"><span className="text-neon-purple/60">›</span>{i}</li>)}
      </ul>
    </div>
  )
}
