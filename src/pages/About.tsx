import { motion } from 'framer-motion'
import { Twitter, Send, ExternalLink, Mail } from 'lucide-react'
import { SOCIAL, ATMOS_URL, SCAT_CONTRACT, SUPRA_WALLET, EMAIL } from '@/lib/constants'

const ROADMAP = [
  { phase: '01', title: 'Genesis',    status: 'done',    items: ['$SCAT token launched on Atmos', 'Website v1 live', 'Community building'] },
  { phase: '02', title: 'Collection', status: 'active',  items: ['12-piece NFT collection', 'Trait reveal system', 'Website v2 (current)'] },
  { phase: '03', title: 'Swap',       status: 'upcoming',items: ['Multi-chain swap aggregator', 'LI.FI integration', '0.05% fee live'] },
  { phase: '04', title: 'Expand',     status: 'upcoming',items: ['Supra bridge support', 'Larger NFT collection', 'Community governance'] },
]

const statusStyle = {
  done:     'border-green-500/40 text-green-400',
  active:   'border-neon-purple/50 text-neon-purple',
  upcoming: 'border-white/10 text-gray-500',
}

export default function About() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-36 pb-20">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <img src="/imgs/Neon Surfing Through Digital Cosmos.png" alt="ScrollCat"
          className="w-32 h-32 object-contain mx-auto mb-6 rounded-2xl drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
        <h1 className="font-display font-black text-5xl neon-text mb-4">About ScrollCat</h1>
        <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
          ScrollCat isn't just another meme. He's the guardian of the doomscroll, the protector of degens,
          and the cat with 9 lives for every market dip. Born in the chaos of endless feeds — powered by Supra.
        </p>
      </motion.div>

      {/* Token info */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl text-white mb-4">Token Details</h2>
          <dl className="space-y-3">
            {[
              { label: 'Name',     value: 'ScrollCat' },
              { label: 'Ticker',   value: '$SCAT' },
              { label: 'Chain',    value: 'Supra (HyperNova)' },
              { label: 'Protocol', value: 'Atmos Token Studio' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                <dt className="text-xs text-gray-500 uppercase tracking-wider">{r.label}</dt>
                <dd className="text-sm text-gray-200 font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Contract</p>
            <p className="font-mono text-[10px] text-gray-400 break-all">{SCAT_CONTRACT}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Owner Wallet (Supra)</p>
            <p className="font-mono text-[10px] text-gray-400 break-all">{SUPRA_WALLET}</p>
          </div>
          <a href={ATMOS_URL} target="_blank" rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2 mt-4 text-sm w-full justify-center">
            View on Atmos <ExternalLink size={14} />
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl text-white mb-4">Community</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            ScrollCat is more than a meme — it's a movement. Join the ScrollKeeper community and be part of the story.
          </p>
          <div className="space-y-3">
            <a href={SOCIAL.twitter} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3 group">
              <Twitter size={18} className="text-sky-400" />
              <div>
                <p className="text-sm font-medium text-white">Twitter / X</p>
                <p className="text-xs text-gray-500">@cat_scroll</p>
              </div>
              <ExternalLink size={12} className="text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </a>
            <a href={SOCIAL.telegram} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3 group">
              <Send size={18} className="text-sky-400" />
              <div>
                <p className="text-sm font-medium text-white">Telegram</p>
                <p className="text-xs text-gray-500">@cat_scroll</p>
              </div>
              <ExternalLink size={12} className="text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </a>
            <a href={SOCIAL.discord} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3 group">
              <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="text-neon-purple flex-shrink-0"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 005.993 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.076-.146.041-.32-.041-.107a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
              <div>
                <p className="text-sm font-medium text-white">Discord</p>
                <p className="text-xs text-gray-500">ScrollCat Community</p>
              </div>
              <ExternalLink size={12} className="text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </a>
            <a href={`mailto:${EMAIL.contact}`}
              className="flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3 group">
              <Mail size={18} className="text-neon-cyan" />
              <div>
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-xs text-gray-500">{EMAIL.contact}</p>
              </div>
              <ExternalLink size={12} className="text-gray-600 ml-auto group-hover:text-white transition-colors" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Roadmap */}
      <div>
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="font-display font-bold text-3xl text-center text-white mb-8">
          Roadmap
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP.map((phase, i) => (
            <motion.div key={phase.phase}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xs font-bold text-gray-600">PHASE {phase.phase}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle[phase.status as keyof typeof statusStyle]}`}>
                  {phase.status}
                </span>
              </div>
              <h3 className="font-display font-bold text-white mb-3">{phase.title}</h3>
              <ul className="space-y-1.5">
                {phase.items.map(item => (
                  <li key={item} className="text-xs text-gray-500 flex items-start gap-2">
                    <span className="text-neon-purple mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
