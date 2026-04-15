import fs from 'node:fs'
import path from 'node:path'
import jwt from 'jsonwebtoken'

const videosPath = path.join(process.cwd(), 'server', 'videos.json')
const FALLBACK_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

function loadVideos() {
  return JSON.parse(fs.readFileSync(videosPath, 'utf-8'))
}

export function getVideoData(videoId) {
  const videos = loadVideos()
  return videos[videoId] ?? null
}

export function getAllVideos() {
  return loadVideos()
}

export async function getSignedStreamUrl(videoId) {
  const video = getVideoData(videoId)
  if (!video) {
    const err = new Error('video_not_found')
    err.code = 'video_not_found'
    throw err
  }

  const { cfUid, title, creatorAddress, priceUSDC } = video

  // Dev fallback: allow watch flow to complete without Cloudflare setup yet.
  if (!cfUid || cfUid === 'YOUR_CF_STREAM_UID_HERE') {
    return { streamUrl: FALLBACK_HLS_URL, title, creatorAddress, priceUSDC }
  }

  const accountId = process.env.CF_ACCOUNT_ID
  const keyId = process.env.CF_STREAM_KEY_ID
  const privateKey = process.env.CF_STREAM_PRIVATE_KEY

  if (!accountId || !keyId || !privateKey) {
    // Allow Phase 1 dev without Cloudflare signing configured.
    // If the Stream is public, this will play; if not, the client will show a player error.
    const streamUrl = `https://videodelivery.net/${cfUid}/manifest/video.m3u8`
    return { streamUrl, title, creatorAddress, priceUSDC }
  }

  // Cloudflare Stream signed URL: JWT in `token` query param, RS256, `kid` header.
  const token = jwt.sign(
    {
      sub: cfUid,
      exp: Math.floor(Date.now() / 1000) + 60 * 60
    },
    privateKey.replace(/\\n/g, '\n'),
    {
      algorithm: 'RS256',
      header: { kid: keyId }
    }
  )

  const streamUrl = `https://videodelivery.net/${cfUid}/manifest/video.m3u8?token=${token}`
  return { streamUrl, title, creatorAddress, priceUSDC }
}

