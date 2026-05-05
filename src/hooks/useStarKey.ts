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
    setInstalled(!!window.starkey?.supra)

    const p = provider()
    if (!p) return

    // Restore session
    p.account().then(acc => { if (acc) setAddress(acc) })

    const onChanged = (acc: unknown) => setAddress(acc as string | null)
    const onDisconn = () => setAddress(null)

    p.on('accountChanged', onChanged)
    p.on('disconnect',     onDisconn)
    return () => {
      p.off('accountChanged', onChanged)
      p.off('disconnect',     onDisconn)
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
