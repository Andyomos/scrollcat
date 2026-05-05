import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Home  from '@/pages/Home'
import NFTs  from '@/pages/NFTs'
import Swap  from '@/pages/Swap'
import About from '@/pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-dark-950 text-white">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/"      element={<Home  />} />
            <Route path="/nfts"  element={<NFTs  />} />
            <Route path="/swap/*" element={<Swap  />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
