import type { Video } from '../../hooks/useVideos'

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function VideoCard({ video, onWatch }: { video: Video; onWatch: (video: Video) => void }) {
  return (
    <div className="cursor-pointer overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] transition-colors hover:border-[#00D4AA]">
      <div className="relative aspect-video overflow-hidden bg-[#2A2A2A]">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#6B6B6B]">▶</div>
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 font-mono text-xs text-white">
          {formatDuration(video.duration)}
        </div>
      </div>
      <div className="p-4">
        <div className="truncate text-sm font-medium text-[#F0F0F0]">{video.title}</div>
        <div className="mt-1 text-xs text-[#6B6B6B]">by {video.creator}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="font-mono text-sm text-[#00D4AA]">{(video.price / 1_000_000).toFixed(2)} USDC</div>
          <button
            onClick={() => onWatch(video)}
            className="rounded-lg bg-[#00D4AA] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#00B896]"
          >
            Watch
          </button>
        </div>
      </div>
    </div>
  )
}
