import { useState, useEffect, useCallback } from 'react'

interface StarKeyProvider {
  connect: () => Promise<string[]>
  account: () => Promise<string | null>
  disconnect: () => Promise<void>
  on: (event: string, cb: (data: unknown) => void) => void
  off: (event: string, cb: (data: unknown) => void) => void
}

declare global {
  interface Window {
    starkey?: { supra?: StarKeyProvider }
  }
}

export function useStarKey() {
  const [address,   setAddress]   = useState<string | null>(null)
  const [installed, setInstalled] = useState(false)
  const [loading,   setLoading]   = useState(false)

  const provider = (): StarKeyProvider | undefined => window.starkey?.supra

  useEffect(() => {
    let cancelled = false
    let bound: StarKeyProvider | undefined
    const onChanged = (acc: unknown) => setAddress((acc as string) || null)
    const onDisconn = () => setAddress(null)

    const bind = (p: StarKeyProvider) => {
      if (cancelled) return
      bound = p
      setInstalled(true)
      // Restore session (wallet may already be connected)
      p.account().then(acc => { if (!cancelled && acc) setAddress(acc) }).catch(() => {})
      p.on('accountChanged', onChanged)
      p.on('disconnect',     onDisconn)
    }

    // StarKey (esp. in Brave) can inject window.starkey AFTER React mounts.
    // Poll briefly so the hook doesn't get stuck thinking it's not installed.
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

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return { address, shortAddress, installed, loading, connect, disconnect }
}
