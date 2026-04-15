import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import { useX402 } from '../hooks/useX402'

export default function WatchModal({
  isOpen,
  videoId,
  title,
  onClose,
}: {
  isOpen: boolean
  videoId: string | null
  title?: string
  onClose: () => void
}) {
  const { requestWatch } = useX402()
  const requestWatchRef = useRef(requestWatch)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const startedForRef = useRef<string | null>(null)
  const inFlightRef = useRef(false)

  const [stage, setStage] = useState<'idle' | 'requesting' | 'sign' | 'verifying' | 'playing' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const heading = useMemo(() => title ?? 'Tap-to-Stream', [title])

  useEffect(() => {
    requestWatchRef.current = requestWatch
  }, [requestWatch])

  useEffect(() => {
    if (!isOpen || !videoId) return
    if (inFlightRef.current && startedForRef.current === videoId) return

    let cancelled = false
    inFlightRef.current = true
    startedForRef.current = videoId
    setStage('requesting')
    setError(null)
    setStreamUrl(null)

    ;(async () => {
      try {
        // we can't reliably detect "wallet signing" vs "verification" from outside,
        // but we can present both stages in sequence around the signing call.
        setStage('sign')
        const promise = requestWatchRef.current(videoId)
        setStage('verifying')
        const result = await promise
        if (cancelled) return
        setStreamUrl(result.streamUrl)
        setStage('playing')
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message ?? 'payment_failed')
        setStage('error')
      } finally {
        inFlightRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, videoId])

  useEffect(() => {
    if (!isOpen) {
      startedForRef.current = null
      inFlightRef.current = false
      setStage('idle')
      setError(null)
      setStreamUrl(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (stage !== 'playing' || !streamUrl || !videoRef.current) return

    const video = videoRef.current
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      void video.play().catch(() => {})
      return
    }

    if (!Hls.isSupported()) {
      setError('hls_not_supported')
      setStage('error')
      return
    }

    const hls = new Hls()
    hls.loadSource(streamUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void video.play().catch(() => {})
    })
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data?.fatal) {
        setError('video_playback_failed')
        setStage('error')
      }
    })
    return () => hls.destroy()
  }, [stage, streamUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-0 sm:p-2">
        <div className="w-full h-full sm:h-auto sm:max-h-[96vh] sm:max-w-[96vw] rounded-none sm:rounded-app border-0 sm:border border-white/10 bg-black shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bg-surface/85 backdrop-blur">
            <div className="font-semibold text-sm sm:text-base truncate pr-2">{heading}</div>
            <button
              className="rounded-app border border-white/10 px-3 py-1 text-sm text-text-secondary hover:text-text-primary hover:border-white/20 transition shrink-0"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="p-2 sm:p-4 bg-black">
            {stage !== 'playing' && (
              <div className="rounded-app border border-white/10 bg-bg-card p-4">
                {stage === 'requesting' && <div>Requesting payment…</div>}
                {stage === 'sign' && <div>Sign in Pera Wallet…</div>}
                {stage === 'verifying' && <div className="animate-pulseSoft">Verifying on Algorand…</div>}
                {stage === 'error' && (
                  <div>
                    <div className="text-red-300 font-semibold">Error</div>
                    <div className="text-text-secondary mt-1">{error}</div>
                    <button
                      className="mt-4 rounded-app border border-white/10 bg-bg-surface hover:border-white/20 hover:bg-white/5 transition px-4 py-2"
                      onClick={() => {
                        // re-trigger by closing and reopening handled by parent;
                        onClose()
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage === 'playing' && (
              <div className="rounded-app border border-white/10 bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-auto max-h-[88vh] bg-black"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

