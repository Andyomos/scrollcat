import { useState, useEffect, useCallback, createContext, useContext, createElement, type ReactNode } from 'react'

interface StarKeyProviderApi {
  connect: () => Promise<string[]>
  account: () => Promise<string | null>
  disconnect: () => Promise<void>
  on: (event: string, cb: (data: unknown) => void) => void
  off: (event: string, cb: (data: unknown) => void) => void
  createRawTransactionData?: (payload: unknown[]) => Promise<unknown>
  sendTransaction?: (params: { data: unknown }) => Promise<unknown>
}

// BCS arg encoders (Supra createRawTransactionData expects raw bytes per arg).
const u64le = (n: bigint) => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, n, true); return b }
const addr32 = (h: string) => {
  const clean = h.replace(/^0x/, '').padStart(64, '0')
  const b = new Uint8Array(32)
  for (let i = 0; i < 32; i++) b[i] = parseInt(clean.substr(i * 2, 2), 16)
  return b
}

declare global {
  interface Window {
    starkey?: { supra?: StarKeyProviderApi }
  }
}

function useStarKeyState() {
  const [address,   setAddress]   = useState<string | null>(null)
  const [installed, setInstalled] = useState(false)
  const [loading,   setLoading]   = useState(false)

  const provider = (): StarKeyProviderApi | undefined => window.starkey?.supra

  useEffect(() => {
    let cancelled = false
    let bound: StarKeyProviderApi | undefined
    const onChanged = (acc: unknown) => setAddress((acc as string) || null)
    const onDisconn = () => setAddress(null)

    const bind = (p: StarKeyProviderApi) => {
      if (cancelled) return
      bound = p
      setInstalled(true)
      // Restore session (wallet may already be connected) — keep retrying briefly
      // because account() can return null right after the provider injects.
      let tries = 0
      const restore = () => {
        p.account().then(acc => {
          if (cancelled) return
          if (acc) setAddress(acc)
          else if (++tries < 10) setTimeout(restore, 400)
        }).catch(() => {})
      }
      restore()
      p.on('accountChanged', onChanged)
      p.on('disconnect',     onDisconn)
    }

    // StarKey (esp. in Brave) can inject window.starkey AFTER React mounts.
    const ready = provider()
    if (ready) { bind(ready) }
    else {
      let tries = 0
      const id = setInterval(() => {
        const p = provider()
        if (p)            { clearInterval(id); bind(p) }
        else if (++tries > 30) clearInterval(id)   // give up after ~9s
      }, 300)
      return () => { cancelled = true; clearInterval(id); bound?.off('accountChanged', onChanged); bound?.off('disconnect', onDisconn) }
    }

    return () => {
      cancelled = true
      bound?.off('accountChanged', onChanged)
      bound?.off('disconnect',     onDisconn)
    }
  }, [])

  const connect = useCallback(async () => {
    const p = provider()
    if (!p) { window.open('https://starkey.app', '_blank'); return }
    setLoading(true)
    try {
      const accounts = await p.connect()
      if (accounts[0]) setAddress(accounts[0])
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    await provider()?.disconnect()
    setAddress(null)
  }, [])

  /** Transfer SUPRA via StarKey. Tries the Supra Move flow (createRawTransactionData),
   *  then StarKey's simple {from,to,value} flow. Returns the tx hash. */
  const paySupra = useCallback(async (to: string, amountSupra: number): Promise<string> => {
    const p = provider()
    if (!p) throw new Error('StarKey not found — install/unlock the wallet')
    const acc = address ?? (await p.account())
    if (!acc) throw new Error('Wallet not connected')
    if (typeof p.sendTransaction !== 'function') throw new Error('This StarKey version lacks sendTransaction — update the extension')

    const log = (...a: unknown[]) => { try { console.log('[pay]', ...a) } catch { /* */ } }
    const T = <X>(pr: Promise<X>, ms: number, label: string): Promise<X> =>
      Promise.race([pr, new Promise<X>((_, rej) => setTimeout(() => rej(new Error(label)), ms))])
    const hashOf = (r: unknown): string =>
      typeof r === 'string' ? r : ((r as { hash?: string; txHash?: string; result?: string })?.hash
        ?? (r as { txHash?: string })?.txHash ?? (r as { result?: string })?.result ?? JSON.stringify(r))

    const mist = Math.round(amountSupra * 1e8)

    // Path A — Supra Move flow (docs.supra.com tutorial)
    if (typeof p.createRawTransactionData === 'function') {
      try {
        const payload: unknown[] = [
          acc, 0, '0000000000000000000000000000000000000000000000000000000000000001',
          'supra_account', 'transfer', [],
          [addr32(to), u64le(BigInt(mist))],
          { txExpiryTime: Math.ceil(Date.now() / 1000) + 60 },
        ]
        log('A: createRawTransactionData', payload)
        const data = await T(p.createRawTransactionData(payload), 15000, 'createRawTransactionData timed out')
        log('A: data', data)
        const res = await T(p.sendTransaction({ data }), 90000, 'StarKey popup never appeared (Move flow)')
        log('A: result', res)
        return hashOf(res)
      } catch (eA) {
        log('A failed → trying simple flow', eA)
      }
    }

    // Path B — StarKey simple flow (docs.starkey.app)
    log('B: sendTransaction {from,to,value}', { from: acc, to, value: String(mist) })
    const res = await T((p.sendTransaction as (t: unknown) => Promise<unknown>)({ data: '', from: acc, to, value: String(mist) }),
      90000, 'StarKey popup never appeared (simple flow)')
    log('B: result', res)
    return hashOf(res)
  }, [address])

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return { address, shortAddress, installed, loading, connect, disconnect, paySupra }
}

type StarKeyValue = ReturnType<typeof useStarKeyState>
const StarKeyCtx = createContext<StarKeyValue | null>(null)

/** Single wallet connection shared app-wide — survives client-side navigation
 *  (mounted once at the app root, never remounts on route change). */
export function StarKeyProvider({ children }: { children: ReactNode }) {
  const value = useStarKeyState()
  return createElement(StarKeyCtx.Provider, { value }, children)
}

export function useStarKey(): StarKeyValue {
  const ctx = useContext(StarKeyCtx)
  if (!ctx) throw new Error('useStarKey must be used within <StarKeyProvider>')
  return ctx
}
