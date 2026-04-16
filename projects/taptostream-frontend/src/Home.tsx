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
      <div className="sticky top-0 z-40 border-b border-white/10 bg-bg-primary/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-accent-green to-cyan-300 bg-clip-text text-transparent font-semibold tracking-tight">
              ⚡ Tap-to-Stream
            </div>
          </div>
          <button
            className="rounded-full border border-accent-green/60 px-4 py-2 text-sm font-mono text-accent-green hover:bg-accent-green/10 hover:border-accent-green transition shadow-[0_0_18px_rgba(0,229,160,0.18)]"
            onClick={() => setOpenWalletModal(true)}
          >
            {activeAddress ? 'Wallet connected' : 'Connect wallet'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!activeAddress && (
          <div className="mb-6 rounded-xl border border-white/10 bg-bg-surface/40 backdrop-blur p-4 text-text-secondary">
            Connect your Pera Wallet to start watching
          </div>
        )}

        <div className="mb-6 rounded-xl border border-white/10 bg-gradient-to-r from-accent-green/10 via-cyan-300/5 to-transparent p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent-green animate-pulseSoft" />
            <div className="text-xs uppercase tracking-wider text-text-secondary">Live blockchain status</div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight text-text-primary">
            Pay per view. <span className="text-accent-green">On-chain.</span> Instant.
          </div>
        </div>

        <h2 className="mb-3 text-xs uppercase tracking-wider text-text-secondary">Available Streams</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
