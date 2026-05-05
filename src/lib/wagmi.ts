import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, bsc, polygon, arbitrum, base, optimism, avalanche } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet, arbitrum, base, optimism, polygon, bsc, avalanche,
]

export const wagmiAdapter = new WagmiAdapter({ networks, projectId })

export const appKitMetadata = {
  name: 'ScrollCat',
  description: 'Multi-chain swap aggregator for the $SCAT degen community',
  url: 'https://scrollcat.org',
  icons: ['https://scrollcat.org/imgs/Neon%20Surfing%20Through%20Digital%20Cosmos.png'],
}
