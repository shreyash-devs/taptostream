import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  if (!openModal) return null

  return (
    /* Full-screen overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeModal}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer',
        }}
      />

      {/* Glass panel */}
      <div
        id="connect_wallet_modal"
        role="dialog"
        aria-modal="true"
        aria-label="Connect Wallet"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '440px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(14,14,20,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,160,0.06)',
          padding: '1.75rem',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#f0f0f0',
              margin: 0,
            }}
          >
            <span aria-hidden>👛</span>
            Connect Wallet
          </h3>

          {/* Close button */}
          <button
            id="close-wallet-modal-x"
            onClick={closeModal}
            aria-label="Close"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: '#888899',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.6)'
              e.currentTarget.style.color = '#f0f0f0'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = '#888899'
            }}
          >
            ✕
          </button>
        </div>

        {/* Connected account info */}
        {activeAddress && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(0,229,160,0.2)',
              background: 'rgba(0,229,160,0.06)',
            }}
          >
            <Account />
          </div>
        )}

        {/* Wallet list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {wallets?.map((wallet) => (
            <button
              data-test-id={`${wallet.id}-connect`}
              key={`provider-${wallet.id}`}
              type="button"
              onClick={async (e) => {
                e.preventDefault()
                try {
                  // If a wallet is already active, disconnect it first so user can switch providers.
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet && activeWallet.id !== wallet.id) {
                    await activeWallet.disconnect()
                  }
                  await wallet.connect()
                  closeModal()
                } catch (err: any) {
                  enqueueSnackbar(err?.message ?? 'Failed to connect wallet', { variant: 'error' })
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(26,26,36,0.5)',
                color: '#f0f0f0',
                padding: '12px 16px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,229,160,0.65)'
                e.currentTarget.style.background = 'rgba(0,229,160,0.06)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(0,229,160,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.background = 'rgba(26,26,36,0.5)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {!isKmd(wallet) && (
                <img
                  alt={`wallet_icon_${wallet.id}`}
                  src={wallet.metadata.icon}
                  style={{ objectFit: 'contain', width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0 }}
                />
              )}
              {isKmd(wallet) && (
                <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>🔑</span>
              )}
              <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
            </button>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
          <button
            data-test-id="close-wallet-modal"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              closeModal()
            }}
            style={{
              flex: 1,
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(26,26,36,0.5)',
              color: '#f0f0f0',
              padding: '9px 0',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.background = 'rgba(26,26,36,0.5)'
            }}
          >
            Close
          </button>

          {activeAddress && (
            <button
              data-test-id="logout"
              type="button"
              onClick={async (e) => {
                e.preventDefault()
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    // Required for logout/cleanup of inactive providers
                    // For instance, when you login to localnet wallet and switch network
                    // to testnet/mainnet or vice verse.
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
              style={{
                flex: 1,
                borderRadius: '10px',
                border: '1px solid rgba(0,229,160,0.55)',
                background: 'rgba(0,229,160,0.08)',
                color: '#00e5a0',
                padding: '9px 0',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,229,160,0.18)'
                e.currentTarget.style.borderColor = 'rgba(0,229,160,0.8)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,229,160,0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,229,160,0.55)'
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet
