import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { requirePayment } from './x402.js'
import { getAllVideos, getSignedStreamUrl, getVideoData } from './stream.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', contract: process.env.CONTRACT_APP_ID ?? null })
})

app.get('/api/videos', (req, res) => {
  res.json(getAllVideos())
})

app.get('/api/watch/:videoId', async (req, res, next) => {
  const video = getVideoData(req.params.videoId)
  if (!video) return res.status(404).json({ error: 'video_not_found' })

  req.creatorAddress = video.creatorAddress
  req.priceUSDC = video.priceUSDC
  return next()
})

app.get(
  '/api/watch/:videoId',
  (req, _res, next) => {
    req.videoId = req.params.videoId
    next()
  },
  (req, res, next) => requirePayment(req.priceUSDC, req.params.videoId)(req, res, next),
  async (req, res) => {
    const { streamUrl, title } = await getSignedStreamUrl(req.params.videoId)
    res.json({ streamUrl, title })
  }
)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`)
})

