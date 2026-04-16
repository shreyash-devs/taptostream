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

  /* ── Stage badge helper ──────────────────────────────────────────── */
  const stageBadge = () => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '9999px',
      padding: '8px 22px',
      fontSize: '0.85rem',
      fontWeight: 600,
      backdropFilter: 'blur(8px)',
    }

    if (stage === 'requesting') {
      return (
        <div
          className="badge-status"
          style={{
            ...base,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(26,26,36,0.7)',
            color: '#888899',
          }}
        >
          <span>🔄</span> Requesting payment…
        </div>
      )
    }
    if (stage === 'sign') {
      return (
        <div
          className="badge-status"
          style={{
            ...base,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(26,26,36,0.7)',
            color: '#f0f0f0',
          }}
        >
          <span>✍️</span> Sign in Pera Wallet…
        </div>
      )
    }
    if (stage === 'verifying') {
      return (
        <div
          className="badge-status"
          style={{
            ...base,
            border: '1px solid rgba(0,229,160,0.35)',
            background: 'rgba(0,229,160,0.08)',
            color: '#00e5a0',
          }}
        >
          <span>⛓️</span> Verifying on Algorand…
        </div>
      )
    }
    if (stage === 'playing') {
      return (
        <div
          style={{
            ...base,
            border: '1px solid rgba(0,229,160,0.3)',
            background: 'rgba(0,229,160,0.08)',
            color: '#00e5a0',
          }}
        >
          <span>▶️</span> Playing stream
        </div>
      )
    }
    if (stage === 'error') {
      return (
        <div
          style={{
            ...base,
            border: '1px solid rgba(239,68,68,0.35)',
            background: 'rgba(239,68,68,0.1)',
            color: '#fca5a5',
          }}
        >
          <span>❌</span> {error ?? 'payment_failed'}
        </div>
      )
    }
    return null
  }

  return (
    /* Full-screen dark overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop click to close */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          cursor: 'pointer',
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(96vw, 1080px)',
          maxHeight: '96vh',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.09)',
          background: '#0d0d14',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,160,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(26,26,36,0.6)',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#f0f0f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: '40px',
            }}
          >
            {heading}
          </div>

          {/* Close × button */}
          <button
            id="watch-modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(0,0,0,0.5)',
              color: '#888899',
              fontSize: '1rem',
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.6)'
              e.currentTarget.style.color = '#f0f0f0'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = '#888899'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#080810',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem 1rem',
            gap: '1.25rem',
          }}
        >
          {/* Video player (shown when playing) */}
          {stage === 'playing' && (
            <div
              style={{
                width: '90%',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                background: '#000',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}
            >
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                preload="metadata"
                style={{ width: '100%', height: 'auto', maxHeight: '70vh', display: 'block', background: '#000' }}
              />
            </div>
          )}

          {/* Status badge */}
          {stageBadge()}

          {/* Try again button on error */}
          {stage === 'error' && (
            <button
              style={{
                marginTop: '4px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(26,26,36,0.8)',
                color: '#f0f0f0',
                padding: '8px 28px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,229,160,0.6)'
                e.currentTarget.style.background = 'rgba(0,229,160,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.background = 'rgba(26,26,36,0.8)'
              }}
              onClick={() => {
                // re-trigger by closing and reopening handled by parent;
                onClose()
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
