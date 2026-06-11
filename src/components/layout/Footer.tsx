import { Link } from 'react-router-dom'
import { Twitter, Send, ExternalLink, Mail } from 'lucide-react'
import { SOCIAL, ATMOS_URL, SWAP_FEE, EMAIL } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-dark-950/80 backdrop-blur-xl mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/imgs/Neon Surfing Through Digital Cosmos.webp"
                   alt="ScrollCat" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-display font-bold neon-text">ScrollCat</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              The Meme Protector of the Feed.<br />
              Born on Supra. Built for degens.
            </p>
            <div className="flex gap-3 mt-4">
              <a href={SOCIAL.twitter} target="_blank" rel="noreferrer"
                className="p-2 rounded-lg border border-white/10 text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Twitter size={16} />
              </a>
              <a href={SOCIAL.telegram} target="_blank" rel="noreferrer"
                className="p-2 rounded-lg border border-white/10 text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <Send size={16} />
              </a>
              <a href={SOCIAL.discord} target="_blank" rel="noreferrer"
                className="p-2 rounded-lg border border-white/10 text-gray-500 hover:text-neon-purple hover:border-neon-purple/30 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 005.993 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.076-.146.041-.32-.041-.107a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'NFT Collection', to: '/nfts' },
                { label: 'Swap Tokens',    to: '/swap' },
                { label: 'About $SCAT',    to: '/about' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Token */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Token</h4>
            <div className="space-y-2.5 text-sm text-gray-500">
              <p>Ticker: <span className="text-neon-purple font-mono">$SCAT</span></p>
              <p>Chain: <span className="text-gray-300">Supra</span></p>
              <p>Swap fee: <span className="text-neon-cyan">{(SWAP_FEE * 100).toFixed(2)}%</span></p>
              <a href={ATMOS_URL} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-neon-purple hover:text-white transition-colors mt-1">
                View on Atmos <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Contact</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'General',  href: `mailto:${EMAIL.contact}`, addr: EMAIL.contact },
                { label: 'NFTs',     href: `mailto:${EMAIL.nft}`,     addr: EMAIL.nft     },
                { label: 'Support',  href: `mailto:${EMAIL.support}`,  addr: EMAIL.support  },
              ].map(e => (
                <li key={e.addr}>
                  <a href={e.href}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-neon-cyan transition-colors group">
                    <Mail size={12} className="flex-shrink-0 group-hover:text-neon-cyan" />
                    <span>{e.addr}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} ScrollCat. Powered by Supra & Atmos.</span>
          <span>Swap routing powered by LI.FI</span>
        </div>
      </div>
    </footer>
  )
}
