import { useEffect, useState } from 'react'
import axios from 'axios'

const usdcAssetId = Number(import.meta.env.VITE_USDC_ASSET_ID || 10458941)

export default function useWalletBalance(walletAddress?: string | null) {
  const [balance, setBalance] = useState<string>('0.00')

  useEffect(() => {
    if (!walletAddress) return
    let mounted = true

    const fetchBalance = async () => {
      try {
        const response = await axios.get(`https://testnet-idx.algonode.cloud/v2/accounts/${walletAddress}`)
        const account = response.data.account
        const usdc = account.assets?.find((a: any) => a['asset-id'] === usdcAssetId)
        const rawBalance = usdc?.amount || 0
        if (mounted) setBalance((rawBalance / 1_000_000).toFixed(2))
      } catch {
        if (mounted) setBalance('0.00')
      }
    }

    void fetchBalance()
    const interval = setInterval(fetchBalance, 15000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [walletAddress])

  return balance
}
