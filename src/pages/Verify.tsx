import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Wallet, AlertCircle, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react'

type Status = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error'

const STEP_LABELS: Record<Status, string> = {
  idle:       'Connect & Verify Wallet',
  connecting: 'Connecting wallet…',
  signing:    'Sign the message in StarKey…',
  verifying:  'Checking $SCAT balance on-chain…',
  success:    'Verified!',
  error:      'Try again',
}

export default function Verify() {
  const [params]             = useSearchParams()
  const nonce                = params.get('nonce')
  const userId               = params.get('user')
  const [status,  setStatus] = useState<Status>('idle')
  const [message, setMessage]= useState('')

  const invalid = !nonce || !userId

  async function handleVerify() {
    if (invalid || status !== 'idle') return
    setMessage('')

    try {
      // ── 1. Connect StarKey ──────────────────────────────────────────────
      setStatus('connecting')
      const supra = (window as any).starkey?.supra
      if (!supra) {
        setStatus('error')
        setMessage('StarKey wallet not detected. Install it at starkey.app then refresh this page.')
        return
      }

      const accounts = await supra.connect()
      const wallet   = accounts?.[0]
      if (!wallet) {
        setStatus('error')
        setMessage('No account found in StarKey. Make sure your wallet is set up.')
        return
      }

      // ── 2. Sign the nonce (optional — strengthens proof of wallet ownership) ──
      setStatus('signing')
      let signature: string | null = null
      let publicKey: string | null = null
      try {
        const signed = await supra.signMessage({ message: nonce })
        signature = signed?.signature ?? null
        publicKey = signed?.publicKey ?? null
      } catch (signErr: any) {
        if (signErr?.message?.includes('User rejected') || signErr?.message?.includes('cancel')) {
          setStatus('error')
          setMessage('You cancelled the signature request.')
          return
        }
        // Non-fatal: proceed without signature
      }

      if (signature === null && publicKey === null) {
        // StarKey dismissed the popup or Supra account not active — try without signature
        // Backend will skip Ed25519 check and rely on HMAC nonce + balance
      }

      // ── 3. Send to verification endpoint ───────────────────────────────
      setStatus('verifying')
      const res  = await fetch('/api/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wallet, signature, publicKey, nonce, userId }),
      })
      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed. Please try again.')
      }
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message?.includes('User rejected')
        ? 'You cancelled the signature request.'
        : e?.message || 'Unexpected error. Please try again.')
    }
  }

  function reset() { setStatus('idle'); setMessage('') }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-dark-900 border border-neon-purple/30 rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(168,85,247,0.1)]">

          {/* Icon */}
          <div className="text-5xl mb-4 select-none">🐱</div>
          <h1 className="text-2xl font-bold text-white mb-2">Holder Verification</h1>
          <p className="text-gray-400 text-sm mb-8">
            Prove you hold{' '}
            <span className="text-neon-purple font-semibold">$SCAT</span> or a{' '}
            <span className="text-neon-cyan font-semibold">ScrollCat NFT</span>{' '}
            to unlock the 💎{' '}
            <span className="text-yellow-400 font-semibold">SCAT Holder</span> role in Discord.
          </p>

          {/* ── Invalid link ── */}
          {invalid && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Invalid or missing verification link.
                Run <code className="bg-dark-800 px-1.5 py-0.5 rounded text-xs">/verify</code> in your Discord server and use the new link.
              </span>
            </div>
          )}

          {/* ── Success ── */}
          {!invalid && status === 'success' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400">
                <CheckCircle className="w-12 h-12" />
                <p className="font-semibold text-base">{message}</p>
              </div>
              <p className="text-gray-500 text-sm">You can close this tab and return to Discord.</p>
            </div>
          )}

          {/* ── Error ── */}
          {!invalid && status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-left">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
              <button onClick={reset} className="text-neon-purple underline text-sm hover:text-neon-purple/80 transition-colors">
                ← Try again
              </button>
            </div>
          )}

          {/* ── Idle / in-progress ── */}
          {!invalid && (status === 'idle' || status === 'connecting' || status === 'signing' || status === 'verifying') && (
            <div className="space-y-6">

              {/* Steps */}
              <div className="space-y-3 text-left">
                {[
                  { icon: <Wallet      className="w-4 h-4" />, label: 'Connect your StarKey wallet',          active: status === 'connecting' },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Sign the verification message',        active: status === 'signing'    },
                  { icon: <CheckCircle className="w-4 h-4" />, label: 'Balance checked on Supra chain',       active: status === 'verifying'  },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm transition-colors ${s.active ? 'text-neon-purple' : 'text-gray-500'}`}>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    {s.active && <span className="ml-auto animate-pulse text-neon-purple">●</span>}
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <button
                onClick={handleVerify}
                disabled={status !== 'idle'}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-neon-purple hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {status === 'idle'
                  ? <><Wallet className="w-5 h-5" /> Connect &amp; Verify Wallet</>
                  : <><span className="inline-block animate-spin">⏳</span> {STEP_LABELS[status]}</>
                }
              </button>

              {/* StarKey install link */}
              <p className="text-xs text-gray-600">
                Don't have StarKey?{' '}
                <a
                  href="https://starkey.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-purple hover:underline inline-flex items-center gap-1"
                >
                  Install it here <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-sm inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to ScrollCat
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
