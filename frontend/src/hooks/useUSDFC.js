import { useState, useCallback, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useContracts } from './useContracts'
import { toast } from 'react-hot-toast'

export const useUSDFC = () => {
  const { address, isConnected, isCorrectChain, getContractInstance, getReadOnlyContract } = useContracts()
  
  // State
  const [balance, setBalance] = useState('0')
  const [collateralInfo, setCollateralInfo] = useState({ depositedCollateral: '0', collateralRatio: '0' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get USDFC contract instance
  const getUSDFCContract = useCallback(() => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }
    return getContractInstance('USDFC')
  }, [getContractInstance, isConnected, isCorrectChain])

  // Get read-only USDFC contract
  const getUSDFCReadOnly = useCallback(() => {
    return getReadOnlyContract('USDFC')
  }, [getReadOnlyContract])

  // Fetch user balance
  const fetchBalance = useCallback(async (userAddress = address) => {
    if (!userAddress) return

    try {
      const contract = getUSDFCReadOnly()
      const balanceWei = await contract.read.balanceOf([userAddress])
      const balanceFormatted = formatEther(balanceWei)
      setBalance(balanceFormatted)
      return balanceFormatted
    } catch (err) {
      console.error('Error fetching USDFC balance:', err)
      setError(err.message)
      return '0'
    }
  }, [address, getUSDFCReadOnly])

  // Fetch collateral information
  const fetchCollateralInfo = useCallback(async (userAddress = address) => {
    if (!userAddress) return

    try {
      const contract = getUSDFCReadOnly()
      const collateralData = await contract.read.getCollateralInfo([userAddress])
      
      const info = {
        depositedCollateral: formatEther(collateralData.depositedCollateral),
        collateralRatio: collateralData.collateralRatio.toString()
      }
      
      setCollateralInfo(info)
      return info
    } catch (err) {
      console.error('Error fetching collateral info:', err)
      setError(err.message)
      return { depositedCollateral: '0', collateralRatio: '0' }
    }
  }, [address, getUSDFCReadOnly])

  // Transfer USDFC tokens
  const transfer = useCallback(async (to, amount) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getUSDFCContract()
      const amountWei = parseEther(amount.toString())
      
      const hash = await contract.write.transfer([to, amountWei])
      
      toast.loading('Transferring USDFC...', { id: 'transfer' })
      
      // Wait for transaction confirmation (you may need to implement this differently)
      toast.success(`Transferred ${amount} USDFC successfully!`, { id: 'transfer' })
      
      // Refresh balance
      await fetchBalance()
      
      return { hash }
    } catch (err) {
      console.error('Error transferring USDFC:', err)
      toast.error(err.message || 'Transfer failed', { id: 'transfer' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getUSDFCContract, fetchBalance])

  // Approve tokens for spending
  const approve = useCallback(async (spender, amount) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getUSDFCContract()
      const amountWei = parseEther(amount.toString())
      
      const hash = await contract.write.approve([spender, amountWei])
      
      toast.loading('Approving USDFC...', { id: 'approve' })
      
      toast.success(`Approved ${amount} USDFC for spending!`, { id: 'approve' })
      
      return { hash }
    } catch (err) {
      console.error('Error approving USDFC:', err)
      toast.error(err.message || 'Approval failed', { id: 'approve' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getUSDFCContract])

  // Check allowance
  const getAllowance = useCallback(async (owner, spender) => {
    if (!owner || !spender) return '0'

    try {
      const contract = getUSDFCReadOnly()
      const allowanceWei = await contract.read.allowance([owner, spender])
      return formatEther(allowanceWei)
    } catch (err) {
      console.error('Error getting allowance:', err)
      return '0'
    }
  }, [getUSDFCReadOnly])

  // Mint USDFC with FIL collateral
  const mintWithCollateral = useCallback(async (filAmount) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getUSDFCContract()
      const amountWei = parseEther(filAmount.toString())
      
      const hash = await contract.write.mintWithCollateral({
        value: amountWei
      })
      
      toast.loading('Minting USDFC with FIL collateral...', { id: 'mint' })
      
      toast.success(`Minted USDFC with ${filAmount} FIL collateral!`, { id: 'mint' })
      
      // Refresh balance and collateral info
      await fetchBalance()
      await fetchCollateralInfo()
      
      return { hash }
    } catch (err) {
      console.error('Error minting USDFC:', err)
      toast.error(err.message || 'Minting failed', { id: 'mint' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getUSDFCContract, fetchBalance, fetchCollateralInfo])

  // Redeem USDFC for FIL
  const redeem = useCallback(async (usdcAmount) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getUSDFCContract()
      const amountWei = parseEther(usdcAmount.toString())
      
      const hash = await contract.write.redeem([amountWei])
      
      toast.loading('Redeeming USDFC for FIL...', { id: 'redeem' })
      
      toast.success(`Redeemed ${usdcAmount} USDFC for FIL!`, { id: 'redeem' })
      
      // Refresh balance and collateral info
      await fetchBalance()
      await fetchCollateralInfo()
      
      return { hash }
    } catch (err) {
      console.error('Error redeeming USDFC:', err)
      toast.error(err.message || 'Redemption failed', { id: 'redeem' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getUSDFCContract, fetchBalance, fetchCollateralInfo])

  // Auto-fetch data when account/network changes
  useEffect(() => {
    if (address && isConnected && isCorrectChain) {
      fetchBalance()
      fetchCollateralInfo()
    }
  }, [address, isConnected, isCorrectChain, fetchBalance, fetchCollateralInfo])

  return {
    // State
    balance,
    collateralInfo,
    isLoading,
    error,

    // Functions
    transfer,
    approve,
    getAllowance,
    mintWithCollateral,
    redeem,
    fetchBalance,
    fetchCollateralInfo,

    // Computed values
    formattedBalance: parseFloat(balance || '0').toFixed(2),
    formattedCollateral: parseFloat(collateralInfo?.depositedCollateral || '0').toFixed(2),
    hasBalance: parseFloat(balance || '0') > 0,
    hasCollateral: parseFloat(collateralInfo?.depositedCollateral || '0') > 0
  }
} 