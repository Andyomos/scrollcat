import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import type { NFT } from '@/lib/nfts'
import { rarityGlow } from '@/lib/nfts'
import { RarityBadge, TraitBadge } from './TraitBadge'
import { CRYSTARA_URL } from '@/lib/constants'

interface Props { nft: NFT; index?: number }

export default function NFTCard({ nft, index = 0 }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={clsx(
        'glass glass-hover rounded-2xl overflow-hidden cursor-pointer select-none group transition-all duration-300',
        rarityGlow[nft.rarity]
      )}
      onClick={() => setFlipped(f => !f)}>

      {/* Front */}
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative overflow-hidden">
              <img src={nft.image} alt={nft.name}
                className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <RarityBadge rarity={nft.rarity} />
              </div>
              <div className="absolute top-3 right-3 glass rounded-lg px-2 py-1">
                <span className="font-mono text-xs text-gray-400">#{String(nft.id).padStart(3,'0')}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold text-white text-sm mb-1">{nft.name}</h3>
              <p className="text-xs text-gray-500">Click to reveal traits</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-sm">{nft.name}</h3>
                <RarityBadge rarity={nft.rarity} className="mt-1" />
              </div>
              <span className="font-mono text-xs text-gray-500">#{String(nft.id).padStart(3,'0')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(nft.traits).map(([k, v]) => (
                <TraitBadge key={k} label={k} value={v} />
              ))}
            </div>
            <a
              href={CRYSTARA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-neon-purple/20 border border-neon-purple/40 text-neon-purple text-xs font-semibold hover:bg-neon-purple/30 hover:border-neon-purple/70 transition-all duration-200">
              Mint on Crystara →
            </a>
            <p className="text-[10px] text-gray-600 text-center mt-2">Click card to flip back</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
