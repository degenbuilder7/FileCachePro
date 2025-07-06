"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useChainId } from 'wagmi';
import { filecoinCalibration } from 'wagmi/chains';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useUSDFC } from '@/hooks/useUSDFC';
import { usePayments } from '@/hooks/usePayments';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProviderDashboardProps {
  className?: string;
}

interface Dataset {
  id: number;
  name: string;
  description: string;
  category: string;
  pricePerBatch: string;
  totalSales: string;
  downloadCount: number;
  rating: number;
  filecoinDealId: string;
  ipfsHash: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectChain = chainId === filecoinCalibration.id;

  const {
    datasets,
    isLoading: marketplaceLoading,
    listDataset,
    stakeAsProvider,
    getProviderStatus
  } = useMarketplace();

  const { 
    formattedBalance, 
    mintWithCollateral, 
    isLoading: usdcLoading 
  } = useUSDFC();

  const {
    escrows,
    subscriptions,
    isLoading: paymentsLoading
  } = usePayments();

  // State
  const [providerStatus, setProviderStatus] = useState({ isProvider: false, stake: '0' });
  const [mintingUSDFC, setMintingUSDFC] = useState(false);
  const [stakingProvider, setStakingProvider] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [listingDataset, setListingDataset] = useState(false);
  const [newDataset, setNewDataset] = useState({
    metadataUri: '',
    pricePerBatch: '',
    filecoinDealId: ''
  });

  // Fetch provider status
  useEffect(() => {
    const fetchProviderStatus = async () => {
      if (address && getProviderStatus) {
        try {
          const status = await getProviderStatus(address);
          setProviderStatus(status);
        } catch (error) {
          // console.error('Error fetching provider status:', error);
        }
      }
    };

    fetchProviderStatus();
  }, [address, getProviderStatus]);

  // Handle USDFC minting
  const handleMintUSDFC = async () => {
    if (!isConnected || !isCorrectChain) {
      alert('Please connect your wallet to the correct network');
      return;
    }

    setMintingUSDFC(true);
    try {
      await mintWithCollateral('0.1');
      alert('Successfully minted 100 USDFC!');
    } catch (err) {
      // console.error('Minting failed:', err);
      alert('Minting failed. Please try again.');
    } finally {
      setMintingUSDFC(false);
    }
  };

  // Handle staking to become a provider
  const handleStakeProvider = async () => {
    if (!isConnected || !isCorrectChain) {
      alert('Please connect your wallet to the correct network');
      return;
    }

    if (parseFloat(formattedBalance) < 100) {
      alert('You need at least 100 USDFC to stake as a provider.');
      return;
    }

    setStakingProvider(true);
    try {
      await stakeAsProvider(100);
      alert('Successfully staked as provider!');
      
      // Refresh provider status
      if (address && getProviderStatus) {
        const status = await getProviderStatus(address);
        setProviderStatus(status);
      }
    } catch (err) {
      console.error('Staking failed:', err);
      alert('Staking failed. Please try again.');
    } finally {
      setStakingProvider(false);
    }
  };

  // Handle dataset listing
  const handleListDataset = async () => {
    if (!newDataset.metadataUri || !newDataset.pricePerBatch) {
      alert('Please fill in all required fields');
      return;
    }

    setListingDataset(true);
    try {
      await listDataset(
        newDataset.metadataUri,
        parseFloat(newDataset.pricePerBatch),
        parseInt(newDataset.filecoinDealId) || 0
      );
      alert('Dataset listed successfully!');
      setShowListForm(false);
      setNewDataset({ metadataUri: '', pricePerBatch: '', filecoinDealId: '' });
    } catch (err) {
      // console.error('Dataset listing failed:', err);
      alert('Dataset listing failed. Please try again.');
    } finally {
      setListingDataset(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access the Provider Dashboard
            </p>
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
              Please switch to Filecoin Calibration network
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userDatasets = datasets.filter((dataset: any) => 
    dataset.provider.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6 space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Provider Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your AI datasets and earnings on the VeriFlow marketplace
        </p>
      </div>

      {/* Provider Status & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">USDFC Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-4">
              {formattedBalance}
            </div>
            <Button 
              onClick={handleMintUSDFC}
              disabled={mintingUSDFC || usdcLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {mintingUSDFC ? 'Minting...' : '💰 Mint 100 USDFC'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              {providerStatus.isProvider ? (
                <Badge className="bg-green-100 text-green-800 text-lg p-2">
                  ✅ Verified Provider
                </Badge>
              ) : (
                <Badge variant="outline" className="text-lg p-2">
                  Not a Provider
                </Badge>
              )}
            </div>
            {!providerStatus.isProvider && (
              <Button 
                onClick={handleStakeProvider}
                disabled={stakingProvider || parseFloat(formattedBalance) < 100}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {stakingProvider ? 'Staking...' : '🎯 Stake 100 USDFC'}
              </Button>
            )}
            {providerStatus.isProvider && (
              <div className="text-sm text-muted-foreground">
                Stake: {providerStatus.stake} USDFC
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {userDatasets.length}
            </div>
            {providerStatus.isProvider && (
              <Button 
                onClick={() => setShowListForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                📤 List New Dataset
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dataset Listing Form */}
      {showListForm && providerStatus.isProvider && (
        <Card>
          <CardHeader>
            <CardTitle>List New AI Dataset</CardTitle>
            <CardDescription>
              Add your AI training dataset to the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Metadata URI (IPFS)</label>
                <Input
                  placeholder="ipfs://QmYourMetadataHash"
                  value={newDataset.metadataUri}
                  onChange={(e) => setNewDataset(prev => ({ ...prev, metadataUri: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per Batch (USDFC)</label>
                <Input
                  type="number"
                  placeholder="10.0"
                  value={newDataset.pricePerBatch}
                  onChange={(e) => setNewDataset(prev => ({ ...prev, pricePerBatch: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filecoin Deal ID (Optional)</label>
                <Input
                  type="number"
                  placeholder="123456"
                  value={newDataset.filecoinDealId}
                  onChange={(e) => setNewDataset(prev => ({ ...prev, filecoinDealId: e.target.value }))}
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={handleListDataset}
                  disabled={listingDataset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {listingDataset ? 'Listing...' : 'List Dataset'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowListForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Datasets */}
      {providerStatus.isProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Your Listed Datasets</CardTitle>
            <CardDescription>
              Manage and track your AI dataset listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {marketplaceLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : userDatasets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven't listed any datasets yet.
                </p>
                <Button 
                  onClick={() => setShowListForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📤 List Your First Dataset
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userDatasets.map((dataset: any) => (
                  <Card key={dataset.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">Dataset #{dataset.id}</h3>
                        <Badge variant={dataset.isActive ? "default" : "secondary"}>
                          {dataset.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 truncate">
                        {dataset.metadataUri}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium">{dataset.pricePerBatch} USDFC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Sales:</span>
                          <span className="font-medium">{dataset.totalSales} USDFC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deal ID:</span>
                          <span className="font-medium">#{dataset.filecoinDealId}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Getting Started for Non-Providers */}
      {!providerStatus.isProvider && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle>🚀 Become a Data Provider</CardTitle>
            <CardDescription>
              Start earning by providing AI training datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Minimum 100 USDFC stake</li>
                    <li>• Valid AI training datasets</li>
                    <li>• IPFS metadata storage</li>
                    <li>• Filecoin storage deals</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Earn USDFC from dataset sales</li>
                    <li>• Verified provider badge</li>
                    <li>• Priority marketplace listing</li>
                    <li>• Community recognition</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProviderDashboard; 