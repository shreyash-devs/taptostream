import { useState } from 'react'
import WalletButton from './components/WalletButton'
import TabNav from './components/TabNav'
import ViewerPage from './pages/ViewerPage'
import CreatorPage from './pages/CreatorPage'

export default function App() {
  const [activeTab, setActiveTab] = useState<'viewer' | 'creator'>('viewer')

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0]">
      <header className="h-14 border-b border-[#2A2A2A] bg-[#0A0A0A]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="font-mono text-[#00D4AA]">Tap-to-Stream</div>
          <WalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl">
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'viewer' ? (
          <ViewerPage />
        ) : (
          <CreatorPage onUploadComplete={() => setActiveTab('viewer')} />
        )}
      </main>
    </div>
  )
}
