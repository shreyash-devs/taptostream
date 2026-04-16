import { useCallback, useEffect, useState } from 'react'
import client from '../api/client'

export type Video = {
  id: string
  title: string
  creator: string
  price: number
  thumbnailUrl: string
  streamUrl: string
  duration: number
}

export default function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await client.get('/api/videos')
      const entries = Object.entries(response.data ?? {}) as Array<[string, any]>
      const mapped = entries.map(([id, item]) => ({
        id,
        title: item.title ?? id,
        creator: item.creatorAddress ?? 'Unknown creator',
        price: Number(item.priceUSDC ?? 0),
        thumbnailUrl: item.cfUid
          ? `https://videodelivery.net/${item.cfUid}/thumbnails/thumbnail.jpg`
          : '',
        streamUrl: item.cfUid ? `https://videodelivery.net/${item.cfUid}/manifest/video.m3u8` : '',
        duration: 0,
      }))
      setVideos(mapped)
    } catch (e: any) {
      const msg = e?.message?.includes('Network')
        ? 'Cannot connect to server. Is the backend running?'
        : e?.message ?? 'Failed to fetch videos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchVideos()
  }, [fetchVideos])

  return { videos, loading, error, refetch: fetchVideos }
}
