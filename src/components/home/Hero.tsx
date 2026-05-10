import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/15 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-neon-pink/15 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center py-20">

        {/* Text side */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Zap size={12} className="text-neon-cyan" />
            <span className="text-xs text-gray-400">Built on <span className="text-neon-cyan font-semibold">Supra</span> via Atmos Protocol</span>
          </motion.div>

          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-none mb-6">
            <span className="neon-text">Scroll</span>
            <span className="text-white">Cat</span>
            <br />
            <span className="text-2xl sm:text-3xl font-bold text-gray-400">$SCAT</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
            The Meme Protector of the Feed. Guardian of degens. Nine lives for every market dip.
            Collect NFTs. Swap any token across chains at the <span className="text-neon-cyan font-semibold">lowest fees</span>.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/nfts" className="btn-primary inline-flex items-center gap-2">
              Explore NFTs <ArrowRight size={16} />
            </Link>
            <Link to="/swap" className="btn-ghost inline-flex items-center gap-2">
              Swap Tokens <Zap size={16} />
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              { label: 'NFTs',      value: '12' },
              { label: 'Swap Fee',  value: '0.05%' },
              { label: 'Chains',    value: '7+' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display font-bold text-2xl neon-text">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Image side */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="flex justify-center">
          <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative">
            <div className="absolute inset-0 bg-neon-purple/30 rounded-3xl blur-3xl scale-95" />
            <img src="/imgs/Neon Surfing Through Digital Cosmos.png" alt="ScrollCat Hero"
              fetchPriority="high"
              className="relative w-80 h-80 sm:w-96 sm:h-96 object-contain rounded-3xl drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
