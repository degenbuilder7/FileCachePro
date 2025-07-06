import { useState, useCallback, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useContracts } from './useContracts'
import { toast } from 'react-hot-toast'

export const useMarketplace = () => {
  const { address, isConnected, isCorrectChain, getContractInstance, getReadOnlyContract } = useContracts()
  
  // State
  const [datasets, setDatasets] = useState([])
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get marketplace contract instance
  const getMarketplaceContract = useCallback(() => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }
    return getContractInstance('VerifiAIMarketplace')
  }, [getContractInstance, isConnected, isCorrectChain])

  // Get read-only marketplace contract
  const getMarketplaceReadOnly = useCallback(() => {
    return getReadOnlyContract('VerifiAIMarketplace')
  }, [getReadOnlyContract])

  // Stake to become a provider (matches contract: stakeAsProvider(uint256 amount))
  const stakeAsProvider = useCallback(async (stakeAmount) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getMarketplaceContract()
      const amountWei = parseEther(stakeAmount.toString())
      
      const hash = await contract.write.stakeAsProvider([amountWei])
      
      toast.loading('Staking to become provider...', { id: 'stake' })
      toast.success(`Successfully staked ${stakeAmount} USDFC as provider!`, { id: 'stake' })
      
      return { hash }
    } catch (err) {
      console.error('Error staking as provider:', err)
      toast.error(err.message || 'Staking failed', { id: 'stake' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getMarketplaceContract])

  // List a dataset (matches contract: listDataset(string calldata metadataUri, uint256 pricePerBatch, uint64 filecoinDealId))
  const listDataset = useCallback(async (metadataUri, pricePerBatch, filecoinDealId = 0) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getMarketplaceContract()
      const priceWei = parseEther(pricePerBatch.toString())
      
      const hash = await contract.write.listDataset([
        metadataUri,
        priceWei,
        BigInt(filecoinDealId)
      ])
      
      toast.loading('Listing dataset...', { id: 'list' })
      toast.success('Dataset listed successfully!', { id: 'list' })
      
      await fetchDatasets()
      
      return { hash }
    } catch (err) {
      console.error('Error listing dataset:', err)
      toast.error(err.message || 'Dataset listing failed', { id: 'list' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getMarketplaceContract])

  // Purchase data (matches contract: purchaseData(uint256 datasetId, uint256 batchCount))
  const purchaseData = useCallback(async (datasetId, batchCount = 1) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getMarketplaceContract()
      
      const hash = await contract.write.purchaseData([
        BigInt(datasetId),
        BigInt(batchCount)
      ])
      
      toast.loading('Purchasing data...', { id: 'purchase' })
      toast.success(`Successfully purchased ${batchCount} batch(es) of data!`, { id: 'purchase' })
      
      await fetchDatasets()
      await fetchPurchases()
      
      return { hash }
    } catch (err) {
      console.error('Error purchasing data:', err)
      toast.error(err.message || 'Purchase failed', { id: 'purchase' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getMarketplaceContract])

  // Fetch all datasets using datasetCounter
  const fetchDatasets = useCallback(async () => {
    try {
      const contract = getMarketplaceReadOnly()
      const datasetCounter = await contract.read.datasetCounter()
      const datasetList = []

      for (let i = 1; i <= Number(datasetCounter); i++) {
        try {
          const dataset = await contract.read.getDataset([BigInt(i)])
          datasetList.push({
            id: Number(dataset.id),
            provider: dataset.provider,
            metadataUri: dataset.metadataUri,
            pricePerBatch: formatEther(dataset.pricePerBatch),
            filecoinDealId: Number(dataset.filecoinDealId),
            isActive: dataset.isActive,
            totalSales: formatEther(dataset.totalSales)
          })
        } catch (err) {
          console.error(`Error fetching dataset ${i}:`, err)
        }
      }

      setDatasets(datasetList)
      return datasetList
    } catch (err) {
      console.error('Error fetching datasets:', err)
      setError(err.message)
      return []
    }
  }, [getMarketplaceReadOnly])

  // Fetch all purchases using purchaseCounter
  const fetchPurchases = useCallback(async () => {
    try {
      const contract = getMarketplaceReadOnly()
      const purchaseCounter = await contract.read.purchaseCounter()
      const purchaseList = []

      for (let i = 1; i <= Number(purchaseCounter); i++) {
        try {
          const purchase = await contract.read.getPurchase([BigInt(i)])
          purchaseList.push({
            id: Number(purchase.id),
            datasetId: Number(purchase.datasetId),
            buyer: purchase.buyer,
            amount: formatEther(purchase.amount),
            timestamp: Number(purchase.timestamp),
            isVerified: purchase.isVerified
          })
        } catch (err) {
          console.error(`Error fetching purchase ${i}:`, err)
        }
      }

      setPurchases(purchaseList)
      return purchaseList
    } catch (err) {
      // console.error('Error fetching purchases:', err)
      // setError(err.message)
      return []
    }
  }, [getMarketplaceReadOnly])

  // Get user's provider status and stake
  const getProviderStatus = useCallback(async (userAddress = address) => {
    if (!userAddress) return { isProvider: false, stake: '0' }

    try {
      const contract = getMarketplaceReadOnly()
      const stakeWei = await contract.read.providerStakes([userAddress])
      const stake = formatEther(stakeWei)
      
      return {
        isProvider: parseFloat(stake) > 0,
        stake
      }
    } catch (err) {
      // console.error('Error getting provider status:', err)
      return { isProvider: false, stake: '0' }
    }
  }, [address, getMarketplaceReadOnly])

  // Get user's datasets
  const getUserDatasets = useCallback(async (userAddress = address) => {
    if (!userAddress) return []

    try {
      const allDatasets = await fetchDatasets()
      return allDatasets.filter(dataset => 
        dataset.provider.toLowerCase() === userAddress.toLowerCase()
      )
    } catch (err) {
      // console.error('Error getting user datasets:', err)
      return []
    }
  }, [address, fetchDatasets])

  // Get user's purchases
  const getUserPurchases = useCallback(async (userAddress = address) => {
    if (!userAddress) return []

    try {
      const allPurchases = await fetchPurchases()
      return allPurchases.filter(purchase => 
        purchase.buyer.toLowerCase() === userAddress.toLowerCase()
      )
    } catch (err) {
      // console.error('Error getting user purchases:', err)
      return []
    }
  }, [address, fetchPurchases])

  // Check if dataset's Filecoin deal is active
  const isDatasetDealActive = useCallback(async (datasetId) => {
    try {
      const contract = getMarketplaceReadOnly()
      const result = await contract.read.isDatasetDealActive([BigInt(datasetId)])
      return {
        isActive: result[0],
        dealId: Number(result[1])
      }
    } catch (err) {
      console.error('Error checking deal status:', err)
      return { isActive: false, dealId: 0 }
    }
  }, [getMarketplaceReadOnly])

  // Auto-fetch data when account/network changes
  useEffect(() => {
    if (isConnected && isCorrectChain) {
      fetchDatasets()
      fetchPurchases()
    }
  }, [isConnected, isCorrectChain, fetchDatasets, fetchPurchases])

  return {
    // State
    datasets,
    purchases,
    isLoading,
    error,

    // Functions
    stakeAsProvider,
    listDataset,
    purchaseData,
    fetchDatasets,
    fetchPurchases,
    getProviderStatus,
    getUserDatasets,
    getUserPurchases,
    isDatasetDealActive,

    // Helper functions
    getDatasetById: (id) => datasets.find(d => d.id === Number(id)),
    getActiveDatasets: () => datasets.filter(d => d.isActive),
    getPurchaseById: (id) => purchases.find(p => p.id === Number(id)),
    isProvider: async (userAddress) => {
      const status = await getProviderStatus(userAddress)
      return status.isProvider
    }
  }
} 