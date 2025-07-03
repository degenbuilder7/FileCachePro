"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

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

  // Sample training sessions
  const sampleSessions: TrainingSession[] = [
    {
      id: 1,
      trainer: '0x742d35Cc6634C0532925a3b8D0C0fB0e',
      datasetId: 1,
      modelHash: 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T',
      datasetHash: 'QmA4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W',
      modelType: 'COMPUTER_VISION',
      status: 'verified',
      submissionTime: '2024-01-15T10:30:00Z',
      verificationTime: '2024-01-15T11:45:00Z',
      metrics: {
        accuracy: 94.5,
        precision: 92.1,
        recall: 96.8,
        f1Score: 94.4,
        confidence: 98.2,
      },
      stakeAmount: '100.0',
      tellorQueryId: '0x1234567890abcdef...',
    },
    {
      id: 2,
      trainer: '0x742d35Cc6634C0532925a3b8D0C0fB0e',
      datasetId: 2,
      modelHash: 'QmG0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C',
      datasetHash: 'QmC2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y',
      modelType: 'NLP',
      status: 'pending',
      submissionTime: '2024-01-16T14:20:00Z',
      metrics: {
        accuracy: 87.3,
        precision: 89.1,
        recall: 85.5,
        f1Score: 87.3,
        confidence: 91.7,
      },
      stakeAmount: '100.0',
    },
    {
      id: 3,
      trainer: '0x742d35Cc6634C0532925a3b8D0C0fB0e',
      datasetId: 3,
      modelHash: 'QmE4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A',
      datasetHash: 'QmY4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U',
      modelType: 'REINFORCEMENT_LEARNING',
      status: 'failed',
      submissionTime: '2024-01-14T09:15:00Z',
      verificationTime: '2024-01-14T10:30:00Z',
      metrics: {
        accuracy: 72.1,
        precision: 68.9,
        recall: 75.3,
        f1Score: 71.9,
        confidence: 76.4,
      },
      stakeAmount: '100.0',
      tellorQueryId: '0xabcdef1234567890...',
    },
  ];

  useEffect(() => {
    setTrainingSessions(sampleSessions);
  }, []);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmitTraining = async (
    datasetId: number,
    modelHash: string,
    datasetHash: string,
    modelType: string,
    metrics: any
  ) => {
    try {
      await writeContract({
        address: '0x1234567890123456789012345678901234567890', // VeriFlow Verification contract
        abi: [
          {
            inputs: [
              { name: 'datasetId', type: 'uint256' },
              { name: 'modelHash', type: 'string' },
              { name: 'datasetHash', type: 'string' },
              { name: 'modelType', type: 'uint8' },
              { 
                name: 'metrics', 
                type: 'tuple',
                components: [
                  { name: 'accuracy', type: 'uint256' },
                  { name: 'precision', type: 'uint256' },
                  { name: 'recall', type: 'uint256' },
                  { name: 'f1Score', type: 'uint256' },
                  { name: 'confidence', type: 'uint256' },
                  { name: 'customMetrics', type: 'string' },
                ]
              }
            ],
            name: 'submitTraining',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'submitTraining',
        args: [
          BigInt(datasetId),
          modelHash,
          datasetHash,
          0, // ModelType enum
          [
            BigInt(Math.floor(metrics.accuracy * 100)),
            BigInt(Math.floor(metrics.precision * 100)),
            BigInt(Math.floor(metrics.recall * 100)),
            BigInt(Math.floor(metrics.f1Score * 100)),
            BigInt(Math.floor(metrics.confidence * 100)),
            JSON.stringify(metrics),
          ],
        ],
      });
    } catch (error) {
      console.error('Training submission failed:', error);
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
            <p className="text-xs text-muted-foreground">+2 this week</p>
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
              {Math.round((trainingSessions.filter(s => s.status === 'verified').length / trainingSessions.length) * 100)}% success rate
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
            <CardTitle className="text-sm font-medium">Total Stake</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingSessions.reduce((sum, s) => sum + parseFloat(s.stakeAmount), 0)} USDFC
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-lg font-semibold">{session.metrics.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precision</p>
                      <p className="text-lg font-semibold">{session.metrics.precision}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recall</p>
                      <p className="text-lg font-semibold">{session.metrics.recall}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">F1 Score</p>
                      <p className="text-lg font-semibold">{session.metrics.f1Score}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-semibold">{session.metrics.confidence}%</p>
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
                  <Input placeholder="1" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium">Model Type</label>
                  <select className="w-full p-2 border rounded">
                    <option value="0">Computer Vision</option>
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
                <Input placeholder="QmX1Y2Z3..." />
              </div>
              
              <div>
                <label className="text-sm font-medium">Dataset IPFS Hash</label>
                <Input placeholder="QmA4B5C6..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Accuracy (%)</label>
                  <Input placeholder="94.5" type="number" step="0.1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Precision (%)</label>
                  <Input placeholder="92.1" type="number" step="0.1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Recall (%)</label>
                  <Input placeholder="96.8" type="number" step="0.1" />
                </div>
                <div>
                  <label className="text-sm font-medium">F1 Score (%)</label>
                  <Input placeholder="94.4" type="number" step="0.1" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Confidence (%)</label>
                <Input placeholder="98.2" type="number" step="0.1" />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Submitting requires a 100 USDFC stake. Your model will be verified by Tellor oracles within 15 minutes.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1 vf-button-primary"
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? 'Submitting...' : '🚀 Submit (100 USDFC)'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubmitModal(false)}
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
                      <span className="font-semibold">{selectedSession.metrics.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precision:</span>
                      <span className="font-semibold">{selectedSession.metrics.precision}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recall:</span>
                      <span className="font-semibold">{selectedSession.metrics.recall}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">F1 Score:</span>
                      <span className="font-semibold">{selectedSession.metrics.f1Score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-semibold">{selectedSession.metrics.confidence}%</span>
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

              <div className="flex justify-end">
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