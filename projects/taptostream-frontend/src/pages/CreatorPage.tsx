import { useWallet } from '@txnlab/use-wallet-react'
import UploadForm from '../components/creator/UploadForm'

export default function CreatorPage({ onUploadComplete }: { onUploadComplete: () => void }) {
  const { activeAddress } = useWallet()

  if (!activeAddress) {
    return (
      <div className="py-20 text-center text-[#6B6B6B]">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-[#2A2A2A]" />
        Connect your Pera Wallet to upload content
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-lg font-medium text-[#F0F0F0]">Upload Content</h2>
      <UploadForm onUploadComplete={onUploadComplete} />
    </div>
  )
}
