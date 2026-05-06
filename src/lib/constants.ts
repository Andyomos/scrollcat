export const SCAT_CONTRACT  = '0x66f07d8d66b7e31a41bb93782f5ff3331f172d46fcf8f0df204de911ec7e6109'
export const ATMOS_URL      = 'https://app.atmos.ag/en/token-studio/' + SCAT_CONTRACT
export const CRYSTARA_URL   = 'https://crystara.trade/marketplace/scrollcat'
export const SWAP_FEE        = 0.0005   // 0.05% — lowest in market
export const FEE_WALLET      = '0xF6F25919dcca48eeEced8dcE1048fCa32AF3b7A0'
export const SUPRA_WALLET    = '0xf4a915b5e29bb5e8bcad30ebf78495e6a6c3acd2bcaff2ce36b861a5b50f9988'

export const SOCIAL = {
  twitter:  'https://x.com/cat_scroll',
  telegram: 'https://t.me/cat_scroll',
  discord:  'https://discord.gg/6NKeEzUt5',
}

export const EMAIL = {
  contact: 'contact@scrollcat.org',
  nft:     'nft@scrollcat.org',
  info:    'info@scrollcat.org',
  support: 'support@scrollcat.org',
}

export const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const
export type Rarity = typeof RARITY_ORDER[number]
