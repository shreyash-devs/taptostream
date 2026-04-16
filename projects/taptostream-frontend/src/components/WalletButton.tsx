import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import useWalletBalance from '../hooks/useWalletBalance'
import Toast from './Toast'

export default function WalletButton() {
  const { wallets, activeAddress } = useWallet()
  const [showMenu, setShowMenu] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const balance = useWalletBalance(activeAddress)

  useEffect(() => {
    if (activeAddress) localStorage.setItem('walletAddress', activeAddress)
    else localStorage.removeItem('walletAddress')
  }, [activeAddress])

  const activeWallet = useMemo(() => wallets?.find((wallet) => wallet.isActive), [wallets])

  const handleConnect = async () => {
    try {
      const wallet = wallets?.find((w) => w.metadata.name.toLowerCase().includes('pera')) || wallets?.[0]
      await wallet?.connect()
    } catch (e: any) {
      const msg = String(e?.message ?? '')
      if (msg.toLowerCase().includes('session currently disconnected')) {
        setToast('Wallet disconnected. Please open Pera Wallet app and try again.')
      } else {
        setToast('Failed to connect wallet. Please try again.')
      }
    }
  }

  const handleDisconnect = async () => {
    await activeWallet?.disconnect()
    setShowMenu(false)
  }

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timeout)
  }, [toast])

  if (!activeAddress) {
    return (
      <>
        {toast ? <Toast message={toast} type="error" /> : null}
        <div className="flex items-center gap-2">
          <button
            onClick={handleConnect}
            className="rounded-lg border border-[#00D4AA] px-4 py-2 font-mono text-sm text-[#00D4AA] hover:bg-[#00D4AA] hover:text-black"
          >
            Connect Wallet
          </button>
          {toast ? (
            <button onClick={handleConnect} className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-xs text-[#F0F0F0]">
              Retry
            </button>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      {toast ? <Toast message={toast} type="error" /> : null}
      <div className="relative">
        <button onClick={() => setShowMenu((v) => !v)} className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-left">
          <div className="flex items-center gap-2 font-mono text-sm text-[#00D4AA]">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
          </div>
          <div className="font-mono text-xs text-[#6B6B6B]">{balance} USDC</div>
        </button>
        {showMenu ? (
          <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[#2A2A2A] bg-[#141414] p-1">
            <button onClick={handleDisconnect} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#2A2A2A]">
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
