"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useChainId } from 'wagmi';
import { filecoinCalibration } from 'wagmi/chains';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useUSDFC } from '../../hooks/useUSDFC';
import LoadingSpinner from '../LoadingSpinner';
import DatasetCard from '../DatasetCard';

interface Dataset {
  id: number;
  provider: string;
  metadataUri: string;
  pricePerBatch: string;
  filecoinDealId: number;
  totalSales: number;
  isActive: boolean;
  createdAt: Date;
}

interface VerifiAIMarketplaceProps {
  className?: string;
}

const VerifiAIMarketplace: React.FC<VerifiAIMarketplaceProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectChain = chainId === filecoinCalibration.id;
  
  const {
    datasets,
    isLoading,
    error,
    purchaseData,
    getProviderStatus
  } = useMarketplace();
  
  const { formattedBalance } = useUSDFC();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [providerStatus, setProviderStatus] = useState({ isProvider: false, stake: '0' });

  // Categories for filtering
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

  // Fetch provider status
  useEffect(() => {
    const fetchProviderStatus = async () => {
      if (address && getProviderStatus) {
        try {
          const status = await getProviderStatus(address);
          setProviderStatus(status);
        } catch (error) {
          console.error('Error fetching provider status:', error);
        }
      }
    };

    fetchProviderStatus();
  }, [address, getProviderStatus]);

  // Filter and search datasets
  useEffect(() => {
    let filtered: Dataset[] = [...datasets];

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((dataset: Dataset) => 
        dataset.metadataUri.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((dataset: Dataset) => dataset.isActive);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a: Dataset, b: Dataset) => b.id - a.id);
        break;
      case 'oldest':
        filtered.sort((a: Dataset, b: Dataset) => a.id - b.id);
        break;
      case 'price-low':
        filtered.sort((a: Dataset, b: Dataset) => parseFloat(a.pricePerBatch) - parseFloat(b.pricePerBatch));
        break;
      case 'price-high':
        filtered.sort((a: Dataset, b: Dataset) => parseFloat(b.pricePerBatch) - parseFloat(a.pricePerBatch));
        break;
      case 'popular':
        filtered.sort((a: Dataset, b: Dataset) => b.totalSales - a.totalSales);
        break;
      default:
        break;
    }

    setFilteredDatasets(filtered);
  }, [datasets, searchQuery, selectedCategory, sortBy]);

  // Handle dataset purchase
  const handlePurchase = async (datasetId: number, batchCount: number = 1) => {
    if (!isConnected || !isCorrectChain) {
      alert('Please connect your wallet to the correct network');
      return;
    }

    setPurchasingId(datasetId);
    try {
      await purchaseData(datasetId, batchCount);
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasingId(null);
    }
  };

  // Get featured datasets (first 3 active datasets)
  const featuredDatasets = (datasets as any[]).filter((d: any) => d.isActive).slice(0, 3);

  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access the VeriFlow AI Data Marketplace
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
              Please switch to Filecoin Calibration network to access the marketplace
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6 space-y-8", className)}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          VeriFlow AI Data Marketplace
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The first verifiable AI training data marketplace on Filecoin with USDFC payments
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg px-4 py-2">
            <p className="text-sm text-muted-foreground">Total Datasets</p>
            <p className="text-2xl font-bold text-blue-600">{datasets.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2">
            <p className="text-sm text-muted-foreground">Your USDFC Balance</p>
            <p className="text-2xl font-bold text-green-600">{formattedBalance}</p>
          </div>
          <div className="bg-purple-50 rounded-lg px-4 py-2">
            <p className="text-sm text-muted-foreground">Your Stake</p>
            <p className="text-2xl font-bold text-purple-600">{providerStatus.stake} USDFC</p>
          </div>
          <div className="flex gap-2">
            {providerStatus.isProvider ? (
              <Badge className="bg-green-100 text-green-800">Verified Provider</Badge>
            ) : (
              <Badge variant="outline">Stake to become a provider</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Browse Datasets</CardTitle>
          <CardDescription>
            Discover and purchase verified AI training datasets stored on Filecoin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search datasets by provider, metadata URI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Datasets */}
      {featuredDatasets.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Featured Datasets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDatasets.map((dataset: any) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onPurchase={(datasetObj: any) => handlePurchase(datasetObj.id, 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Datasets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            All Datasets ({filteredDatasets.length})
          </h2>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
              Error: {error}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">Loading datasets...</span>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No datasets match your search
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or browse all datasets
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </Card>
        ) : (
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
                      <Badge variant="outline">Deal #{dataset.filecoinDealId}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">IPFS URI</p>
                      <p className="font-mono text-sm truncate">{dataset.metadataUri}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Price per Batch</p>
                        <p className="text-xl font-bold">{dataset.pricePerBatch} USDFC</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="font-semibold">{dataset.totalSales}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 vf-button-primary"
                        onClick={() => handlePurchase(dataset.id, 1)}
                        disabled={purchasingId === dataset.id}
                      >
                        {purchasingId === dataset.id ? 'Purchasing...' : 'Purchase 1 Batch'}
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
        )}
      </div>
    </div>
  );
};

export default VerifiAIMarketplace; 