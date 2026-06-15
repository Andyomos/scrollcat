import { lazy, Suspense, useEffect, Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { StarKeyProvider } from '@/hooks/useStarKey'

// Lazy — pulls in wagmi/@reown/appkit + wallet SDKs; only needed on /swap, so
// keep all of web3 out of the main bundle (was the homepage LCP bottleneck).
const WalletProvider = lazy(() => import('@/components/WalletProvider'))
const Home        = lazy(() => import('@/pages/Home'))
const NFTs        = lazy(() => import('@/pages/NFTs'))
const Swap        = lazy(() => import('@/pages/Swap'))
const About       = lazy(() => import('@/pages/About'))
const Verify      = lazy(() => import('@/pages/Verify'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Arena       = lazy(() => import('@/pages/Arena'))
const Whitepaper  = lazy(() => import('@/pages/Whitepaper'))

// Reset scroll to top on every route change (SPA default keeps the old offset).
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [pathname])
  return null
}

// Catch lazy-chunk load failures (common after a deploy / on Brave) and render
// errors — instead of a blank page. Stale-chunk errors auto-reload to fetch the
// new build; other errors show a recover button.
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) {
    const msg = String((err as Error)?.message || err)
    if (/dynamically imported module|Loading chunk|Failed to fetch|ChunkLoadError|import\(\)/i.test(msg)) {
      // stale/blocked chunk — reload once to pull the current build
      if (!sessionStorage.getItem('chunk-reloaded')) {
        sessionStorage.setItem('chunk-reloaded', '1')
        window.location.reload()
      }
    }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-gray-400">Something hiccuped loading this page.</p>
          <button onClick={() => { sessionStorage.removeItem('chunk-reloaded'); window.location.reload() }}
            className="px-5 py-2.5 rounded-xl border border-neon-purple/40 bg-neon-purple/15 hover:bg-neon-purple/30">
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  // clear the one-shot reload guard once a load succeeds
  useEffect(() => { sessionStorage.removeItem('chunk-reloaded') }, [])
  return (
    <BrowserRouter>
      <ScrollToTop />
      <StarKeyProvider>
        <div className="min-h-screen flex flex-col bg-dark-950 text-white">
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/"            element={<Home  />} />
                  <Route path="/nfts"        element={<NFTs  />} />
                  <Route path="/about"       element={<About />} />
                  <Route path="/verify"      element={<Verify />} />
                  <Route path="/swap/*"      element={<WalletProvider><Swap /></WalletProvider>} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/arena"       element={<Arena />} />
                  <Route path="/whitepaper"  element={<Whitepaper />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </StarKeyProvider>
    </BrowserRouter>
  )
}
