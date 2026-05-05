import React from 'react'
import ReactDOM from 'react-dom/client'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter, networks, projectId, appKitMetadata } from '@/lib/wagmi'
import App from './App'
import './index.css'

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: appKitMetadata,
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
