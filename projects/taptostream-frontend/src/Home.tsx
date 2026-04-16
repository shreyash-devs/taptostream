import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useMemo, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import VideoCard from './components/VideoCard'
import WatchModal from './components/WatchModal'

type Video = {
  cfUid: string
  title: string
  creatorAddress: string
  priceUSDC: number
}

export default function Home() {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [videos, setVideos] = useState<Record<string, Video>>({})
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  const apiBaseUrl = useMemo(() => {
    return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'
  }, [])

  useEffect(() => {
    ;(async () => {
      const r = await fetch(`${apiBaseUrl}/api/videos`)
      const data = await r.json()
      setVideos(data)
    })().catch(() => setVideos({}))
  }, [apiBaseUrl])

  const selectedVideo = selectedVideoId ? videos[selectedVideoId] : null

  const walletShort = useMemo(() => {
    if (!activeAddress) return null
    return `${activeAddress.slice(0, 4)}…${activeAddress.slice(-4)}`
  }, [activeAddress])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg-primary, #0a0a0f)', color: 'var(--color-text-primary, #f0f0f0)' }}
    >
      {/* ── Sticky Frosted Glass Navbar ─────────────────────────────── */}
      <header
        className="sticky top-0 z-40"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(10,10,15,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            maxWidth: '1152px',
            margin: '0 auto',
            padding: '0 1rem',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="gradient-logo"
              style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              ⚡ Tap-to-Stream
            </span>
          </div>

          {/* Wallet Button */}
          <button
            id="connect-wallet-btn"
            className="neon-border"
            onClick={() => setOpenWalletModal(true)}
            style={{
              borderRadius: '9999px',
              border: '1px solid rgba(0,229,160,0.5)',
              padding: '7px 20px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-family-mono, monospace)',
              color: '#00e5a0',
              background: activeAddress ? 'rgba(0,229,160,0.08)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              boxShadow: activeAddress ? '0 0 18px rgba(0,229,160,0.18)' : 'none',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.background = 'rgba(0,229,160,0.14)'
              t.style.boxShadow = '0 0 22px rgba(0,229,160,0.25)'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.background = activeAddress ? 'rgba(0,229,160,0.08)' : 'transparent'
              t.style.boxShadow = activeAddress ? '0 0 18px rgba(0,229,160,0.18)' : 'none'
            }}
          >
            {activeAddress ? `🟢 ${walletShort}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* No-wallet prompt */}
        {!activeAddress && (
          <div
            style={{
              marginBottom: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(26,26,36,0.45)',
              backdropFilter: 'blur(8px)',
              padding: '14px 20px',
              color: '#888899',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>🔐</span>
            <span>Connect your Pera Wallet to start watching streams.</span>
          </div>
        )}

        {/* ── Hero / Status Section ───────────────────────────────────── */}
        <section
          style={{
            marginBottom: '2.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(0,229,160,0.09) 0%, rgba(34,211,238,0.04) 50%, rgba(10,10,15,0.0) 100%)',
            backdropFilter: 'blur(8px)',
            padding: '2rem 2rem 2.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow blob behind */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,229,160,0.13) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span
              className="pulse-dot"
              style={{
                display: 'inline-block',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#00e5a0',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-family-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#888899',
              }}
            >
              Live Blockchain Status
            </span>
          </div>

          {/* Tagline */}
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#f0f0f0',
              margin: 0,
            }}
          >
            Pay per view.{' '}
            <span
              className="gradient-logo"
              style={{ display: 'inline-block' }}
            >
              On-chain.
            </span>{' '}
            Instant.
          </h1>

          <p
            style={{
              marginTop: '0.75rem',
              color: '#888899',
              fontSize: '0.95rem',
              maxWidth: '480px',
              lineHeight: 1.6,
            }}
          >
            Micropayments for every second of video — creator-friendly, instant Algorand payouts.
          </p>
        </section>

        {/* ── Streams Grid ───────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              marginBottom: '1rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-family-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#888899',
            }}
          >
            Available Streams
          </h2>

          {Object.keys(videos).length === 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Skeleton placeholders */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(17,17,24,0.7)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16/9',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <div
                      style={{
                        height: '16px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        marginBottom: '10px',
                        animation: 'shimmer 2s linear infinite',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    <div
                      style={{
                        height: '12px',
                        width: '60%',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        animation: 'shimmer 2s linear infinite',
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {Object.entries(videos).map(([videoId, video]) => (
                <VideoCard
                  key={videoId}
                  videoId={videoId}
                  video={video}
                  onWatch={() => setSelectedVideoId(videoId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />

      <WatchModal
        isOpen={selectedVideoId !== null}
        videoId={selectedVideoId}
        title={selectedVideo?.title}
        onClose={() => setSelectedVideoId(null)}
      />
    </div>
  )
}
