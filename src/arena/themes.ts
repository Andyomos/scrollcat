// Den themes — the first cosmetic. Re-skins the Fighters' Den background.
// v1: the two free themes are equippable now; the rest are priced and unlock via
// the SUPRA shop (next build). Stored per-player in localStorage.

export interface DenTheme {
  id:     string
  name:   string
  bg:     number     // base Den colour (PIXI hex)
  accent: number     // radial glow / floor colour
  free:   boolean
  priceSupra?: number
}

export const DEN_THEMES: DenTheme[] = [
  { id: 'fighters-den', name: "Fighters' Den", bg: 0x0e0e2a, accent: 0x6d28d9, free: true },
  { id: 'cyber-city',   name: 'Cyber City',    bg: 0x02101a, accent: 0x06b6d4, free: true },
  { id: 'inferno',      name: 'Inferno',       bg: 0x1a0606, accent: 0xf97316, free: false, priceSupra: 200 },
  { id: 'void',         name: 'Void',          bg: 0x0a0012, accent: 0xa855f7, free: false, priceSupra: 200 },
  { id: 'cosmic',       name: 'Cosmic',        bg: 0x05010f, accent: 0xec4899, free: false, priceSupra: 500 },
]

const KEY = 'scrollcat-arena-theme-v1'

export function getThemeId(): string {
  try { return localStorage.getItem(KEY) || 'fighters-den' } catch { return 'fighters-den' }
}
export function setThemeId(id: string) {
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
}
export function themeById(id: string): DenTheme {
  return DEN_THEMES.find(t => t.id === id) ?? DEN_THEMES[0]
}
