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
              <img src="/imgs/Neon Surfing Through Digital Cosmos.png"
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
