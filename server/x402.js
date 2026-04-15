import algosdk from 'algosdk'

const GOPLAUSIBLE_VERIFY_URL = 'https://api.goplausible.xyz/x402/verify'

function paymentRequired(res, { priceUSDC, currency = 'USDC', network = 'algorand', address, videoId, error }) {
  const required = {
    price: String(priceUSDC),
    currency,
    network,
    address,
    videoId,
  }
  console.log('402 Payment Required', required, error ? { error } : {})
  res.status(402)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-PAYMENT-REQUIRED', JSON.stringify(required))
  res.json(error ? { error } : { error: 'payment_required' })
}

function base64ToUint8(b64) {
  return new Uint8Array(Buffer.from(String(b64), 'base64'))
}

async function verifyBySubmittingSignedTxn({ algod, signedTxnB64, expectedReceiver, expectedAssetId, expectedAmount }) {
  const signedBytes = base64ToUint8(signedTxnB64)

  let decoded
  try {
    decoded = algosdk.decodeSignedTransaction(signedBytes)
  } catch {
    return { ok: false, error: 'invalid_signed_txn' }
  }

  const txn = decoded.txn
  const sender = algosdk.encodeAddress(txn.from.publicKey)

  // Verify this is an ASA transfer to platform wallet for the expected USDC amount.
  if (txn.type !== 'axfer') return { ok: false, error: 'invalid_txn_type' }
  if (expectedAssetId != null && Number(txn.assetIndex) !== Number(expectedAssetId)) return { ok: false, error: 'invalid_asset' }
  const receiver = algosdk.encodeAddress(txn.to.publicKey)
  if (receiver !== expectedReceiver) return { ok: false, error: 'invalid_receiver' }
  if (expectedAmount != null && Number(txn.amount) !== Number(expectedAmount)) return { ok: false, error: 'invalid_amount' }

  // Broadcast to network; if it fails, payment is not verified.
  let txid
  try {
    const { txId } = await algod.sendRawTransaction(signedBytes).do()
    txid = txId
    await algosdk.waitForConfirmation(algod, txid, 4)
  } catch {
    return { ok: false, error: 'payment_not_verified' }
  }

  return { ok: true, txid, viewerAddress: sender, amount: Number(txn.amount) }
}

async function callMakePayment({ videoId, viewerAddress, amount, creatorAddress }) {
  const algod = new algosdk.Algodv2(process.env.ALGORAND_NODE_TOKEN ?? '', process.env.ALGORAND_NODE_URL, '')

  const platformMnemonic = process.env.PLATFORM_MNEMONIC
  const appId = Number(process.env.CONTRACT_APP_ID)
  const senderAddress = process.env.PLATFORM_WALLET

  // Phase 1: allow running the payment loop without contract deployment yet.
  if (!platformMnemonic || !appId || !senderAddress) return

  const platformAccount = algosdk.mnemonicToSecretKey(platformMnemonic)
  if (platformAccount.addr !== senderAddress) throw new Error('platform_wallet_mnemonic_mismatch')

  const suggestedParams = await algod.getTransactionParams().do()

  const method = new algosdk.ABIMethod({
    name: 'make_payment',
    args: [
      { type: 'string', name: 'video_id' },
      { type: 'address', name: 'viewer_address' },
      { type: 'uint64', name: 'usdc_amount' },
      { type: 'address', name: 'creator_address' }
    ],
    returns: { type: 'bool' }
  })

  const atc = new algosdk.AtomicTransactionComposer()
  atc.addMethodCall({
    appID: appId,
    method,
    sender: senderAddress,
    suggestedParams,
    signer: algosdk.makeBasicAccountTransactionSigner(platformAccount),
    methodArgs: [videoId, viewerAddress, BigInt(amount), creatorAddress]
  })

  await atc.execute(algod, 4)
}

export function requirePayment(priceUSDC, videoId) {
  return async function requirePaymentMiddleware(req, res, next) {
    const platformWallet = process.env.PLATFORM_WALLET
    const usdcAsaId = process.env.USDC_ASA_ID ? Number(process.env.USDC_ASA_ID) : null
    if (!platformWallet) {
      return paymentRequired(res, {
        priceUSDC,
        address: '',
        videoId,
        error: 'platform_wallet_not_configured'
      })
    }

    const paymentHeader = req.headers['x-payment']
    if (!paymentHeader || String(paymentHeader).trim().length === 0) {
      return paymentRequired(res, { priceUSDC, address: platformWallet, videoId })
    }

    try {
      console.log('X-PAYMENT received', { len: String(paymentHeader).length })
      // Preferred path (works on any network): submit the signed txn and verify by decoding.
      const algod = new algosdk.Algodv2(process.env.ALGORAND_NODE_TOKEN ?? '', process.env.ALGORAND_NODE_URL, '')
      const direct = await verifyBySubmittingSignedTxn({
        algod,
        signedTxnB64: paymentHeader,
        expectedReceiver: platformWallet,
        expectedAssetId: usdcAsaId,
        expectedAmount: priceUSDC,
      })

      if (direct.ok) {
        console.log('payment verified', { txid: direct.txid, viewerAddress: direct.viewerAddress, amount: direct.amount })
        const creatorAddress = req.creatorAddress
        await callMakePayment({
          videoId,
          viewerAddress: direct.viewerAddress,
          amount: direct.amount,
          creatorAddress,
        })
        return next()
      }

      console.log('direct payment verify failed', { error: direct.error })

      // Fallback path: use facilitator if configured (useful when payment header isn't a raw signed txn).
      const apiKey = process.env.GOPLAUSIBLE_API_KEY
      if (!apiKey) {
        return paymentRequired(res, {
          priceUSDC,
          address: platformWallet,
          videoId,
          error: direct.error ?? 'payment_not_verified',
        })
      }

      const resp = await fetch(GOPLAUSIBLE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ payment: paymentHeader, network: 'algorand' })
      })

      const data = await resp.json().catch(() => ({}))
      if (!data || data.verified !== true) {
        return paymentRequired(res, {
          priceUSDC,
          address: platformWallet,
          videoId,
          error: 'payment_not_verified'
        })
      }

      const { viewerAddress, amount } = data
      if (!viewerAddress || !amount) {
        return paymentRequired(res, {
          priceUSDC,
          address: platformWallet,
          videoId,
          error: 'payment_not_verified'
        })
      }

      const creatorAddress = req.creatorAddress
      await callMakePayment({
        videoId,
        viewerAddress,
        amount: Number(amount),
        creatorAddress
      })

      return next()
    } catch (e) {
      return paymentRequired(res, {
        priceUSDC,
        address: platformWallet,
        videoId,
        error: 'payment_not_verified'
      })
    }
  }
}

