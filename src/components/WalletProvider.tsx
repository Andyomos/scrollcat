import { useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, networks, projectId, appKitMetadata } from '@/lib/wagmi'

const queryClient = new QueryClient()
let appKitInitialised = false

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (appKitInitialised) return
    import('@reown/appkit/react').then(({ createAppKit }) => {
      createAppKit({ adapters: [wagmiAdapter], networks, projectId, metadata: appKitMetadata })
      appKitInitialised = true
    })
  }, [])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
