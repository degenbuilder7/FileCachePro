import { createConfig, http } from 'wagmi'
import { filecoinCalibration } from 'wagmi/chains'

// Filecoin Calibration Network Configuration
export const filecoinCalibrationNetwork = {
  id: 314159,
  name: 'Filecoin Calibration',
  network: 'filecoin-calibration',
  nativeCurrency: {
    decimals: 18,
    name: 'tFIL',
    symbol: 'tFIL',
  },
  rpcUrls: {
    default: {
      http: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
    public: {
      http: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
  },
  blockExplorers: {
    default: {
      name: 'FilScan',
      url: 'https://calibration.filscan.io',
    },
  },
  testnet: true,
}

// Wagmi Configuration
export const wagmiConfig = createConfig({
  chains: [filecoinCalibrationNetwork],
  transports: {
    [filecoinCalibrationNetwork.id]: http(),
  },
})

// Network validation
export const isCorrectNetwork = (chainId) => {
  return chainId === filecoinCalibrationNetwork.id
}

// Switch network helper
export const switchToFilecoinCalibration = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${filecoinCalibrationNetwork.id.toString(16)}` }],
      })
    } catch (switchError) {
      // Network not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${filecoinCalibrationNetwork.id.toString(16)}`,
                chainName: filecoinCalibrationNetwork.name,
                nativeCurrency: filecoinCalibrationNetwork.nativeCurrency,
                rpcUrls: filecoinCalibrationNetwork.rpcUrls.default.http,
                blockExplorerUrls: [filecoinCalibrationNetwork.blockExplorers.default.url],
              },
            ],
          })
        } catch (addError) {
          console.error('Failed to add network:', addError)
          throw addError
        }
      } else {
        console.error('Failed to switch network:', switchError)
        throw switchError
      }
    }
  }
} 