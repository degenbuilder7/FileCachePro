"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useVerification } from '@/hooks/useVerification';
import { useUSDFC } from '@/hooks/useUSDFC';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VerificationDashboardProps {
  className?: string;
}

interface TrainingSession {
  id: number;
  trainer: string;
  datasetId: number;
  modelHash: string;
  datasetHash: string;
  modelType: string;
  status: 'pending' | 'verified' | 'failed' | 'disputed';
  submissionTime: string;
  verificationTime?: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confidence: number;
  };
  stakeAmount: string;
  tellorQueryId?: string;
}

const VerificationDashboard: React.FC<VerificationDashboardProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state for submission
  const [formData, setFormData] = useState({
    datasetId: '',
    modelType: '0',
    modelHash: '',
    datasetHash: '',
    accuracy: '',
    precision: '',
    recall: '',
    f1Score: '',
    confidence: ''
  });

  // Contract hooks
  const {
    getTrainingSession,
    fetchTrainerSessions,
    submitTraining,
    submitChallenge,
    isLoading: verificationLoading,
    error: verificationError,
    trainingSessions: contractSessions
  } = useVerification();

  const {
    balance: usdcBalance,
    approve,
    isLoading: usdcLoading
  } = useUSDFC();

  // Load training sessions from contract
  useEffect(() => {
    const loadTrainingSessions = async () => {
      if (!isConnected || !address) return;
      
      setLoading(true);
      try {
        await fetchTrainerSessions(address);
      } catch (error) {
        console.error('Failed to load training sessions:', error);
        toast.error('Failed to load training sessions');
      } finally {
        setLoading(false);
      }
    };

    loadTrainingSessions();
  }, [isConnected, address, fetchTrainerSessions]);

  // Convert contract sessions to our interface when they change
  useEffect(() => {
    if (contractSessions && Array.isArray(contractSessions)) {
      const sessions: TrainingSession[] = contractSessions.map((session: any, index: number) => ({
        id: session.id || index,
        trainer: session.trainer || address || '',
        datasetId: Number(session.datasetId) || 0,
        modelHash: session.modelHash || '',
        datasetHash: session.trainingProof || `QmDataset${session.datasetId || index}`, // Use trainingProof as datasetHash
        modelType: getModelTypeName(0), // Default since not in contract
        status: getStatusFromCode(Number(session.status) || 0),
        submissionTime: session.submittedAt ? session.submittedAt.toISOString() : new Date().toISOString(),
        verificationTime: session.verifiedAt ? session.verifiedAt.toISOString() : undefined,
        metrics: parsePerformanceMetrics(session.performanceMetrics || '{}'),
        stakeAmount: session.stakeAmount || "100.0",
        tellorQueryId: undefined,
      }));
      
      setTrainingSessions(sessions);
    }
  }, [contractSessions, address]);

  const parsePerformanceMetrics = (metricsString: string) => {
    try {
      const parsed = JSON.parse(metricsString);
      return {
        accuracy: parsed.accuracy || 0,
        precision: parsed.precision || 0,
        recall: parsed.recall || 0,
        f1Score: parsed.f1Score || 0,
        confidence: parsed.confidence || 0,
      };
    } catch {
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        confidence: 0,
      };
    }
  };

  const getModelTypeName = (typeCode: number): string => {
    const types = ['CLASSIFICATION', 'REGRESSION', 'NLP', 'COMPUTER_VISION', 'REINFORCEMENT_LEARNING', 'GENERATIVE', 'MULTIMODAL'];
    return types[typeCode] || 'CLASSIFICATION';
  };

  const getStatusFromCode = (statusCode: number): 'pending' | 'verified' | 'failed' | 'disputed' => {
    switch (statusCode) {
      case 0: return 'pending';
      case 1: return 'verified';
      case 2: return 'disputed';
      default: return 'pending';
    }
  };

  const handleSubmitTraining = async () => {
    if (!formData.datasetId || !formData.modelHash || !formData.datasetHash) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare metrics as JSON string
      const performanceMetrics = JSON.stringify({
        accuracy: parseFloat(formData.accuracy || '0'),
        precision: parseFloat(formData.precision || '0'),
        recall: parseFloat(formData.recall || '0'),
        f1Score: parseFloat(formData.f1Score || '0'),
        confidence: parseFloat(formData.confidence || '0'),
      });

      await submitTraining({
        datasetId: formData.datasetId,
        modelHash: formData.modelHash,
        datasetHash: formData.datasetHash,
        modelType: parseInt(formData.modelType) || 0,
        metrics: {
          accuracy: parseFloat(formData.accuracy || '0'),
          precision: parseFloat(formData.precision || '0'),
          recall: parseFloat(formData.recall || '0'),
          f1Score: parseFloat(formData.f1Score || '0'),
          confidence: parseFloat(formData.confidence || '0'),
          customMetrics: ""
        }
      });

      toast.success('Training session submitted successfully!');
      setShowSubmitModal(false);
      setFormData({
        datasetId: '',
        modelType: '0',
        modelHash: '',
        datasetHash: '',
        accuracy: '',
        precision: '',
        recall: '',
        f1Score: '',
        confidence: ''
      });
      
    } catch (error) {
      console.error('Training submission failed:', error);
      toast.error('Training submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeTraining = async (sessionId: number) => {
    try {
      setLoading(true);
      await submitChallenge(sessionId, "Performance metrics appear inaccurate");
      toast.success('Challenge submitted successfully!');
    } catch (error) {
      console.error('Challenge failed:', error);
      toast.error('Challenge submission failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">✅ Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Oracle</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Verification Failed</Badge>;
      case 'disputed':
        return <Badge className="bg-purple-100 text-purple-800">⚖️ Disputed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPUTER_VISION':
        return '👁️';
      case 'NLP':
        return '💬';
      case 'REINFORCEMENT_LEARNING':
        return '🎮';
      case 'GENERATIVE':
        return '🎨';
      case 'MULTIMODAL':
        return '🔀';
      case 'CLASSIFICATION':
        return '📊';
      case 'REGRESSION':
        return '📈';
      default:
        return '🤖';
    }
  };

  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access AI Model Verification
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || verificationLoading) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold vf-gradient-primary bg-clip-text text-transparent">
          AI Model Verification
        </h1>
        <p className="text-muted-foreground mt-2">
          Submit AI training sessions for cryptographic verification using Tellor oracles
        </p>
      </div>

      {/* Verification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <span className="text-2xl">🔬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingSessions.length}</div>
            <p className="text-xs text-muted-foreground">Your submissions</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Models</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingSessions.filter(s => s.status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {trainingSessions.length > 0 
                ? Math.round((trainingSessions.filter(s => s.status === 'verified').length / trainingSessions.length) * 100)
                : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingSessions.filter(s => s.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting Tellor oracle</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USDFC Balance</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(usdcBalance || '0').toFixed(2)} USDFC
            </div>
            <p className="text-xs text-muted-foreground">100 USDFC per submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="vf-card mb-8">
        <CardHeader>
          <CardTitle>Submit New Training Session</CardTitle>
          <CardDescription>
            Submit your AI model training for verification with 100 USDFC stake
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="vf-button-primary"
            onClick={() => setShowSubmitModal(true)}
            disabled={loading || verificationLoading}
          >
            🚀 Submit Training Session
          </Button>
        </CardContent>
      </Card>

      {/* Training Sessions */}
      <Card className="vf-card">
        <CardHeader>
          <CardTitle>Your Training Sessions</CardTitle>
          <CardDescription>
            Track verification status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainingSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No training sessions submitted yet.</p>
              <Button 
                className="mt-4 vf-button-primary"
                onClick={() => setShowSubmitModal(true)}
              >
                Submit Your First Training Session
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {trainingSessions.map((session) => (
                <Card key={session.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getModelTypeIcon(session.modelType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">Training Session #{session.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.modelType.replace('_', ' ')} • Dataset #{session.datasetId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSession(session)}
                        >
                          📊 Details
                        </Button>
                        {session.status === 'verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChallengeTraining(session.id)}
                            disabled={loading}
                          >
                            ⚖️ Challenge
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-lg font-semibold">{session.metrics.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Precision</p>
                        <p className="text-lg font-semibold">{session.metrics.precision.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recall</p>
                        <p className="text-lg font-semibold">{session.metrics.recall.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">F1 Score</p>
                        <p className="text-lg font-semibold">{session.metrics.f1Score.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{session.metrics.confidence.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Model Hash</p>
                        <p className="font-mono text-xs">{session.modelHash.slice(0, 20)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submission Time</p>
                        <p>{new Date(session.submissionTime).toLocaleString()}</p>
                      </div>
                      {session.tellorQueryId && (
                        <div>
                          <p className="text-muted-foreground">Tellor Query ID</p>
                          <p className="font-mono text-xs">{session.tellorQueryId.slice(0, 20)}...</p>
                        </div>
                      )}
                      {session.verificationTime && (
                        <div>
                          <p className="text-muted-foreground">Verification Time</p>
                          <p>{new Date(session.verificationTime).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Verified by Tellor Oracle Network
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Training Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Submit Training Session</CardTitle>
              <CardDescription>
                Submit your AI model training for verification (requires 100 USDFC stake)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Dataset ID</label>
                  <Input 
                    placeholder="1" 
                    type="number"
                    value={formData.datasetId}
                    onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model Type</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={formData.modelType}
                    onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                  >
                    <option value="0">Classification</option>
                    <option value="1">Regression</option>
                    <option value="2">NLP</option>
                    <option value="3">Computer Vision</option>
                    <option value="4">Reinforcement Learning</option>
                    <option value="5">Generative</option>
                    <option value="6">Multimodal</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Model IPFS Hash</label>
                <Input 
                  placeholder="QmX1Y2Z3..."
                  value={formData.modelHash}
                  onChange={(e) => setFormData({ ...formData, modelHash: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Dataset IPFS Hash</label>
                <Input 
                  placeholder="QmA4B5C6..."
                  value={formData.datasetHash}
                  onChange={(e) => setFormData({ ...formData, datasetHash: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Accuracy (%)</label>
                  <Input 
                    placeholder="94.5" 
                    type="number" 
                    step="0.1"
                    value={formData.accuracy}
                    onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Precision (%)</label>
                  <Input 
                    placeholder="92.1" 
                    type="number" 
                    step="0.1"
                    value={formData.precision}
                    onChange={(e) => setFormData({ ...formData, precision: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Recall (%)</label>
                  <Input 
                    placeholder="96.8" 
                    type="number" 
                    step="0.1"
                    value={formData.recall}
                    onChange={(e) => setFormData({ ...formData, recall: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">F1 Score (%)</label>
                  <Input 
                    placeholder="94.4" 
                    type="number" 
                    step="0.1"
                    value={formData.f1Score}
                    onChange={(e) => setFormData({ ...formData, f1Score: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Confidence (%)</label>
                <Input 
                  placeholder="98.2" 
                  type="number" 
                  step="0.1"
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Submitting requires a 100 USDFC stake. Your model will be verified by Tellor oracles within 15 minutes.
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Current Balance: {parseFloat(usdcBalance || '0').toFixed(2)} USDFC
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1 vf-button-primary"
                  disabled={loading || verificationLoading || usdcLoading}
                  onClick={handleSubmitTraining}
                >
                  {loading || verificationLoading ? (
                    <>
                      <LoadingSpinner />
                      Submitting...
                    </>
                  ) : (
                    '🚀 Submit (100 USDFC)'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubmitModal(false)}
                  disabled={loading || verificationLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Training Session #{selectedSession.id} Details</CardTitle>
              <CardDescription>
                Complete verification information and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Session Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{getStatusBadge(selectedSession.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Type:</span>
                      <span>{selectedSession.modelType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dataset ID:</span>
                      <span>#{selectedSession.datasetId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stake Amount:</span>
                      <span>{selectedSession.stakeAmount} USDFC</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="font-semibold">{selectedSession.metrics.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precision:</span>
                      <span className="font-semibold">{selectedSession.metrics.precision.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recall:</span>
                      <span className="font-semibold">{selectedSession.metrics.recall.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">F1 Score:</span>
                      <span className="font-semibold">{selectedSession.metrics.f1Score.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-semibold">{selectedSession.metrics.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Hashes & Identifiers</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model Hash:</span>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">{selectedSession.modelHash}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dataset Hash:</span>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">{selectedSession.datasetHash}</p>
                  </div>
                  {selectedSession.tellorQueryId && (
                    <div>
                      <span className="text-muted-foreground">Tellor Query ID:</span>
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">{selectedSession.tellorQueryId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {selectedSession.status === 'verified' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleChallengeTraining(selectedSession.id)}
                    disabled={loading}
                  >
                    ⚖️ Challenge Result
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSession(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VerificationDashboard; 