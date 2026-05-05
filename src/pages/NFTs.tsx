import { useState } from 'react'
import { motion } from 'framer-motion'
import { NFTS } from '@/lib/nfts'
import { RARITY_ORDER, CRYSTARA_URL, type Rarity } from '@/lib/constants'
import NFTCard from '@/components/nfts/NFTCard'
import { clsx } from 'clsx'

export default function NFTs() {
  const [filter, setFilter] = useState<Rarity | 'All'>('All')

  const visible = filter === 'All' ? NFTS : NFTS.filter(n => n.rarity === filter)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <p className="text-xs uppercase tracking-widest text-neon-purple font-semibold mb-3">Collection</p>
        <h1 className="font-display font-black text-5xl neon-text mb-3">ScrollCat NFTs</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Click any card to reveal its traits. 12 unique cats — one Mythic ever minted.
        </p>
      </motion.div>

      {/* Rarity filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {(['All', ...RARITY_ORDER] as const).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
              filter === r
                ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
            )}>
            {r}
          </button>
        ))}
      </div>

      {/* Crystara CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 px-6 py-4 rounded-2xl border border-neon-purple/30 bg-neon-purple/5">
        <div>
          <p className="text-white font-semibold text-sm">Ready to own a ScrollCat?</p>
          <p className="text-gray-500 text-xs mt-0.5">50 SUPRA per mint · 500 supply · Live on Crystara</p>
        </div>
        <a
          href={CRYSTARA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-2 rounded-xl bg-neon-purple text-white text-sm font-bold hover:bg-neon-purple/80 transition-all duration-200 shadow-neon-purple">
          Mint on Crystara →
        </a>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visible.map((nft, i) => (
          <NFTCard key={nft.id} nft={nft} index={i} />
        ))}
      </div>
    </main>
  )
}
