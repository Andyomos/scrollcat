import { clsx } from 'clsx'
import type { Rarity } from '@/lib/constants'
import { rarityColor } from '@/lib/nfts'

interface Props {
  rarity: Rarity
  className?: string
}

export function RarityBadge({ rarity, className }: Props) {
  const colors: Record<Rarity, string> = {
    Common:    'border-gray-500/40   bg-gray-500/10   text-gray-400',
    Uncommon:  'border-green-500/40  bg-green-500/10  text-green-400',
    Rare:      'border-blue-400/40   bg-blue-400/10   text-blue-400',
    Epic:      'border-purple-500/40 bg-purple-500/10 text-purple-400',
    Legendary: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400',
    Mythic:    'border-pink-500/50   bg-pink-500/10   text-pink-400',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', colors[rarity], className)}>
      {rarity}
    </span>
  )
}

interface TraitProps { label: string; value: string }

export function TraitBadge({ label, value }: TraitProps) {
  return (
    <div className="glass rounded-lg px-3 py-2 text-center">
      <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-gray-200 truncate">{value}</p>
    </div>
  )
}

export { rarityColor }
