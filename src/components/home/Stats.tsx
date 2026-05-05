import { motion } from 'framer-motion'
import { Zap, Shield, Globe, Coins } from 'lucide-react'
import { SWAP_FEE } from '@/lib/constants'

const FEATURES = [
  {
    icon: Zap,
    title: 'Cheapest Swaps',
    desc:  `Only ${(SWAP_FEE * 100).toFixed(2)}% fee — half the industry standard. More tokens stay in your wallet.`,
    color: 'text-neon-cyan',
    glow:  'group-hover:shadow-neon-cyan',
  },
  {
    icon: Globe,
    title: 'Multi-Chain',
    desc:  'Swap across ETH, BNB, Polygon, Arbitrum, Base, Optimism, Avalanche, and Supra.',
    color: 'text-neon-purple',
    glow:  'group-hover:shadow-neon-purple',
  },
  {
    icon: Shield,
    title: 'Best Route',
    desc:  'Powered by LI.FI — routes through 30+ DEXes and bridges to find you the optimal path.',
    color: 'text-neon-pink',
    glow:  'group-hover:shadow-neon-pink',
  },
  {
    icon: Coins,
    title: 'Supra Native',
    desc:  'Full StarKey wallet support. Trade $SCAT and all Supra tokens natively via Atmos.',
    color: 'text-neon-gold',
    glow:  'hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
]

export default function Stats() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className={`glass glass-hover rounded-2xl p-6 group transition-all duration-300 ${f.glow}`}>
            <f.icon size={22} className={`${f.color} mb-4`} />
            <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
