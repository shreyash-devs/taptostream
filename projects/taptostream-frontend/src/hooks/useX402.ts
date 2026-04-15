import algosdk from 'algosdk'
import { useCallback, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}

function shortenAddress(addr: string) {
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function uint8ToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function useX402() {
  const { activeAddress, algodClient, signTransactions } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBaseUrl = useMemo(() => {
    return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'
  }, [])

  const usdcAssetId = useMemo(() => {
    const v = import.meta.env.VITE_USDC_ASA_ID as string | undefined
    return v ? Number(v) : null
  }, [])

  const requestWatch = useCallback(
    async (videoId: string) => {
      if (!activeAddress) throw new PaymentError('wallet_not_connected')
      if (!usdcAssetId) throw new PaymentError('usdc_asset_id_not_configured')

      setIsLoading(true)
      setError(null)

      try {
        // 1) trigger 402
        const first = await fetch(`${apiBaseUrl}/api/watch/${encodeURIComponent(videoId)}`, {
          method: 'GET',
        })

        if (first.status !== 402) {
          if (first.ok) return await first.json()
          throw new PaymentError(`unexpected_status_${first.status}`)
        }

        const requiredHeader = first.headers.get('X-PAYMENT-REQUIRED')
        if (!requiredHeader) throw new PaymentError('missing_payment_required_header')
        const required = JSON.parse(requiredHeader) as {
          price: string
          currency: string
          network: string
          address: string
          videoId: string
          assetId?: string
        }

        const platformWallet = required.address
        const amount = Number(required.price)
        const requiredAssetId = required.assetId ? Number(required.assetId) : null
        const paymentAssetId = requiredAssetId ?? usdcAssetId
        if (!platformWallet || !amount) throw new PaymentError('invalid_payment_required')
        if (!paymentAssetId) throw new PaymentError('usdc_asset_id_not_configured')

        // 2) build USDC ASA transfer to platform wallet
        const suggestedParams = await algodClient.getTransactionParams().do()
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: activeAddress,
          receiver: platformWallet,
          assetIndex: paymentAssetId,
          amount,
          suggestedParams,
        })

        // 3) sign in wallet, encode base64 for X-PAYMENT
        const signed = await signTransactions([txn])
        const signedBytes = signed[0]
        if (!signedBytes) throw new PaymentError('wallet_refused_signature')
        const paymentB64 = uint8ToBase64(signedBytes)

        // 4) retry with X-PAYMENT header
        const second = await fetch(`${apiBaseUrl}/api/watch/${encodeURIComponent(videoId)}`, {
          method: 'GET',
          headers: { 'X-PAYMENT': paymentB64 },
        })

        if (second.status === 402) {
          const body = await second.json().catch(() => ({}))
          throw new PaymentError(body?.error ?? 'payment_not_verified')
        }

        if (!second.ok) throw new PaymentError(`unexpected_status_${second.status}`)
        return (await second.json()) as { streamUrl: string; title: string }
      } catch (e: any) {
        const msg = e?.message ?? 'payment_failed'
        setError(msg)
        throw e instanceof PaymentError ? e : new PaymentError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [activeAddress, algodClient, apiBaseUrl, signTransactions, usdcAssetId]
  )

  return { requestWatch, isLoading, error, shortenAddress }
}

