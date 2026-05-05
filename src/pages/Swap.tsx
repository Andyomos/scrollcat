import { LiFiWidget, WidgetConfig } from '@lifi/widget'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { SWAP_FEE } from '@/lib/constants'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

const widgetConfig: WidgetConfig = {
  integrator: 'ScrollCat',
  fee: SWAP_FEE,
  appearance: 'dark',
  feeConfig: {
    name: 'ScrollCat',
    fee: SWAP_FEE,
    showFeePercentage: true,
    showFeeTooltip: true,
  },
  walletConfig: {
    forceInternalWalletManagement: true,
    walletConnect: {
      projectId: import.meta.env.VITE_WC_PROJECT_ID ?? '',
    },
  },
  theme: {
    container: {
      borderRadius: '24px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      boxShadow: '0 0 40px rgba(139, 92, 246, 0.08)',
    },
  },
}

export default function Swap() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-neon-cyan font-semibold mb-3">Multi-Chain Swap</p>
        <h1 className="font-display font-black text-5xl neon-text mb-3">Swap Any Token</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Best route across 30+ DEXes and 7 chains. Only {(SWAP_FEE * 100).toFixed(2)}% fee.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="max-w-lg mx-auto mb-6 glass rounded-xl px-4 py-3 flex items-center gap-3">
        <Zap size={14} className="text-neon-cyan flex-shrink-0" />
        <p className="text-xs text-gray-400">
          ScrollCat charges <span className="text-neon-cyan font-semibold">{(SWAP_FEE * 100).toFixed(2)}%</span> — the lowest aggregator fee on the market.
          Route-finding powered by <span className="text-white font-medium">LI.FI</span>.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="max-w-lg mx-auto mb-6 flex justify-center">
        <appkit-button />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex justify-center" style={{ minHeight: 560 }}>
        <LiFiWidget {...widgetConfig} />
      </motion.div>
    </main>
  )
}
