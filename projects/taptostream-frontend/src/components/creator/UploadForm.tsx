import { useRef, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import client from '../../api/client'

export default function UploadForm({ onUploadComplete }: { onUploadComplete: () => void }) {
  const { activeAddress } = useWallet()
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({ title: '', creator: '', price: '1.00' })
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async () => {
    if (!file || !formData.title.trim() || Number(formData.price) <= 0) return
    setUploadState('uploading')
    setProgress(0)
    setError(null)
    try {
      const data = new FormData()
      data.append('video', file)
      data.append('title', formData.title)
      data.append('creator', formData.creator || activeAddress || '')
      data.append('price', Math.round(Number(formData.price) * 1_000_000).toString())

      await client.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const total = evt.total || 1
          setProgress(Math.round((evt.loaded * 100) / total))
        },
      })
      setUploadState('success')
      setProgress(100)
      setTimeout(onUploadComplete, 1500)
    } catch (e: any) {
      setUploadState('error')
      setError(e?.response?.data?.message || 'Upload failed')
    }
  }

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-6">
      <div
        className="cursor-pointer rounded-xl border-2 border-dashed border-[#2A2A2A] p-8 text-center transition-colors hover:border-[#00D4AA]"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {!file ? (
          <>
            <div className="mx-auto mb-2 h-8 w-8 rounded-full border border-[#2A2A2A]" />
            <div className="text-sm text-[#6B6B6B]">Drag & drop your video here</div>
            <div className="text-xs text-[#6B6B6B]">or click to browse</div>
          </>
        ) : (
          <>
            <div className="font-mono text-sm text-[#F0F0F0]">{file.name}</div>
            <div className="text-xs text-[#6B6B6B]">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
          </>
        )}
      </div>

      <input
        value={formData.title}
        onChange={(e) => setFormData((s) => ({ ...s, title: e.target.value }))}
        placeholder="Video title"
        className="mt-4 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#6B6B6B] focus:border-[#00D4AA] focus:outline-none"
      />
      <input
        value={formData.creator}
        onChange={(e) => setFormData((s) => ({ ...s, creator: e.target.value }))}
        placeholder="Your name or channel"
        className="mt-3 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#6B6B6B] focus:border-[#00D4AA] focus:outline-none"
      />
      <div className="mt-3 flex items-center rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]">
        <span className="px-3 text-xs text-[#6B6B6B]">USDC</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData((s) => ({ ...s, price: e.target.value }))}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-[#F0F0F0] placeholder:text-[#6B6B6B] focus:outline-none"
        />
      </div>

      <button
        disabled={!file || !formData.title || uploadState === 'uploading'}
        onClick={handleUpload}
        className={`mt-6 w-full rounded-lg py-3 ${
          uploadState === 'success'
            ? 'bg-[#22C55E] text-white'
            : uploadState === 'idle'
            ? 'bg-[#00D4AA] font-medium text-black'
            : 'bg-[#2A2A2A] text-[#6B6B6B]'
        }`}
      >
        {uploadState === 'uploading'
          ? `Uploading... ${progress}%`
          : uploadState === 'success'
          ? 'Uploaded Successfully'
          : 'Upload Video'}
      </button>

      {uploadState === 'uploading' ? (
        <div className="mt-2 h-2 rounded-full bg-[#2A2A2A]">
          <div className="h-2 rounded-full bg-[#00D4AA]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {uploadState === 'error' ? <div className="mt-3 text-sm text-[#EF4444]">{error}</div> : null}
    </div>
  )
}
