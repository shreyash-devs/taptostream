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

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-bg-primary/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="font-semibold tracking-tight text-text-primary">Tap-to-Stream</div>
          <button
            className="rounded-app border border-white/10 px-4 py-2 text-sm font-semibold hover:border-white/20 hover:bg-white/5 transition"
            onClick={() => setOpenWalletModal(true)}
          >
            {activeAddress ? 'Wallet connected' : 'Connect wallet'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!activeAddress && (
          <div className="mb-6 rounded-app border border-white/10 bg-bg-surface p-4 text-text-secondary">
            Connect your Pera Wallet to start watching
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(videos).map(([videoId, video]) => (
            <VideoCard key={videoId} videoId={videoId} video={video} onWatch={() => setSelectedVideoId(videoId)} />
          ))}
        </div>
      </div>

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
