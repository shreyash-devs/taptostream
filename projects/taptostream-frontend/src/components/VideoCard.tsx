import { useMemo } from 'react'

type Video = {
  cfUid: string
  title: string
  creatorAddress: string
  priceUSDC: number
}

export default function VideoCard({
  videoId,
  video,
  onWatch,
}: {
  videoId: string
  video: Video
  onWatch: (videoId: string) => void
}) {
  const thumbnailUrl = useMemo(() => {
    return `https://videodelivery.net/${video.cfUid}/thumbnails/thumbnail.jpg`
  }, [video.cfUid])

  const creatorShort = useMemo(() => {
    const a = video.creatorAddress
    if (!a) return ''
    return `${a.slice(0, 6)}...${a.slice(-4)}`
  }, [video.creatorAddress])

  const priceDisplay = useMemo(() => {
    return '$' + (video.priceUSDC / 1_000_000).toFixed(2) + ' USDC'
  }, [video.priceUSDC])

  return (
    <div
      className="card-hover"
      data-video-id={videoId}
      style={{
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(17,17,24,0.8)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
        <img
          src={thumbnailUrl}
          alt={video.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
            display: 'block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
        />

        {/* Dark gradient overlay at bottom */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />

        {/* Price badge — top right */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            borderRadius: '9999px',
            background: '#00e5a0',
            color: '#000',
            fontFamily: 'var(--font-family-mono, monospace)',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            boxShadow: '0 2px 12px rgba(0,229,160,0.45)',
            letterSpacing: '0.03em',
          }}
        >
          {priceDisplay}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '1rem 1.1rem 1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Title */}
        <div
          style={{
            color: '#f0f0f0',
            fontWeight: 600,
            fontSize: '0.95rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={video.title}
        >
          {video.title}
        </div>

        {/* Creator address */}
        <div
          style={{
            fontFamily: 'var(--font-family-mono, monospace)',
            fontSize: '0.72rem',
            color: '#888899',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          by {creatorShort}
        </div>

        {/* Watch Now button */}
        <button
          id={`watch-btn-${videoId}`}
          className="gradient-btn"
          onClick={() => onWatch(videoId)}
          style={{
            marginTop: '14px',
            width: '100%',
            borderRadius: '9px',
            border: 'none',
            padding: '9px 0',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#000',
            cursor: 'pointer',
            background: 'linear-gradient(90deg, #00e5a0, #22d3ee)',
            boxShadow: '0 4px 16px rgba(0,229,160,0.25)',
          }}
        >
          Watch Now →
        </button>
      </div>
    </div>
  )
}
