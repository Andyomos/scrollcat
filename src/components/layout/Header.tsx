import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useStarKey } from '@/hooks/useStarKey'
import { clsx } from 'clsx'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

const NAV = [
  { label: 'Home',        to: '/'            },
  { label: 'NFTs',        to: '/nfts'        },
  { label: 'Swap',        to: '/swap'        },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'About',       to: '/about'       },
]

export default function Header() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const { address: suprAddr, shortAddress, loading, connect, disconnect, installed } = useStarKey()

  return (
    <header className="fixed top-8 left-0 right-0 z-50 border-b border-white/[0.06] backdrop-blur-2xl bg-dark-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/imgs/Neon Surfing Through Digital Cosmos.webp"
               alt="ScrollCat" className="w-9 h-9 rounded-lg object-cover group-hover:shadow-neon-purple transition-shadow duration-300" />
          <span className="font-display font-bold text-lg neon-text tracking-wide">ScrollCat</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === n.to
                  ? 'text-white bg-neon-purple/20 border border-neon-purple/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              )}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Wallet buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* StarKey (Supra) */}
          <button
            onClick={suprAddr ? disconnect : connect}
            disabled={loading}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300',
              suprAddr
                ? 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20'
                : 'border-white/10 text-gray-400 hover:border-neon-cyan/40 hover:text-neon-cyan'
            )}>
            {loading ? '...' : suprAddr ? `⚡ ${shortAddress}` : installed ? '⚡ StarKey' : '⚡ Get StarKey'}
          </button>

          {/* EVM via AppKit */}
          <appkit-button />
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-dark-950/95 backdrop-blur-2xl">
            <div className="px-4 py-4 flex flex-col gap-2">
              {NAV.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                  className={clsx('px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    pathname === n.to ? 'text-white bg-neon-purple/20' : 'text-gray-400')}>
                  {n.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                <button onClick={suprAddr ? disconnect : connect}
                  className="btn-ghost text-left text-xs">
                  {suprAddr ? `⚡ ${shortAddress} (disconnect)` : '⚡ Connect StarKey'}
                </button>
                <appkit-button />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
