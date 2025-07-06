import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import { contracts } from '../config/contracts'
import { filecoinCalibration } from 'wagmi/chains'

export const useContracts = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Check if on correct network
  const isCorrectChain = chainId === filecoinCalibration.id

  // Get contract instance
  const getContractInstance = (contractName) => {
    if (!isConnected || !isCorrectChain || !publicClient) {
      throw new Error('Wallet not connected or wrong network')
    }

    const contractConfig = contracts[filecoinCalibration.id]?.[contractName]
    if (!contractConfig) {
      throw new Error(`Contract ${contractName} not found`)
    }

    return getContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: {
        public: publicClient,
        wallet: walletClient
      }
    })
  }

  // Get read-only contract instance  
  const getReadOnlyContract = (contractName) => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    const contractConfig = contracts[filecoinCalibration.id]?.[contractName]
    if (!contractConfig) {
      throw new Error(`Contract ${contractName} not found`)
    }

    return getContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient
    })
  }

  return {
    address,
    isConnected,
    isCorrectChain,
    chainId,
    publicClient,
    walletClient,
    getContractInstance,
    getReadOnlyContract
  }
} 