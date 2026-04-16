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

  return (
    <div className="group rounded-xl border border-white/10 bg-bg-card/60 backdrop-blur shadow-card overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:border-accent-green/60">
      <div className="relative aspect-video overflow-hidden bg-black/30">
        <img
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={thumbnailUrl}
          alt={video.title}
        />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute right-3 top-3 rounded-full bg-accent-green px-3 py-1 font-mono text-xs text-black">
          {'$' + (video.priceUSDC / 1_000_000).toFixed(2) + ' USDC'}
        </div>
      </div>

      <div className="p-4">
        <div className="min-w-0">
          <div className="truncate text-text-primary font-semibold">{video.title}</div>
          <div className="mt-1 font-mono text-xs text-text-secondary">by {creatorShort}</div>
        </div>

        <button
          className="mt-4 w-full rounded-lg bg-accent-green px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gradient-to-r hover:from-accent-green hover:to-cyan-300"
          onClick={() => onWatch(videoId)}
        >
          Watch Now
        </button>
      </div>
    </div>
  )
}

