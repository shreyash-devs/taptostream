import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import useVideos, { type Video } from '../hooks/useVideos'
import VideoGrid from '../components/viewer/VideoGrid'
import WatchModal from '../components/viewer/WatchModal'

export default function ViewerPage() {
  const { activeAddress } = useWallet()
  const { videos, loading, error, refetch } = useVideos()
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  if (!activeAddress) {
    return (
      <div className="py-20 text-center text-[#6B6B6B]">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-[#2A2A2A]" />
        Connect your Pera Wallet to start watching
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-xl bg-[#141414]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-6 text-[#EF4444]">{error}</div>
        <button onClick={refetch} className="mt-4 rounded-lg border border-[#2A2A2A] px-4 py-2">
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <VideoGrid videos={videos} onWatch={setSelectedVideo} />
      {selectedVideo ? (
        <WatchModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onPaymentComplete={() => {
            void refetch()
          }}
        />
      ) : null}
    </>
  )
}
