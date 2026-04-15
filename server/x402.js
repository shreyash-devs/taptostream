import algosdk from 'algosdk'

const GOPLAUSIBLE_VERIFY_URL = 'https://api.goplausible.xyz/x402/verify'

function paymentRequired(res, { priceUSDC, currency = 'USDC', network = 'algorand', address, videoId, assetId, error }) {
  const required = {
    price: String(priceUSDC),
    currency,
    network,
    address,
    videoId,
    ...(assetId != null ? { assetId: String(assetId) } : {}),
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

function addressFromAny(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.publicKey) return algosdk.encodeAddress(value.publicKey)
  if (value.addr && value.addr.publicKey) return algosdk.encodeAddress(value.addr.publicKey)
  if (value.bytes && value.bytes instanceof Uint8Array) return algosdk.encodeAddress(value.bytes)
  if (value instanceof Uint8Array) return algosdk.encodeAddress(value)
  return null
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

function encodeAddressSafe(value) {
  try {
    return addressFromAny(value)
  } catch {
    return null
  }
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
  const sender = addressFromAny(txn.from) || addressFromAny(txn.sender)
  if (!sender) return { ok: false, error: 'invalid_sender' }

  // Verify this is an ASA transfer to platform wallet for the expected USDC amount.
  if (txn.type !== 'axfer') return { ok: false, error: 'invalid_txn_type' }
  const assetId = pickFirst(
    txn.assetIndex,
    txn.xaid,
    txn.assetTransferTxn?.assetIndex,
    txn.assetTransferTxn?.xaid,
    txn.assetTransferTransaction?.assetIndex,
    txn.assetTransferTransaction?.xaid,
    txn.assetTransfer?.assetIndex,
    txn.assetTransfer?.xaid,
  )
  if (expectedAssetId != null && Number(assetId) !== Number(expectedAssetId)) {
    return { ok: false, error: 'invalid_asset', detail: `expected:${expectedAssetId} got:${assetId}` }
  }
  const receiverCandidates = [
    encodeAddressSafe(txn.to),
    encodeAddressSafe(txn.assetReceiver),
    encodeAddressSafe(txn.arcv),
    encodeAddressSafe(txn.receiver),
    encodeAddressSafe(txn.rcv),
    encodeAddressSafe(txn.assetTransferTxn?.to),
    encodeAddressSafe(txn.assetTransferTxn?.assetReceiver),
    encodeAddressSafe(txn.assetTransferTxn?.arcv),
    encodeAddressSafe(txn.assetTransferTxn?.receiver),
    encodeAddressSafe(txn.assetTransferTxn?.rcv),
    encodeAddressSafe(txn.assetTransferTransaction?.to),
    encodeAddressSafe(txn.assetTransferTransaction?.assetReceiver),
    encodeAddressSafe(txn.assetTransferTransaction?.arcv),
    encodeAddressSafe(txn.assetTransferTransaction?.receiver),
    encodeAddressSafe(txn.assetTransferTransaction?.rcv),
    encodeAddressSafe(txn.assetTransfer?.to),
    encodeAddressSafe(txn.assetTransfer?.assetReceiver),
    encodeAddressSafe(txn.assetTransfer?.arcv),
    encodeAddressSafe(txn.assetTransfer?.receiver),
    encodeAddressSafe(txn.assetTransfer?.rcv),
    encodeAddressSafe(txn.txn?.to),
    encodeAddressSafe(txn.txn?.assetReceiver),
    encodeAddressSafe(txn.txn?.arcv),
    encodeAddressSafe(txn.txn?.receiver),
    encodeAddressSafe(txn.txn?.rcv),
  ].filter(Boolean)

  const receiver = receiverCandidates[0] ?? null
  if (!receiver) {
    return {
      ok: false,
      error: 'invalid_receiver',
      detail: `expected:${expectedReceiver} got:undefined`,
    }
  }
  if (receiver !== expectedReceiver) {
    return {
      ok: false,
      error: 'invalid_receiver',
      detail: `expected:${expectedReceiver} got:${receiver}`,
    }
  }
  const amount = pickFirst(
    txn.amount,
    txn.aamt,
    txn.assetTransferTxn?.amount,
    txn.assetTransferTxn?.aamt,
    txn.assetTransferTransaction?.amount,
    txn.assetTransferTransaction?.aamt,
    txn.assetTransfer?.amount,
    txn.assetTransfer?.aamt,
  )
  if (expectedAmount != null && Number(amount) !== Number(expectedAmount)) return { ok: false, error: 'invalid_amount' }

  // Broadcast to network; if it fails, payment is not verified.
  let txid
  try {
    const { txId } = await algod.sendRawTransaction(signedBytes).do()
    txid = txId
    // On public TestNet, confirmation wait can be flaky from public RPC.
    // Treat successful broadcast as verified to avoid false negatives/duplicate charges.
    algosdk.waitForConfirmation(algod, txid, 20).catch(() => {})
  } catch (e) {
    // If tx is already in pool/ledger (e.g. resend), treat as potentially valid and check chain state.
    const txidFromError = e?.response?.body?.txid || e?.response?.body?.data?.txid
    if (!txid && txidFromError) txid = txidFromError
    if (txid) {
      try {
        const pending = await algod.pendingTransactionInformation(txid).do()
        if (pending && Number(pending['confirmed-round'] || 0) > 0) {
          return { ok: true, txid, viewerAddress: sender, amount: Number(amount) }
        }
      } catch {
        // fall through to error return
      }
    }
    const detail = e?.response?.body?.message || e?.message || String(e)
    return { ok: false, error: 'payment_not_verified', detail }
  }

  return { ok: true, txid, viewerAddress: sender, amount: Number(amount) }
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
        assetId: usdcAsaId,
        error: 'platform_wallet_not_configured'
      })
    }

    const paymentHeader = req.headers['x-payment']
    if (!paymentHeader || String(paymentHeader).trim().length === 0) {
      return paymentRequired(res, { priceUSDC, address: platformWallet, videoId, assetId: usdcAsaId })
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

      console.log('direct payment verify failed', { error: direct.error, detail: direct.detail })

      // Fallback path: use facilitator if configured (useful when payment header isn't a raw signed txn).
      const apiKey = process.env.GOPLAUSIBLE_API_KEY
      if (!apiKey) {
        return paymentRequired(res, {
          priceUSDC,
          address: platformWallet,
          videoId,
          assetId: usdcAsaId,
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
          assetId: usdcAsaId,
          error: 'payment_not_verified'
        })
      }

      const { viewerAddress, amount } = data
      if (!viewerAddress || !amount) {
        return paymentRequired(res, {
          priceUSDC,
          address: platformWallet,
          videoId,
          assetId: usdcAsaId,
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
      console.log('payment middleware exception', {
        error: e?.message || 'unknown_error',
      })
      return paymentRequired(res, {
        priceUSDC,
        address: platformWallet,
        videoId,
        assetId: usdcAsaId,
        error: 'payment_not_verified'
      })
    }
  }
}

