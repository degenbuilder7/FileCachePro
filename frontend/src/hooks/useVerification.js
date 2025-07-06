import { useState, useCallback, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useContracts } from './useContracts'
import { toast } from 'react-hot-toast'

export const useVerification = () => {
  const { address, isConnected, isCorrectChain, getContractInstance, getReadOnlyContract } = useContracts()
  
  // State
  const [trainingSessions, setTrainingSessions] = useState([])
  const [challenges, setChallenges] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Enums to match contract
  const VerificationStatus = {
    PENDING: 0,
    VERIFIED: 1,
    FAILED: 2,
    DISPUTED: 3,
    CANCELLED: 4
  }

  const ModelType = {
    CLASSIFICATION: 0,
    REGRESSION: 1,
    NLP: 2,
    COMPUTER_VISION: 3,
    REINFORCEMENT_LEARNING: 4,
    GENERATIVE: 5,
    MULTIMODAL: 6
  }

  // Get verification contract instance
  const getVerificationContract = useCallback(() => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }
    return getContractInstance('VerifiAIVerification')
  }, [getContractInstance, isConnected, isCorrectChain])

  // Get read-only verification contract
  const getVerificationReadOnly = useCallback(() => {
    return getReadOnlyContract('VerifiAIVerification')
  }, [getReadOnlyContract])

  // Submit training session for verification (matches contract function)
  const submitTraining = useCallback(async (trainingData) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getVerificationContract()
      
      // Prepare performance metrics structure
      const metrics = {
        accuracy: BigInt(trainingData.metrics?.accuracy || 0),
        precision: BigInt(trainingData.metrics?.precision || 0),
        recall: BigInt(trainingData.metrics?.recall || 0),
        f1Score: BigInt(trainingData.metrics?.f1Score || 0),
        confidence: BigInt(trainingData.metrics?.confidence || 0),
        customMetrics: trainingData.metrics?.customMetrics || ""
      }
      
      const hash = await contract.write.submitTraining([
        BigInt(trainingData.datasetId),
        trainingData.modelHash,
        trainingData.datasetHash,
        BigInt(trainingData.modelType || ModelType.CLASSIFICATION),
        metrics
      ])
      
      toast.loading('Submitting training for verification...', { id: 'submit' })
      toast.success('Training submitted for verification!', { id: 'submit' })
      
      await fetchTrainerSessions()
      
      return { hash }
    } catch (err) {
      console.error('Error submitting training:', err)
      toast.error(err.message || 'Training submission failed', { id: 'submit' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getVerificationContract])

  // Get verification result from Tellor oracle
  const getVerificationResult = useCallback(async (trainingId) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getVerificationContract()
      
      const hash = await contract.write.getVerificationResult([BigInt(trainingId)])
      
      toast.loading('Requesting verification result...', { id: 'verify' })
      toast.success('Verification result requested!', { id: 'verify' })
      
      await fetchTrainerSessions()
      
      return { hash }
    } catch (err) {
      console.error('Error getting verification result:', err)
      toast.error(err.message || 'Verification request failed', { id: 'verify' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getVerificationContract])

  // Submit challenge to a verified training session
  const submitChallenge = useCallback(async (trainingId, reason) => {
    if (!isConnected || !isCorrectChain) {
      throw new Error('Wallet not connected or wrong network')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contract = getVerificationContract()
      
      const hash = await contract.write.submitChallenge([
        BigInt(trainingId),
        reason
      ])
      
      toast.loading('Submitting challenge...', { id: 'challenge' })
      toast.success('Challenge submitted successfully!', { id: 'challenge' })
      
      await fetchTrainerSessions()
      
      return { hash }
    } catch (err) {
      console.error('Error submitting challenge:', err)
      toast.error(err.message || 'Challenge submission failed', { id: 'challenge' })
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, getVerificationContract])

  // Fetch user's training sessions
  const fetchTrainerSessions = useCallback(async (trainerAddress = address) => {
    if (!trainerAddress) return []

    try {
      const contract = getVerificationReadOnly()
      const sessionIds = await contract.read.getTrainerSessions([trainerAddress])
      const sessionList = []

      for (const sessionId of sessionIds) {
        try {
          const session = await contract.read.getTrainingSession([sessionId])
          sessionList.push({
            id: Number(session.id),
            trainer: session.trainer,
            datasetId: Number(session.datasetId),
            modelHash: session.modelHash,
            datasetHash: session.datasetHash,
            modelType: Number(session.modelType),
            metrics: {
              accuracy: Number(session.metrics.accuracy),
              precision: Number(session.metrics.precision),
              recall: Number(session.metrics.recall),
              f1Score: Number(session.metrics.f1Score),
              confidence: Number(session.metrics.confidence),
              customMetrics: session.metrics.customMetrics
            },
            status: Number(session.status),
            stakeAmount: formatEther(session.stakeAmount),
            submissionTime: Number(session.submissionTime),
            verificationTime: Number(session.verificationTime),
            tellorQueryId: session.tellorQueryId,
            hasReward: session.hasReward
          })
        } catch (err) {
          console.error(`Error fetching session ${sessionId}:`, err)
        }
      }

      setTrainingSessions(sessionList)
      return sessionList
    } catch (err) {
      console.error('Error fetching training sessions:', err)
      setError(err.message)
      return []
    }
  }, [address, getVerificationReadOnly])

  // Get training session by ID
  const getTrainingSession = useCallback(async (trainingId) => {
    try {
      const contract = getVerificationReadOnly()
      const session = await contract.read.getTrainingSession([BigInt(trainingId)])
      
      return {
        id: Number(session.id),
        trainer: session.trainer,
        datasetId: Number(session.datasetId),
        modelHash: session.modelHash,
        datasetHash: session.datasetHash,
        modelType: Number(session.modelType),
        metrics: {
          accuracy: Number(session.metrics.accuracy),
          precision: Number(session.metrics.precision),
          recall: Number(session.metrics.recall),
          f1Score: Number(session.metrics.f1Score),
          confidence: Number(session.metrics.confidence),
          customMetrics: session.metrics.customMetrics
        },
        status: Number(session.status),
        stakeAmount: formatEther(session.stakeAmount),
        submissionTime: Number(session.submissionTime),
        verificationTime: Number(session.verificationTime),
        tellorQueryId: session.tellorQueryId,
        hasReward: session.hasReward
      }
    } catch (err) {
      console.error('Error getting training session:', err)
      return null
    }
  }, [getVerificationReadOnly])

  // Get verified training sessions for a dataset
  const getVerifiedTrainingSessions = useCallback(async (datasetId) => {
    try {
      const contract = getVerificationReadOnly()
      const sessionIds = await contract.read.getVerifiedTrainingSessions([BigInt(datasetId)])
      const sessionList = []

      for (const sessionId of sessionIds) {
        try {
          const session = await getTrainingSession(Number(sessionId))
          if (session) {
            sessionList.push(session)
          }
        } catch (err) {
          console.error(`Error fetching verified session ${sessionId}:`, err)
        }
      }

      return sessionList
    } catch (err) {
      console.error('Error fetching verified sessions:', err)
      return []
    }
  }, [getVerificationReadOnly, getTrainingSession])

  // Get dataset performance statistics
  const getDatasetPerformanceStats = useCallback(async (datasetId) => {
    try {
      const contract = getVerificationReadOnly()
      const stats = await contract.read.getDatasetPerformanceStats([BigInt(datasetId)])
      
      return {
        avgAccuracy: Number(stats[0]),
        avgPrecision: Number(stats[1]),
        avgRecall: Number(stats[2]),
        avgF1Score: Number(stats[3]),
        sessionCount: Number(stats[4])
      }
    } catch (err) {
      console.error('Error getting dataset performance stats:', err)
      return {
        avgAccuracy: 0,
        avgPrecision: 0,
        avgRecall: 0,
        avgF1Score: 0,
        sessionCount: 0
      }
    }
  }, [getVerificationReadOnly])

  // Helper function to get status text
  const getStatusText = useCallback((status) => {
    switch (status) {
      case VerificationStatus.PENDING: return 'Pending'
      case VerificationStatus.VERIFIED: return 'Verified'
      case VerificationStatus.FAILED: return 'Failed'
      case VerificationStatus.DISPUTED: return 'Disputed'
      case VerificationStatus.CANCELLED: return 'Cancelled'
      default: return 'Unknown'
    }
  }, [])

  // Helper function to get model type text
  const getModelTypeText = useCallback((modelType) => {
    switch (modelType) {
      case ModelType.CLASSIFICATION: return 'Classification'
      case ModelType.REGRESSION: return 'Regression'
      case ModelType.NLP: return 'NLP'
      case ModelType.COMPUTER_VISION: return 'Computer Vision'
      case ModelType.REINFORCEMENT_LEARNING: return 'Reinforcement Learning'
      case ModelType.GENERATIVE: return 'Generative'
      case ModelType.MULTIMODAL: return 'Multimodal'
      default: return 'Unknown'
    }
  }, [])

  // Auto-fetch data when account/network changes
  useEffect(() => {
    if (address && isConnected && isCorrectChain) {
      fetchTrainerSessions()
    }
  }, [address, isConnected, isCorrectChain, fetchTrainerSessions])

  return {
    // State
    trainingSessions,
    challenges,
    isLoading,
    error,

    // Constants
    VerificationStatus,
    ModelType,

    // Functions
    submitTraining,
    getVerificationResult,
    submitChallenge,
    fetchTrainerSessions,
    getTrainingSession,
    getVerifiedTrainingSessions,
    getDatasetPerformanceStats,

    // Helper functions
    getStatusText,
    getModelTypeText,
    getSessionById: (id) => trainingSessions.find(s => s.id === Number(id)),
    getVerifiedSessions: () => trainingSessions.filter(s => s.status === VerificationStatus.VERIFIED),
    getPendingSessions: () => trainingSessions.filter(s => s.status === VerificationStatus.PENDING),
    getFailedSessions: () => trainingSessions.filter(s => s.status === VerificationStatus.FAILED),
    getDisputedSessions: () => trainingSessions.filter(s => s.status === VerificationStatus.DISPUTED)
  }
} 