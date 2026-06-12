import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

// Lazy — pulls in wagmi/@reown/appkit + wallet SDKs; only needed on /swap, so
// keep all of web3 out of the main bundle (was the homepage LCP bottleneck).
const WalletProvider = lazy(() => import('@/components/WalletProvider'))
const Home        = lazy(() => import('@/pages/Home'))
const NFTs        = lazy(() => import('@/pages/NFTs'))
const Swap        = lazy(() => import('@/pages/Swap'))
const About       = lazy(() => import('@/pages/About'))
const Verify      = lazy(() => import('@/pages/Verify'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-dark-950 text-white">
        <Header />
        <div className="flex-1">
          <Suspense fallback={<div className="flex-1" />}>
            <Routes>
              <Route path="/"            element={<Home  />} />
              <Route path="/nfts"        element={<NFTs  />} />
              <Route path="/about"       element={<About />} />
              <Route path="/verify"      element={<Verify />} />
              <Route path="/swap/*"      element={<WalletProvider><Swap /></WalletProvider>} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
