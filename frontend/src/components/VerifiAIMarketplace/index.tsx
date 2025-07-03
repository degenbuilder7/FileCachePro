"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import WalletConnect from '@/components/Header/components/WalletConnect';

interface Dataset {
  id: number;
  provider: string;
  metadataUri: string;
  pricePerBatch: bigint;
  filecoinDealId: number;
  isActive: boolean;
  totalSales: bigint;
}

interface VerifiAIMarketplaceProps {
  className?: string;
}

const VerifiAIMarketplace: React.FC<VerifiAIMarketplaceProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStake, setUserStake] = useState<bigint>(0n);

  // Contract interaction hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user stake
  const { data: stakeData } = useReadContract({
    address: '0x1234567890123456789012345678901234567890', // VeriFiAI Marketplace contract
    abi: [
      {
        inputs: [{ name: 'provider', type: 'address' }],
        name: 'providerStakes',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'providerStakes',
    args: [address],
  });

  useEffect(() => {
    if (stakeData) {
      setUserStake(stakeData as bigint);
    }
  }, [stakeData]);

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🔍' },
    { id: 'computer-vision', name: 'Computer Vision', icon: '👁️' },
    { id: 'nlp', name: 'Natural Language', icon: '💬' },
    { id: 'audio', name: 'Audio & Speech', icon: '🎵' },
    { id: 'multimodal', name: 'Multimodal', icon: '🔀' },
    { id: 'time-series', name: 'Time Series', icon: '📈' },
    { id: 'tabular', name: 'Tabular Data', icon: '📊' },
    { id: 'reinforcement', name: 'Reinforcement Learning', icon: '🎮' },
  ];

  const sampleDatasets: Dataset[] = [
    {
      id: 1,
      provider: '0x742d35Cc6634C0532925a3b8D0C0fB0e',
      metadataUri: 'QmX1Y2Z3...',
      pricePerBatch: parseEther('10'),
      filecoinDealId: 12345,
      isActive: true,
      totalSales: parseEther('150'),
    },
    {
      id: 2,
      provider: '0x742d35Cc6634C0532925a3b8D0C0fB0e',
      metadataUri: 'QmA4B5C6...',
      pricePerBatch: parseEther('25'),
      filecoinDealId: 67890,
      isActive: true,
      totalSales: parseEther('300'),
    },
  ];

  const handleStakeAsProvider = async () => {
    try {
      await writeContract({
        address: '0x1234567890123456789012345678901234567890',
        abi: [
          {
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'stakeAsProvider',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'stakeAsProvider',
        args: [parseEther('100')], // 100 USDFC stake
      });
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const handlePurchaseData = async (datasetId: number, batchCount: number) => {
    try {
      await writeContract({
        address: '0x1234567890123456789012345678901234567890',
        abi: [
          {
            inputs: [
              { name: 'datasetId', type: 'uint256' },
              { name: 'batchCount', type: 'uint256' }
            ],
            name: 'purchaseData',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'purchaseData',
        args: [BigInt(datasetId), BigInt(batchCount)],
      });
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const filteredDatasets = sampleDatasets.filter(dataset => {
    const matchesSearch = searchTerm === '' || 
      dataset.metadataUri.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      dataset.metadataUri.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access the VeriFlow AI Data Marketplace
            </p>
            <WalletConnect />
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
          VerifiAI Data Marketplace
        </h1>
        <p className="text-muted-foreground mt-2">
          First verifiable AI training data marketplace on Filecoin with cryptographic proofs and USDFC payments
        </p>
      </div>

      {/* Provider Status */}
      <Card className="vf-card mb-8">
        <CardHeader>
          <CardTitle>Provider Status</CardTitle>
          <CardDescription>
            Stake USDFC to become a verified data provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Stake</p>
              <p className="text-2xl font-bold">{formatEther(userStake)} USDFC</p>
            </div>
            <div className="flex gap-2">
              {userStake >= parseEther('100') ? (
                <Badge className="bg-green-100 text-green-800">Verified Provider</Badge>
              ) : (
                <Button 
                  onClick={handleStakeAsProvider}
                  disabled={isPending || isConfirming}
                  className="vf-button-primary"
                >
                  {isPending || isConfirming ? 'Staking...' : 'Stake 100 USDFC'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="vf-card mb-8">
        <CardHeader>
          <CardTitle>Discover AI Datasets</CardTitle>
          <CardDescription>
            Browse verified, high-quality training data with Filecoin storage guarantees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search datasets by name, provider, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button className="vf-button-primary">
              🔍 Search
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "vf-button-primary" : ""}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDatasets.map((dataset) => (
          <Card key={dataset.id} className="vf-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Dataset #{dataset.id}</CardTitle>
                  <CardDescription className="mt-1">
                    Provider: {dataset.provider.slice(0, 8)}...{dataset.provider.slice(-6)}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                  <Badge variant="outline">Filecoin Deal #{dataset.filecoinDealId}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">IPFS Hash</p>
                  <p className="font-mono text-sm">{dataset.metadataUri}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Price per Batch</p>
                    <p className="text-xl font-bold">{formatEther(dataset.pricePerBatch)} USDFC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="font-semibold">{formatEther(dataset.totalSales)} USDFC</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 vf-button-primary"
                    onClick={() => handlePurchaseData(dataset.id, 1)}
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? 'Purchasing...' : 'Purchase 1 Batch'}
                  </Button>
                  <Button variant="outline" size="sm">
                    📋 Details
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Stored on Filecoin with F3 Fast Finality
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <Card className="vf-card mt-8">
        <CardHeader>
          <CardTitle>🚀 VeriFlow Features</CardTitle>
          <CardDescription>
            Powered by Filecoin's cutting-edge infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                ⚡
              </div>
              <h3 className="font-semibold mb-2">F3 Fast Finality</h3>
              <p className="text-sm text-muted-foreground">
                450x faster transactions (minutes vs hours)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                💰
              </div>
              <h3 className="font-semibold mb-2">USDFC Payments</h3>
              <p className="text-sm text-muted-foreground">
                Stable payments with Filecoin's native stablecoin
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                🔐
              </div>
              <h3 className="font-semibold mb-2">Tellor Verification</h3>
              <p className="text-sm text-muted-foreground">
                AI model performance verified by oracles
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                📦
              </div>
              <h3 className="font-semibold mb-2">PDP Hot Storage</h3>
              <p className="text-sm text-muted-foreground">
                Proof of Data Possession for active ML datasets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifiAIMarketplace; 