import { useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'

type PaymentChallenge = {
  price: string
  address: string
  assetId: string
}

type PaymentState = {
  status: 'idle' | 'pending' | 'confirmed' | 'failed'
  txnId: string | null
  error: string | null
}

export default function usePayment() {
  const { activeAddress, signTransactions } = useWallet()
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    txnId: null,
    error: null,
  })

  const payForVideo = async (videoId: string, paymentChallenge: PaymentChallenge) => {
    if (!activeAddress) throw new Error('Wallet not connected')

    setPaymentState({ status: 'pending', txnId: null, error: null })
    try {
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443)
      const suggestedParams = await algodClient.getTransactionParams().do()
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: paymentChallenge.address,
        amount: Number(paymentChallenge.price),
        assetIndex: Number(paymentChallenge.assetId),
        suggestedParams,
        note: new TextEncoder().encode(JSON.stringify({ videoId, protocol: 'x402' })),
      })

      const signedTxns = await signTransactions([txn])
      const signedBytes = signedTxns[0]
      if (!signedBytes) throw new Error('wallet_signature_missing')
      const signedPaymentB64 = btoa(String.fromCharCode(...signedBytes))
      setPaymentState({ status: 'confirmed', txnId: null, error: null })
      return signedPaymentB64
    } catch (e: any) {
      setPaymentState({ status: 'failed', txnId: null, error: e?.message ?? 'Payment failed' })
      throw e
    }
  }

  const resetPayment = () => setPaymentState({ status: 'idle', txnId: null, error: null })

  return { paymentState, payForVideo, resetPayment }
}
