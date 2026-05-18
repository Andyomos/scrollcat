import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, RefreshCw, Clock, Star, AlertCircle, CheckCircle } from 'lucide-react'
import { useStarKey } from '@/hooks/useStarKey'
import { clsx } from 'clsx'

const CLAIM_FEE_SUPRA = 10
const API_URL = '/api/leaderboard'
const COMPETITION_END = '2026-06-10T00:00:00.000Z'

interface Entry {
  rank: number
  wallet: string
  shortWallet: string
  volumeUSD: number
  reward: string
  rewardType: 'nft' | 'scat' | 'discord'
  claimable: boolean
}

interface Board {
  updatedAt: string
  competitionStart: string
  competitionEnd: string
  claimFeeSupra: number
  treasuryWallet: string
  entries: Entry[]
  error?: string
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Competition ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endDate])

  return timeLeft
}

const TIER_COLORS: Record<string, string> = {
  nft:     'from-yellow-500/20 to-yellow-600/5 border-yellow-500/40',
  scat:    'from-neon-purple/20 to-neon-purple/5 border-neon-purple/40',
  discord: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/40',
}

const RANK_BADGE: Record<number, string> = {
  1: '🥇', 2: '🥈', 3: '🥉',
}

export default function Leaderboard() {
  const [board, setBoard]     = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [claimState, setClaimState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [claimMsg, setClaimMsg]     = useState('')
  const { address, connect, installed } = useStarKey()

  const timeLeft = useCountdown(board?.competitionEnd ?? COMPETITION_END)

  const fetchBoard = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(API_URL)
      const data = await res.json()
      setBoard(data)
    } catch {
      setBoard(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
    const id = setInterval(fetchBoard, 60_000)
    return () => clearInterval(id)
  }, [fetchBoard])

  const userEntry = board?.entries.find(e => e.wallet.toLowerCase() === address?.toLowerCase())
  const isWinner  = userEntry?.rank === 1

  async function handleClaim() {
    if (!address) { connect(); return }
    if (!isWinner) return

    setClaimState('pending')
    setClaimMsg('Step 1/2 — Sending claim fee…')

    try {
      const provider = (window as any).starkey?.supra
      if (!provider) throw new Error('StarKey wallet not found')

      const treasuryWallet = board!.treasuryWallet
      const feeInMist      = BigInt(CLAIM_FEE_SUPRA) * BigInt(1_000_000_000)

      // Step 1: Send 10 SUPRA claim fee to treasury
      const paymentTxHash = await provider.sendTransaction({
        from:  address,
        to:    treasuryWallet,
        value: feeInMist.toString(),
      })

      setClaimMsg('Step 2/2 — Transferring your NFT…')

      // Step 2: Call claim API — verifies payment and auto-transfers NFT
      const res  = await fetch('/api/claim', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ winnerWallet: address, paymentTxHash }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Claim failed')

      setClaimState('success')
      setClaimMsg(
        `🎉 Feed Phantom NFT sent to your wallet! NFT Tx: ${String(data.nftTxHash).slice(0, 14)}…  Save this for your records.`
      )
    } catch (e: any) {
      setClaimState('error')
      setClaimMsg(e?.message ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-20">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-neon-cyan font-semibold mb-3">Swap Competition</p>
        <h1 className="font-display font-black text-5xl neon-text mb-3">Swap Leaderboard</h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          Swap on <a href="/swap" className="text-neon-cyan hover:underline">scrollcat.org/swap</a> to climb the ranks.
          Top swappers win NFTs, SCAT tokens, and exclusive Discord roles.
        </p>
      </motion.div>

      {/* Countdown + refresh */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-neon-cyan" />
          <span className="text-gray-400">Time remaining:</span>
          <span className="text-white font-semibold font-mono">{timeLeft}</span>
        </div>
        <div className="flex items-center gap-4">
          {board?.updatedAt && (
            <span className="text-xs text-gray-500">
              Updated {new Date(board.updatedAt).toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchBoard} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={12} className={clsx(loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Reward tiers legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: '🥇', label: '#1',     reward: 'ScrollCat NFT',            color: 'border-yellow-500/40 bg-yellow-500/10'  },
          { icon: '🥈', label: '#2–#3',  reward: 'SCAT Token Reward',        color: 'border-neon-purple/40 bg-neon-purple/10' },
          { icon: '🥉', label: '#4–#10', reward: 'Swap Champion Role',       color: 'border-indigo-500/40 bg-indigo-500/10'  },
        ].map(t => (
          <div key={t.label} className={clsx('rounded-xl border px-4 py-3 flex items-center gap-3', t.color)}>
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">{t.label}</p>
              <p className="text-gray-400 text-xs">{t.reward}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Winner claim banner (only shown if connected wallet is #1) */}
      <AnimatePresence>
        {isWinner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-8 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-5 py-4">
            <div className="flex items-start gap-3">
              <Star size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-300 font-bold text-sm mb-1">You're #1 — Claim Your NFT</p>
                <p className="text-gray-400 text-xs mb-3">
                  Pay a {CLAIM_FEE_SUPRA} SUPRA claim fee and your <strong className="text-white">Feed Phantom NFT</strong> will be sent to your wallet automatically.
                  The fee goes directly to the ScrollCat treasury.
                </p>

                {claimState === 'success' && (
                  <div className="flex items-start gap-2 text-green-400 text-xs mb-3">
                    <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{claimMsg}</span>
                  </div>
                )}
                {claimState === 'error' && (
                  <div className="flex items-start gap-2 text-red-400 text-xs mb-3">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{claimMsg}</span>
                  </div>
                )}

                <button onClick={handleClaim} disabled={claimState === 'pending' || claimState === 'success'}
                  className={clsx(
                    'px-5 py-2 rounded-lg text-sm font-bold transition-all',
                    claimState === 'success'
                      ? 'bg-green-600/40 text-green-300 cursor-default'
                      : 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95'
                  )}>
                  {claimState === 'pending' ? 'Processing…' : claimState === 'success' ? 'Claimed ✓' : `Claim Feed Phantom — Pay ${CLAIM_FEE_SUPRA} SUPRA`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect wallet prompt */}
      {!address && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 glass rounded-xl px-5 py-3 flex items-center gap-3">
          <Zap size={14} className="text-neon-cyan flex-shrink-0" />
          <p className="text-xs text-gray-400">
            {installed
              ? <><button onClick={connect} className="text-neon-cyan hover:underline">Connect StarKey</button> to see if your wallet appears on the leaderboard.</>
              : <>Install <a href="https://starkey.app" target="_blank" rel="noreferrer" className="text-neon-cyan hover:underline">StarKey wallet</a> to track your ranking.</>
            }
          </p>
        </motion.div>
      )}

      {/* Leaderboard table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-neon-purple" />
        </div>
      ) : board?.error ? (
        <div className="glass rounded-xl px-6 py-10 text-center text-gray-500 text-sm">{board.error}</div>
      ) : !board?.entries.length ? (
        <div className="glass rounded-xl px-6 py-16 text-center">
          <Trophy size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">No swaps recorded yet.</p>
          <p className="text-gray-600 text-xs mt-1">Be the first — <a href="/swap" className="text-neon-cyan hover:underline">start swapping</a>.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="space-y-2">
          {board.entries.map((entry, i) => {
            const isMe = entry.wallet.toLowerCase() === address?.toLowerCase()
            return (
              <motion.div key={entry.wallet}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={clsx(
                  'rounded-xl border bg-gradient-to-r px-5 py-4 flex items-center gap-4 transition-all',
                  TIER_COLORS[entry.rewardType],
                  isMe && 'ring-1 ring-neon-cyan/50'
                )}>

                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {RANK_BADGE[entry.rank]
                    ? <span className="text-xl">{RANK_BADGE[entry.rank]}</span>
                    : <span className="text-gray-500 font-bold text-sm">#{entry.rank}</span>
                  }
                </div>

                {/* Wallet */}
                <div className="flex-1 min-w-0">
                  <p className={clsx('font-mono text-sm font-semibold truncate', isMe ? 'text-neon-cyan' : 'text-white')}>
                    {entry.shortWallet}{isMe && ' (you)'}
                  </p>
                  <p className="text-gray-500 text-xs">{entry.reward}</p>
                </div>

                {/* Volume */}
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm">${entry.volumeUSD.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">volume</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-10 text-center">
        <a href="/swap"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-purple text-white font-bold text-sm hover:bg-neon-purple/80 transition-all active:scale-95">
          <Zap size={14} />
          Start Swapping
        </a>
        <p className="text-gray-600 text-xs mt-3">Only {(0.0005 * 100).toFixed(2)}% fee. Best routes across 30+ DEXes.</p>
      </motion.div>

    </main>
  )
}
