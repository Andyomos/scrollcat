import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export interface Grad {
  completed: boolean; raisedSupra: number; targetSupra: number
  remainingSupra: number; pct: number; fdvSupra: number
}

let cache: Grad | null = null   // module-level memo so the Arena + Whitepaper share one fetch

/** Live "$SCAT → Graduation" progress, read from the Atmos curve via /api/scat/graduation. */
export default function GraduationBar({ compact = false }: { compact?: boolean }) {
  const [g, setG] = useState<Grad | null>(cache)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (cache) return
    fetch('/api/scat/graduation').then(r => r.json())
      .then(d => { if (d?.error) setErr(true); else { cache = d; setG(d) } })
      .catch(() => setErr(true))
  }, [])

  return (
    <div className={`bg-card-gradient border border-white/10 rounded-2xl ${compact ? 'p-3.5 mb-5' : 'p-5 sm:p-6 mb-14'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-display font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
          {g?.completed ? '$SCAT — Graduated 🎓' : '$SCAT → Graduation'}
        </span>
        <span className="text-xs font-mono text-neon-cyan">{g ? `${g.pct}%` : err ? '—' : '…'}</span>
      </div>
      <div className={`${compact ? 'h-2' : 'h-3'} rounded-full bg-black/40 border border-white/10 overflow-hidden`}>
        <motion.div className="h-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan"
          initial={{ width: 0 }} animate={{ width: `${g?.pct ?? 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
      {g ? (
        <div className={`flex flex-wrap gap-x-5 gap-y-1 mt-3 ${compact ? 'text-[10px]' : 'text-[11px]'} font-mono text-gray-400`}>
          <span><b className="text-white">{g.raisedSupra.toLocaleString()}</b> / {g.targetSupra.toLocaleString()} SUPRA</span>
          <span><b className="text-white">{g.remainingSupra.toLocaleString()}</b> to go</span>
          {!compact && <span>FDV ~{g.fdvSupra.toLocaleString()} SUPRA</span>}
          <span className="text-gray-600">live from the curve</span>
        </div>
      ) : (
        <div className={`mt-3 ${compact ? 'text-[10px]' : 'text-[11px]'} font-mono text-gray-600`}>
          {err ? 'curve data unavailable' : 'reading the curve…'}
        </div>
      )}
    </div>
  )
}
