import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import usePayment from '../../hooks/usePayment'
import useWalletBalance from '../../hooks/useWalletBalance'
import { useWallet } from '@txnlab/use-wallet-react'
import client from '../../api/client'
import type { Video } from '../../hooks/useVideos'
import Toast from '../Toast'

const DEMO_VIDEO_FALLBACK = 'https://www.w3schools.com/html/mov_bbb.mp4'

type Challenge = {
  price: string
  currency: string
  network: string
  address: string
  videoId: string
  assetId: string
}

export default function WatchModal({
  video,
  onClose,
  onPaymentComplete,
}: {
  video: Video
  onClose: () => void
  onPaymentComplete: () => void
}) {
  const { activeAddress } = useWallet()
  const { paymentState, payForVideo, resetPayment } = usePayment()
  const balance = useWalletBalance(activeAddress)
  const [modalState, setModalState] = useState<'locked' | 'pending' | 'unlocked'>('locked')
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [streamUrl, setStreamUrl] = useState<string>('')
  const [txId, setTxId] = useState<string>('')
  const [usingDemoFallback, setUsingDemoFallback] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const requiredUsdc = useMemo(() => video.price / 1_000_000, [video.price])
  const hasEnough = Number(balance) >= requiredUsdc

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (modalState !== 'unlocked' || !videoRef.current || !streamUrl) return
    const player = videoRef.current
    setUsingDemoFallback(false)

    const useFallback = () => {
      if (usingDemoFallback) return
      setUsingDemoFallback(true)
      player.src = DEMO_VIDEO_FALLBACK
      void player.play().catch(() => {})
    }

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      const hls = new Hls()
      hls.loadSource(streamUrl)
      hls.attachMedia(player)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void player.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) useFallback()
      })
      player.onerror = () => useFallback()
      return () => {
        player.onerror = null
        hls.destroy()
      }
    }
    player.src = streamUrl
    player.onloadedmetadata = () => {
      void player.play().catch(() => {})
    }
    player.onerror = () => useFallback()
    return undefined
  }, [modalState, streamUrl, usingDemoFallback])

  const handlePayment = async () => {
    try {
      const first = await client.get(`/api/watch/${video.id}`)
      if (first.status !== 402) throw new Error('unexpected_response')

      const headerValue = first.headers['x-payment-required'] as string | undefined
      if (!headerValue) throw new Error('missing_payment_required_header')
      const challenge = JSON.parse(headerValue) as Challenge
      setModalState('pending')

      const signedPaymentB64 = await payForVideo(video.id, challenge)
      const second = await client.get(`/api/watch/${video.id}`, {
        headers: { 'X-PAYMENT': signedPaymentB64 },
      })

      if (second.status === 402) {
        throw new Error((second.data as any)?.error ?? 'payment_not_verified')
      }
      setTxId(String((second.data as any)?.txid ?? ''))
      setStreamUrl(String(second.data.streamUrl || DEMO_VIDEO_FALLBACK))
      setModalState('unlocked')
      setToast({ msg: 'Payment confirmed', type: 'success' })
      onPaymentComplete()
    } catch (e: any) {
      const message = String(e?.message ?? '')
      if (message.toLowerCase().includes('rejected') || message.toLowerCase().includes('cancel')) {
        setToast({ msg: 'Transaction cancelled', type: 'error' })
      } else {
        setToast({ msg: message || 'Payment failed', type: 'error' })
      }
      setModalState('locked')
      resetPayment()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      {toast ? <Toast message={toast.msg} type={toast.type} /> : null}
      <div className="w-full max-w-2xl rounded-xl border border-[#2A2A2A] bg-[#141414]">
        {modalState !== 'pending' ? (
          <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
            <div className="text-sm font-medium">{video.title}</div>
            <button className="text-[#6B6B6B] hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>
        ) : null}

        {modalState === 'locked' ? (
          <div className="p-6">
            <div className="rounded-xl bg-[#0A0A0A] p-6">
              <div className="text-xs uppercase tracking-wide text-[#6B6B6B]">Price</div>
              <div className="mt-1 font-mono text-2xl text-[#00D4AA]">{requiredUsdc.toFixed(2)} USDC</div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#6B6B6B]">Your balance</span>
                <span className={`font-mono ${hasEnough ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{balance} USDC</span>
              </div>
              <button
                disabled={!hasEnough}
                onClick={handlePayment}
                className={`mt-6 w-full rounded-lg py-3 ${
                  hasEnough ? 'bg-[#00D4AA] font-medium text-black hover:bg-[#00B896]' : 'bg-[#2A2A2A] text-[#6B6B6B]'
                }`}
              >
                {hasEnough ? 'Pay & Watch' : 'Insufficient USDC balance'}
              </button>
            </div>
          </div>
        ) : null}

        {modalState === 'pending' ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex w-16 justify-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4AA]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4AA] [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4AA] [animation-delay:300ms]" />
            </div>
            <div className="mt-4 text-sm text-[#F0F0F0]">Confirming on Algorand</div>
            <div className="mt-1 text-xs text-[#6B6B6B]">Usually takes 4 seconds</div>
            {paymentState.txnId ? (
              <div className="mt-3 font-mono text-xs text-[#6B6B6B]">
                Txn: {paymentState.txnId.slice(0, 8)}...{paymentState.txnId.slice(-4)}
              </div>
            ) : null}
          </div>
        ) : null}

        {modalState === 'unlocked' ? (
          <>
            <div className="border-b border-[#2A2A2A] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-[#F0F0F0]">{video.title}</div>
                  <div className="mt-1 text-xs text-[#6B6B6B]">
                    {usingDemoFallback ? 'Showing built-in demo playback' : 'Unlocked stream'}
                  </div>
                </div>
                <span className="rounded-lg border border-[#2A2A2A] px-2 py-1 font-mono text-xs text-[#00D4AA]">
                  {(requiredUsdc).toFixed(2)} USDC
                </span>
              </div>
            </div>
            <div className="aspect-video bg-black">
              <video ref={videoRef} controls autoPlay playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
            </div>
            <div className="flex items-center gap-3 border-t border-[#1A3A2A] bg-[#0D1F1A] p-4">
              <span className="h-[18px] w-[18px] rounded-full bg-[#22C55E]" />
              <span className="text-xs text-[#22C55E]">Paid</span>
              <span className="text-[#6B6B6B]">•</span>
              {txId ? <span className="font-mono text-xs text-[#6B6B6B]">Txn: {txId.slice(0, 8)}...</span> : null}
              {txId ? (
                <a
                  href={`https://testnet.algoexplorer.io/tx/${txId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#00D4AA]"
                >
                  View on Explorer →
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
