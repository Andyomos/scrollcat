import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'

export default function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
      <Trophy size={13} className="shrink-0" />
      <span>🏆 Swap Volume Leaderboard is LIVE — Top swapper wins a free NFT!</span>
      <Link
        to="/leaderboard"
        className="ml-2 underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        View Leaderboard →
      </Link>
    </div>
  )
}
