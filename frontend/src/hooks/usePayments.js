import { useState, useCallback, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useContracts } from './useContracts'
import { toast } from 'react-hot-toast'

export const usePayments = () => {
  const { address, isConnected, isCorrectChain, getContractInstance, getReadOnlyContract } = useContracts()
  
  // State
  const [escrows, setEscrows] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Enums to match contract
  const PaymentType = {
    ONE_TIME: 0,
    SUBSCRIPTION: 1,
    ESCROW: 2,
    STAKE: 3
  }

  const EscrowStatus = {
    ACTIVE: 0,
    COMPLETED: 1,
    DISPUTED: 2,
    REFUNDED: 3,
    CANCELLED: 4
  }

  const SubscriptionStatus = {
    ACTIVE: 0,
    PAUSED: 1,
    CANCELLED: 2,
    EXPIRED: 3
  }

  // Get payments contract instance
  const getPaymentsContract = useCallback(() => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }
    return getContractInstance('VerifiAIPayments')
  }, [getContractInstance, isConnected, isCorrectChain])

  // Get read-only payments contract
  const getPaymentsReadOnly = useCallback(() => {
    return getReadOnlyContract('VerifiAIPayments')
  }, [getReadOnlyContract])

  // Create escrow for secure transactions
  const createEscrow = useCallback(async (seller, amount, releaseTime, datasetId, description = "") => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      const amountWei = parseEther(amount.toString())
      
      const hash = await contract.write.createEscrow([
        seller,
        amountWei,
        BigInt(releaseTime),
        BigInt(datasetId),
        description
      ])
      
      toast.loading('Creating escrow...', { id: 'escrow' })
      toast.success('Escrow created successfully!', { id: 'escrow' })
      
      await fetchUserEscrows()
      
      return { hash }
    } catch (err) {
      console.error('Error creating escrow:', err)
      toast.error(err.message || 'Escrow creation failed', { id: 'escrow' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Release escrow funds to seller
  const releaseEscrow = useCallback(async (escrowId) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      
      const hash = await contract.write.releaseEscrow([BigInt(escrowId)])
      
      toast.loading('Releasing escrow...', { id: 'release' })
      toast.success('Escrow released successfully!', { id: 'release' })
      
      await fetchUserEscrows()
      
      return { hash }
    } catch (err) {
      console.error('Error releasing escrow:', err)
      toast.error(err.message || 'Escrow release failed', { id: 'release' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Refund escrow to buyer
  const refundEscrow = useCallback(async (escrowId) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      
      const hash = await contract.write.refundEscrow([BigInt(escrowId)])
      
      toast.loading('Refunding escrow...', { id: 'refund' })
      toast.success('Escrow refunded successfully!', { id: 'refund' })
      
      await fetchUserEscrows()
      
      return { hash }
    } catch (err) {
      console.error('Error refunding escrow:', err)
      toast.error(err.message || 'Escrow refund failed', { id: 'refund' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Create subscription for recurring payments
  const createSubscription = useCallback(async (provider, amountPerPeriod, periodDuration, totalPeriods, datasetId, accessLevel = "") => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      const amountWei = parseEther(amountPerPeriod.toString())
      
      const hash = await contract.write.createSubscription([
        provider,
        amountWei,
        BigInt(periodDuration),
        BigInt(totalPeriods),
        BigInt(datasetId),
        accessLevel
      ])
      
      toast.loading('Creating subscription...', { id: 'subscription' })
      toast.success('Subscription created successfully!', { id: 'subscription' })
      
      await fetchUserSubscriptions()
      
      return { hash }
    } catch (err) {
      console.error('Error creating subscription:', err)
      toast.error(err.message || 'Subscription creation failed', { id: 'subscription' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Process subscription payment
  const processSubscriptionPayment = useCallback(async (subscriptionId) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      
      const hash = await contract.write.processSubscriptionPayment([BigInt(subscriptionId)])
      
      toast.loading('Processing subscription payment...', { id: 'subPayment' })
      toast.success('Subscription payment processed successfully!', { id: 'subPayment' })
      
      await fetchUserSubscriptions()
      
      return { hash }
    } catch (err) {
      console.error('Error processing subscription payment:', err)
      toast.error(err.message || 'Subscription payment failed', { id: 'subPayment' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getPaymentsContract()
      
      const hash = await contract.write.cancelSubscription([BigInt(subscriptionId)])
      
      toast.loading('Cancelling subscription...', { id: 'cancel' })
      toast.success('Subscription cancelled successfully!', { id: 'cancel' })
      
      await fetchUserSubscriptions()
      
      return { hash }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      toast.error(err.message || 'Subscription cancellation failed', { id: 'cancel' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getPaymentsContract])

  // Fetch user's escrows
  const fetchUserEscrows = useCallback(async (userAddress = address) => {
    if (!userAddress) return []

    try {
      const contract = getPaymentsReadOnly()
      const escrowIds = await contract.read.getUserEscrows([userAddress])
      const escrowList = []

      for (const escrowId of escrowIds) {
        try {
          const escrow = await contract.read.escrows([escrowId])
          escrowList.push({
            id: Number(escrow.id),
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount: formatEther(escrow.amount),
            createdAt: Number(escrow.createdAt),
            releaseTime: Number(escrow.releaseTime),
            status: Number(escrow.status),
            description: escrow.description,
            datasetId: Number(escrow.datasetId)
          })
        } catch (err) {
          console.error(`Error fetching escrow ${escrowId}:`, err)
        }
      }

      setEscrows(escrowList)
      return escrowList
    } catch (err) {
      console.error('Error fetching user escrows:', err)
      setError(err.message)
      return []
    }
  }, [address, getPaymentsReadOnly])

  // Fetch user's subscriptions
  const fetchUserSubscriptions = useCallback(async (userAddress = address) => {
    if (!userAddress) return []

    try {
      const contract = getPaymentsReadOnly()
      const subscriptionIds = await contract.read.getUserSubscriptions([userAddress])
      const subscriptionList = []

      for (const subscriptionId of subscriptionIds) {
        try {
          const subscription = await contract.read.subscriptions([subscriptionId])
          subscriptionList.push({
            id: Number(subscription.id),
            subscriber: subscription.subscriber,
            provider: subscription.provider,
            amountPerPeriod: formatEther(subscription.amountPerPeriod),
            periodDuration: Number(subscription.periodDuration),
            startTime: Number(subscription.startTime),
            endTime: Number(subscription.endTime),
            lastPayment: Number(subscription.lastPayment),
            status: Number(subscription.status),
            datasetId: Number(subscription.datasetId),
            accessLevel: subscription.accessLevel
          })
        } catch (err) {
          console.error(`Error fetching subscription ${subscriptionId}:`, err)
        }
      }

      setSubscriptions(subscriptionList)
      return subscriptionList
    } catch (err) {
      console.error('Error fetching user subscriptions:', err)
      setError(err.message)
      return []
    }
  }, [address, getPaymentsReadOnly])

  // Check if subscription payment is due
  const isPaymentDue = useCallback(async (subscriptionId) => {
    try {
      const contract = getPaymentsReadOnly()
      return await contract.read.isPaymentDue([BigInt(subscriptionId)])
    } catch (err) {
      console.error('Error checking payment due:', err)
      return false
    }
  }, [getPaymentsReadOnly])

  // Get escrow by ID
  const getEscrow = useCallback(async (escrowId) => {
    try {
      const contract = getPaymentsReadOnly()
      const escrow = await contract.read.escrows([BigInt(escrowId)])
      
      return {
        id: Number(escrow.id),
        buyer: escrow.buyer,
        seller: escrow.seller,
        amount: formatEther(escrow.amount),
        createdAt: Number(escrow.createdAt),
        releaseTime: Number(escrow.releaseTime),
        status: Number(escrow.status),
        description: escrow.description,
        datasetId: Number(escrow.datasetId)
      }
    } catch (err) {
      console.error('Error getting escrow:', err)
      return null
    }
  }, [getPaymentsReadOnly])

  // Get subscription by ID
  const getSubscription = useCallback(async (subscriptionId) => {
    try {
      const contract = getPaymentsReadOnly()
      const subscription = await contract.read.subscriptions([BigInt(subscriptionId)])
      
      return {
        id: Number(subscription.id),
        subscriber: subscription.subscriber,
        provider: subscription.provider,
        amountPerPeriod: formatEther(subscription.amountPerPeriod),
        periodDuration: Number(subscription.periodDuration),
        startTime: Number(subscription.startTime),
        endTime: Number(subscription.endTime),
        lastPayment: Number(subscription.lastPayment),
        status: Number(subscription.status),
        datasetId: Number(subscription.datasetId),
        accessLevel: subscription.accessLevel
      }
    } catch (err) {
      console.error('Error getting subscription:', err)
      return null
    }
  }, [getPaymentsReadOnly])

  // Helper functions for status text
  const getEscrowStatusText = useCallback((status) => {
    switch (status) {
      case EscrowStatus.ACTIVE: return 'Active'
      case EscrowStatus.COMPLETED: return 'Completed'
      case EscrowStatus.DISPUTED: return 'Disputed'
      case EscrowStatus.REFUNDED: return 'Refunded'
      case EscrowStatus.CANCELLED: return 'Cancelled'
      default: return 'Unknown'
    }
  }, [])

  const getSubscriptionStatusText = useCallback((status) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'Active'
      case SubscriptionStatus.PAUSED: return 'Paused'
      case SubscriptionStatus.CANCELLED: return 'Cancelled'
      case SubscriptionStatus.EXPIRED: return 'Expired'
      default: return 'Unknown'
    }
  }, [])

  // Auto-fetch data when account/network changes
  useEffect(() => {
    if (address && isConnected && isCorrectChain) {
      fetchUserEscrows()
      fetchUserSubscriptions()
    }
  }, [address, isConnected, isCorrectChain, fetchUserEscrows, fetchUserSubscriptions])

  return {
    // State
    escrows,
    subscriptions,
    payments,
    isLoading,
    error,

    // Constants
    PaymentType,
    EscrowStatus,
    SubscriptionStatus,

    // Functions
    createEscrow,
    releaseEscrow,
    refundEscrow,
    createSubscription,
    processSubscriptionPayment,
    cancelSubscription,
    fetchUserEscrows,
    fetchUserSubscriptions,
    isPaymentDue,
    getEscrow,
    getSubscription,

    // Helper functions
    getEscrowStatusText,
    getSubscriptionStatusText,
    getEscrowById: (id) => escrows.find(e => e.id === Number(id)),
    getSubscriptionById: (id) => subscriptions.find(s => s.id === Number(id)),
    getActiveEscrows: () => escrows.filter(e => e.status === EscrowStatus.ACTIVE),
    getActiveSubscriptions: () => subscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE),
    getCompletedEscrows: () => escrows.filter(e => e.status === EscrowStatus.COMPLETED),
    getCancelledSubscriptions: () => subscriptions.filter(s => s.status === SubscriptionStatus.CANCELLED)
  }
} 