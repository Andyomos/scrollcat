import type { Rarity } from './constants'

export interface NFT {
  id:     number
  name:   string
  image:  string
  rarity: Rarity
  traits: {
    Background: string
    Body:       string
    Eyes:       string
    Prop:       string
    Accessory:  string
    Effect:     string
    Pose:       string
    Aura:       string
  }
}

export const NFTS: NFT[] = [
  {
    id: 1, name: 'Doomscroller', rarity: 'Common',
    image: '/imgs/doomscroller.png',
    traits: { Background: 'Digital Cosmos', Body: 'Purple/Pink', Eyes: 'Infinity ∞', Prop: 'Smartphone', Accessory: 'None', Effect: 'Speed Lines', Pose: 'Surfing', Aura: 'Faint Glow' },
  },
  {
    id: 2, name: 'Grid Watcher', rarity: 'Common',
    image: '/imgs/gridwatcher.png',
    traits: { Background: 'Cyber Grid', Body: 'Purple/Pink', Eyes: 'Infinity ∞', Prop: 'None', Accessory: 'None', Effect: 'Sparkles', Pose: 'Sitting', Aura: 'None' },
  },
  {
    id: 3, name: 'Feed Phantom', rarity: 'Common',
    image: '/imgs/feedphantom.png',
    traits: { Background: 'Blockchain Nodes', Body: 'Purple/Pink', Eyes: 'Infinity ∞', Prop: 'Scroll', Accessory: 'None', Effect: 'Floating Coins', Pose: 'Standing', Aura: 'None' },
  },
  {
    id: 4, name: 'Void Rider', rarity: 'Uncommon',
    image: '/imgs/voidrider.png',
    traits: { Background: 'Void Space', Body: 'Cyan', Eyes: 'Infinity ∞', Prop: 'Hologram', Accessory: 'Neon Crown', Effect: 'Lightning', Pose: 'Surfing', Aura: 'None' },
  },
  {
    id: 5, name: 'Chain Ghost', rarity: 'Uncommon',
    image: '/imgs/chainghost.png',
    traits: { Background: 'Matrix Rain', Body: 'Cyan', Eyes: 'Pixel', Prop: 'None', Accessory: 'Gold Chain', Effect: 'Speed Lines', Pose: 'Running', Aura: 'Neon Glow' },
  },
  {
    id: 6, name: 'Sigma Scroll', rarity: 'Rare',
    image: '/imgs/sigmascroll.png',
    traits: { Background: 'Neon City', Body: 'Gold', Eyes: 'Laser', Prop: 'Scroll', Accessory: 'Diamond Collar', Effect: 'Fire', Pose: 'Standing', Aura: 'Neon Halo' },
  },
  {
    id: 7, name: 'Degen Oracle', rarity: 'Rare',
    image: '/imgs/dgenoracle.png',
    traits: { Background: 'Blockchain Nodes', Body: 'Gold', Eyes: 'Moon', Prop: 'Crystal Ball', Accessory: 'None', Effect: 'None', Pose: 'Meditating', Aura: 'Cosmic Halo' },
  },
  {
    id: 8, name: 'Flame Keeper', rarity: 'Epic',
    image: '/imgs/flamekeeper.png',
    traits: { Background: 'Void Space', Body: 'Red/Orange', Eyes: 'Diamond', Prop: 'Smartphone', Accessory: 'Cape', Effect: 'Fire + Lightning', Pose: 'Surfing', Aura: 'Burning Halo' },
  },
  {
    id: 9, name: 'Shadow Glitch', rarity: 'Epic',
    image: '/imgs/shadowglitch.png',
    traits: { Background: 'Neon City Rain', Body: 'Red/Orange', Eyes: 'Hidden Shades', Prop: 'Hologram', Accessory: 'Hoodie', Effect: 'Glitch', Pose: 'Running', Aura: 'Dark Energy' },
  },
  {
    id: 10, name: 'Genesis One', rarity: 'Legendary',
    image: '/imgs/genesisone.png',
    traits: { Background: 'All-Color Nodes', Body: 'Silver', Eyes: 'Infinity Gold', Prop: 'Scroll + Phone', Accessory: 'Crown', Effect: 'Rainbow', Pose: 'Standing', Aura: 'Rainbow' },
  },
  {
    id: 11, name: 'Cosmic Sovereign', rarity: 'Legendary',
    image: '/imgs/cosmicsovereign.png',
    traits: { Background: 'Nebula', Body: 'Silver', Eyes: 'Laser Gold', Prop: 'Crystal Ball', Accessory: 'Cape + Collar', Effect: 'Fire + Cosmic', Pose: 'Levitating', Aura: 'Combined' },
  },
  {
    id: 12, name: 'The Infinite Scroller', rarity: 'Mythic',
    image: '/imgs/infinitescroller.png',
    traits: { Background: 'The Universe', Body: 'Rainbow Shift', Eyes: 'Infinity White', Prop: 'All Three', Accessory: 'All Four', Effect: 'All Effects', Pose: 'God-Pose', Aura: 'Full Rainbow' },
  },
]

export const rarityColor: Record<Rarity, string> = {
  Common:    'text-gray-400',
  Uncommon:  'text-green-400',
  Rare:      'text-blue-400',
  Epic:      'text-neon-purple',
  Legendary: 'text-neon-gold',
  Mythic:    'text-neon-pink',
}

export const rarityGlow: Record<Rarity, string> = {
  Common:    '',
  Uncommon:  'hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]',
  Rare:      'hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  Epic:      'hover:shadow-neon-purple',
  Legendary: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]',
  Mythic:    'hover:shadow-neon-pink',
}
