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
    <div className="rounded-app border border-white/10 bg-bg-card shadow-card overflow-hidden">
      <div className="aspect-video bg-black/40">
        <img className="h-full w-full object-cover" src={thumbnailUrl} alt={video.title} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-text-primary font-semibold truncate">{video.title}</div>
            <div className="mt-1 text-text-secondary font-mono text-sm">{creatorShort}</div>
          </div>
          <div className="text-right">
            <div className="text-accent-green font-mono text-xl leading-none">{(video.priceUSDC / 1_000_000).toFixed(2)}</div>
            <div className="text-text-secondary text-xs mt-1">USDC</div>
          </div>
        </div>

        <button
          className="mt-4 w-full rounded-app border border-white/10 bg-bg-surface hover:border-white/20 hover:bg-white/5 transition px-4 py-2 text-text-primary font-semibold"
          onClick={() => onWatch(videoId)}
        >
          Watch
        </button>
      </div>
    </div>
  )
}

