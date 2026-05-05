import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { NFTS } from '@/lib/nfts'
import { RarityBadge } from '@/components/nfts/TraitBadge'

export default function NFTShowcase() {
  const featured = NFTS.slice(0, 6)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} className="text-center mb-12">
        <p className="text-xs uppercase tracking-widest text-neon-purple font-semibold mb-3">The Collection</p>
        <h2 className="font-display font-bold text-4xl text-white">ScrollCat NFTs</h2>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm">
          12 unique ScrollCats. 9 trait categories. 6 rarity tiers. One mythic ever minted.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {featured.map((nft, i) => (
          <motion.div key={nft.id}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="glass glass-hover rounded-2xl overflow-hidden group">
            <div className="relative overflow-hidden">
              <img src={nft.image} alt={nft.name}
                className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2"><RarityBadge rarity={nft.rarity} /></div>
            </div>
            <div className="p-3">
              <p className="font-display text-xs font-bold text-white truncate">{nft.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">#{String(nft.id).padStart(3,'0')}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/nfts" className="btn-primary inline-flex items-center gap-2">
          View Full Collection <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
