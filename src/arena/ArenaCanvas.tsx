import { useEffect, useRef } from 'react'
import { Application, Sprite, Container, Graphics, Text, Assets, type Texture } from 'pixi.js'
import type { Combatant, RoundEvent } from './types'
import { ELEMENT_COLOR } from './data/fighters'

const W = 880, H = 420

const hex = (s: string) => parseInt(s.replace('#', ''), 16)

interface FighterNode {
  root:   Container
  sprite: Sprite
  baseX:  number
  shake:  number   // remaining shake time
  lunge:  number   // -1..1 lunge progress driver
  tint:   number   // remaining red-tint time
}

interface Particle { g: Graphics; vx: number; vy: number; life: number; max: number }

/**
 * PixiJS visual layer for the Fighters' Den. Renders both fighters as sprites in
 * a power-reactive arena and animates each resolved round (lunge / hit-shake /
 * damage numbers / element bursts / ultimate screen-shake). HP & energy bars stay
 * as a React overlay on top (see Arena.tsx).
 */
export default function ArenaCanvas({
  player, bot, lastEvent, theme,
}: { player: Combatant; bot: Combatant; lastEvent: RoundEvent | null; theme?: { bg: number; accent: number } }) {
  const themeRef = useRef(theme ?? { bg: 0x0e0e2a, accent: 0x6d28d9 })
  useEffect(() => { if (theme) themeRef.current = theme }, [theme])
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef  = useRef<Application | null>(null)
  const stageRef = useRef<Container | null>(null)
  const bgRef   = useRef<Graphics | null>(null)
  const flashRef = useRef<{ color: number; life: number }>({ color: 0, life: 0 })
  const shakeRef = useRef(0)
  const pRef     = useRef<FighterNode | null>(null)
  const bRef     = useRef<FighterNode | null>(null)
  const partsRef = useRef<Particle[]>([])
  const floatsRef = useRef<{ t: Text; life: number }[]>([])
  const lastRound = useRef(-1)

  // ── mount ──
  useEffect(() => {
    let disposed = false
    const app = new Application()
    appRef.current = app

    app.init({ width: W, height: H, backgroundAlpha: 0, antialias: true }).then(async () => {
      if (disposed) { app.destroy(true, { children: true }); return }
      hostRef.current?.appendChild(app.canvas)
      app.canvas.style.width = '100%'
      app.canvas.style.height = 'auto'

      const stage = new Container()
      app.stage.addChild(stage)
      stageRef.current = stage

      const bg = new Graphics()
      stage.addChild(bg)
      bgRef.current = bg

      pRef.current = await makeFighter(player.fighter.image, W * 0.27, false)
      bRef.current = await makeFighter(bot.fighter.image,    W * 0.73, true)
      if (disposed) return
      stage.addChild(pRef.current.root, bRef.current.root)

      app.ticker.add(() => tick(app))
    })

    return () => {
      disposed = true
      appRef.current?.destroy(true, { children: true })
      appRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── swap sprites when the matchup changes (new fight) ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stage = stageRef.current
      if (!stage) return
      const np = await makeFighter(player.fighter.image, W * 0.27, false)
      const nb = await makeFighter(bot.fighter.image,    W * 0.73, true)
      if (cancelled) return
      pRef.current?.root.destroy({ children: true })
      bRef.current?.root.destroy({ children: true })
      pRef.current = np; bRef.current = nb
      stage.addChild(np.root, nb.root)
      lastRound.current = -1
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.fighter.image, bot.fighter.image])

  // ── animate each resolved round ──
  useEffect(() => {
    if (!lastEvent || lastEvent.round === lastRound.current) return
    lastRound.current = lastEvent.round
    const P = pRef.current, B = bRef.current
    if (!P || !B) return

    // attacker lunges, defender shakes + takes a floating damage number
    if (lastEvent.dmgToB > 0) { P.lunge = 1; B.shake = 18; B.tint = 14; float(lastEvent.dmgToB, B.baseX, lastEvent.critB) }
    if (lastEvent.dmgToA > 0) { B.lunge = 1; P.shake = 18; P.tint = 14; float(lastEvent.dmgToA, P.baseX, lastEvent.critA) }

    // element burst + arena flash on special / ultimate
    if (lastEvent.flash) {
      const color = hex(ELEMENT_COLOR[lastEvent.flash])
      flashRef.current = { color, life: 22 }
      const fromA = lastEvent.actionA === 'special' || lastEvent.actionA === 'ultimate'
      burst(fromA ? W * 0.27 : W * 0.73, color, lastEvent.actionA === 'ultimate' || lastEvent.actionB === 'ultimate' ? 40 : 22)
    }
    if (lastEvent.actionA === 'ultimate' || lastEvent.actionB === 'ultimate') shakeRef.current = 22
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent])

  // ── helpers ──
  function float(dmg: number, x: number, crit: boolean) {
    const stage = stageRef.current; if (!stage) return
    const t = new Text({
      text: crit ? `${dmg}!` : `${dmg}`,
      style: { fill: crit ? 0xffd34d : 0xffffff, fontSize: crit ? 38 : 28, fontWeight: '800', fontFamily: 'Orbitron, sans-serif' },
    })
    t.anchor.set(0.5); t.x = x; t.y = H * 0.42
    stage.addChild(t)
    floatsRef.current.push({ t, life: 42 })
  }

  function burst(x: number, color: number, n: number) {
    const stage = stageRef.current; if (!stage) return
    for (let i = 0; i < n; i++) {
      const g = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill({ color })
      g.x = x; g.y = H * 0.5
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6
      stage.addChild(g)
      partsRef.current.push({ g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 30 + Math.random() * 20 })
    }
  }

  function tick(app: Application) {
    const t = app.ticker.lastTime / 1000
    const P = pRef.current, B = bRef.current, bg = bgRef.current, stage = stageRef.current
    if (!stage || !bg) return

    // background — radial den (themed) + element flash
    const fl = flashRef.current
    const th = themeRef.current
    bg.clear()
    bg.rect(0, 0, W, H).fill({ color: th.bg })
    bg.circle(W / 2, H * 0.42, W * 0.55).fill({ color: fl.life > 0 ? fl.color : th.accent, alpha: fl.life > 0 ? 0.28 * (fl.life / 22) + 0.18 : 0.22 })
    // floor glow
    bg.ellipse(P ? P.baseX : W * 0.27, H * 0.78, 90, 22).fill({ color: th.accent, alpha: 0.25 })
    bg.ellipse(B ? B.baseX : W * 0.73, H * 0.78, 90, 22).fill({ color: th.accent, alpha: 0.25 })
    if (fl.life > 0) fl.life--

    // screen shake
    let sx = 0, sy = 0
    if (shakeRef.current > 0) { sx = (Math.random() - 0.5) * shakeRef.current; sy = (Math.random() - 0.5) * shakeRef.current; shakeRef.current--; }
    stage.x = sx; stage.y = sy

    for (const node of [P, B]) {
      if (!node) continue
      const dir = node === P ? 1 : -1
      // idle bob
      node.root.y = H * 0.5 + Math.sin(t * 2 + (node === P ? 0 : Math.PI)) * 6
      // lunge toward centre then ease back
      if (node.lunge > 0) { node.lunge = Math.max(0, node.lunge - 0.08) }
      const lungeX = Math.sin(node.lunge * Math.PI) * 46 * dir
      // shake
      let shx = 0
      if (node.shake > 0) { shx = (Math.random() - 0.5) * node.shake; node.shake--; }
      node.root.x = node.baseX + lungeX + shx
      // hit tint
      if (node.tint > 0) { node.sprite.tint = 0xff6b6b; node.tint--; } else { node.sprite.tint = 0xffffff }
    }

    // particles
    partsRef.current = partsRef.current.filter(p => {
      p.life++; p.g.x += p.vx; p.g.y += p.vy; p.vy += 0.12
      p.g.alpha = 1 - p.life / p.max
      if (p.life >= p.max) { p.g.destroy(); return false }
      return true
    })

    // floating damage numbers
    floatsRef.current = floatsRef.current.filter(f => {
      f.life--; f.t.y -= 1.4; f.t.alpha = Math.min(1, f.life / 20)
      if (f.life <= 0) { f.t.destroy(); return false }
      return true
    })
  }

  return <div ref={hostRef} className="w-full" />
}

async function makeFighter(image: string, x: number, flip: boolean): Promise<FighterNode> {
  let tex: Texture | undefined
  try { tex = await Assets.load(image) } catch { /* fallback below */ }
  const root = new Container()
  const sprite = tex ? new Sprite(tex) : new Sprite()
  sprite.anchor.set(0.5)
  const targetH = H * 0.5
  if (tex) sprite.scale.set(targetH / tex.height)
  void flip   // don't mirror — the NFT card art has baked-in text/branding
  // soft rounded frame behind
  const frame = new Graphics().roundRect(-targetH / 2 - 6, -targetH / 2 - 6, targetH + 12, targetH + 12, 18)
    .stroke({ color: 0xffffff, alpha: 0.12, width: 2 })
  root.addChild(frame, sprite)
  root.x = x; root.y = H * 0.5
  return { root, sprite, baseX: x, shake: 0, lunge: 0, tint: 0 }
}
