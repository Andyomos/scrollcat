import { useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, networks, projectId, appKitMetadata } from '@/lib/wagmi'

const queryClient = new QueryClient()
let appKitInitialised = false

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (appKitInitialised) { setReady(true); return }
    import('@reown/appkit/react').then(({ createAppKit }) => {
      createAppKit({ adapters: [wagmiAdapter], networks, projectId, metadata: appKitMetadata })
      appKitInitialised = true
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
