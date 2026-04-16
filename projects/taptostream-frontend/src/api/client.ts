import axios from 'axios'

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const client = axios.create({
  baseURL: backendUrl,
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const address = localStorage.getItem('walletAddress')
  if (address) config.headers['X-Wallet-Address'] = address
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) return Promise.resolve(error.response)
    return Promise.reject(error)
  }
)

export default client
