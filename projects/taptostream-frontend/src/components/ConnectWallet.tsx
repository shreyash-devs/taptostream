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

  return (
    <dialog
      id="connect_wallet_modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      style={{ display: openModal ? 'flex' : 'none' }}
    >
      <form
        method="dialog"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-card/60 backdrop-blur shadow-card p-6"
      >
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <span aria-hidden>👛</span> Connect Wallet
        </h3>

        <div className="mt-4 grid gap-3">
          {activeAddress && (
            <>
              <Account />
              <div className="divider" />
            </>
          )}

          {wallets?.map((wallet) => (
            <button
              data-test-id={`${wallet.id}-connect`}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-bg-surface/40 px-4 py-3 text-text-primary hover:border-accent-green/70 hover:bg-bg-surface/60 transition"
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
            >
              {!isKmd(wallet) && (
                <img
                  alt={`wallet_icon_${wallet.id}`}
                  src={wallet.metadata.icon}
                  style={{ objectFit: 'contain', width: '30px', height: 'auto' }}
                />
              )}
              <span className="text-sm">{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
            </button>
            ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            data-test-id="close-wallet-modal"
            className="flex-1 rounded-xl border border-white/10 bg-bg-surface/40 px-4 py-2 text-sm text-text-primary hover:border-accent-green/70 hover:bg-white/5 transition"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              closeModal()
            }}
          >
            Close
          </button>
          {activeAddress && (
            <button
              className="flex-1 rounded-xl border border-accent-green/70 bg-accent-green/10 px-4 py-2 text-sm text-accent-green hover:bg-accent-green/20 transition"
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
            >
              Logout
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
export default ConnectWallet
