import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import App from './App'
import './styles/index.css'

const walletManager = new WalletManager({
  wallets: [{ id: WalletId.PERA }],
  defaultNetwork: 'testnet',
  networks: {
    testnet: {
      algod: {
        baseServer: 'https://testnet-api.algonode.cloud',
        port: '',
        token: '',
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletProvider>
  </React.StrictMode>
)
