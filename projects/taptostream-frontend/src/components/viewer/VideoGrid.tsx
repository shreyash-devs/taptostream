import type { Video } from '../../hooks/useVideos'
import VideoCard from './VideoCard'

export default function VideoGrid({ videos, onWatch }: { videos: Video[]; onWatch: (video: Video) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onWatch={onWatch} />
      ))}
    </div>
  )
}
