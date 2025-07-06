"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useChainId } from 'wagmi';
import { filecoinCalibration } from 'wagmi/chains';
import { useContracts } from '../../hooks/useContracts';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useVerification } from '@/hooks/useVerification';
import { usePayments } from '@/hooks/usePayments';
import { useUSDFC } from '@/hooks/useUSDFC';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VerifiAIDashboardProps {
  className?: string;
}

const VerifiAIDashboard: React.FC<VerifiAIDashboardProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectChain = chainId === filecoinCalibration.id;
  
  const [contractStatus, setContractStatus] = useState({
    marketplace: 'Checking...',
    usdfc: 'Checking...',
    verification: 'Checking...',
    error: null as string | null
  });

  // Test contract access
  const { getReadOnlyContract } = useContracts();
  
  useEffect(() => {
    const testContracts = async () => {
      try {
        // Test VerifiAIMarketplace
        const marketplaceContract = getReadOnlyContract('VerifiAIMarketplace');
        setContractStatus(prev => ({ ...prev, marketplace: '✅ Connected' }));
        
        // Test USDFC
        const usdcContract = getReadOnlyContract('USDFC');
        setContractStatus(prev => ({ ...prev, usdfc: '✅ Connected' }));
        
        // Test VerifiAIVerification
        const verificationContract = getReadOnlyContract('VerifiAIVerification');
        setContractStatus(prev => ({ ...prev, verification: '✅ Connected' }));
        
      } catch (error) {
        console.error('Contract access error:', error);
        setContractStatus(prev => ({ 
          ...prev, 
          error: String(error),
          marketplace: '❌ Failed',
          usdfc: '❌ Failed',
          verification: '❌ Failed'
        }));
      }
    };

    if (isConnected && isCorrectChain) {
      testContracts();
    }
  }, [isConnected, isCorrectChain, getReadOnlyContract]);

  const {
    datasets,
    isLoading: marketplaceLoading,
    error: marketplaceError,
  } = useMarketplace();

  const { 
    balance, 
    formattedBalance,
    isLoading: usdcLoading 
  } = useUSDFC();

  const {
    trainingSessions,
    isLoading: verificationLoading,
    error: verificationError,
  } = useVerification();



  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access the VeriFlow AI Dashboard
            </p>
            <Button className="vf-button-primary">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Wrong Network</h2>
            <p className="text-muted-foreground mb-6">
              Please switch to Filecoin Calibration network to access the dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6 space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          VeriFlow AI Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your verifiable AI training data and model verification center
        </p>
      </div>

      {/* Contract Status (Debug Information) */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Contract Connection Status</CardTitle>
          <CardDescription>
            Real-time status of smart contract connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Marketplace:</span>
              <Badge variant="outline">{contractStatus.marketplace}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">USDFC:</span>
              <Badge variant="outline">{contractStatus.usdfc}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Verification:</span>
              <Badge variant="outline">{contractStatus.verification}</Badge>
            </div>
          </div>
          {contractStatus.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{contractStatus.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USDFC Balance</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usdcLoading ? <LoadingSpinner /> : formattedBalance}
            </div>
            <p className="text-xs text-muted-foreground">Filecoin stablecoin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Datasets</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketplaceLoading ? <LoadingSpinner /> : datasets.length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for training</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Sessions</CardTitle>
            <span className="text-2xl">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verificationLoading ? <LoadingSpinner /> : trainingSessions.length}
            </div>
            <p className="text-xs text-muted-foreground">AI model verifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <span className="text-2xl">🌐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Calibration</div>
            <p className="text-xs text-muted-foreground">Filecoin testnet</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🛒 Browse Marketplace</CardTitle>
            <CardDescription>
              Discover and purchase verified AI training datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full vf-button-primary">Explore Datasets</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📤 Provide Data</CardTitle>
            <CardDescription>
              Upload and monetize your AI training datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full vf-button-secondary">Become Provider</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔬 Verify Models</CardTitle>
            <CardDescription>
              Submit AI models for cryptographic verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full vf-button-tertiary">Start Verification</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Recent Activity</CardTitle>
          <CardDescription>
            Latest marketplace and verification activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketplaceError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">Marketplace Error: {marketplaceError}</p>
              </div>
            )}
            {verificationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">Verification Error: {verificationError}</p>
              </div>
            )}
            {!marketplaceError && !verificationError && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Activity feed will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifiAIDashboard; 