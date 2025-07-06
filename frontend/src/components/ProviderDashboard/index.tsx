"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
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
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [providerStatus, setProviderStatus] = useState({ isProvider: false, stake: '0' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Computer Vision',
    ipfsHash: '',
    filecoinDealId: ''
  });

  // Contract hooks
  const {
    datasets: contractDatasets,
    stakeAsProvider,
    listDataset,
    getUserDatasets,
    getProviderStatus,
    isLoading: marketplaceLoading,
    error: marketplaceError
  } = useMarketplace();

  const {
    balance: usdcBalance,
    approve,
    isLoading: usdcLoading
  } = useUSDFC();

  const {
    escrows,
    subscriptions,
    isLoading: paymentsLoading
  } = usePayments();

  // Fetch provider status on mount and when address changes
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

  // Load provider data
  useEffect(() => {
    const loadProviderData = async () => {
      if (!isConnected || !address) return;
      
      setLoading(true);
      try {
        // Data is automatically loaded via useEffect in useMarketplace
        console.log('Provider data loaded');
      } catch (error) {
        console.error('Failed to load provider data:', error);
        toast.error('Failed to load provider data');
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [isConnected, address]);

  // Convert contract datasets to our interface
  useEffect(() => {
    if (contractDatasets && Array.isArray(contractDatasets) && address) {
      const userDatasets = contractDatasets.filter((dataset: any) => 
        dataset.provider?.toLowerCase() === address.toLowerCase()
      );
      
      const formattedDatasets: Dataset[] = userDatasets.map((dataset: any, index: number) => ({
        id: dataset.id || index,
        name: parseMetadata(dataset.metadataUri).name || `Dataset #${dataset.id}`,
        description: parseMetadata(dataset.metadataUri).description || 'AI training dataset',
        category: parseMetadata(dataset.metadataUri).category || 'Computer Vision',
        pricePerBatch: dataset.pricePerBatch || '0',
        totalSales: dataset.totalSales?.toString() || '0',
        downloadCount: Number(dataset.totalSales) || 0,
        rating: 4.5, // Mock rating
        filecoinDealId: dataset.filecoinDealId?.toString() || 'f0123456',
        ipfsHash: dataset.metadataUri || '',
        isActive: dataset.isActive,
        verificationStatus: 'verified' // Simplified for now
      }));
      
      setDatasets(formattedDatasets);
    }
  }, [contractDatasets, address]);

  const parseMetadata = (metadataUri: string) => {
    try {
      // Try to parse as JSON if it looks like one
      if (metadataUri.startsWith('{')) {
        return JSON.parse(metadataUri);
      }
      // Otherwise return default metadata
      return {
        name: 'AI Dataset',
        description: 'Training dataset for AI models',
        category: 'Computer Vision'
      };
    } catch {
      return {
        name: 'AI Dataset',
        description: 'Training dataset for AI models',
        category: 'Computer Vision'
      };
    }
  };

  // Calculate dashboard metrics
  const totalEscrowValue = (escrows as any[])?.filter((e: any) => e.status === 0).reduce((sum: number, e: any) => sum + parseFloat(e.amount || '0'), 0).toFixed(2) || '0.00';
  const monthlySubscriptionCost = (subscriptions as any[])?.filter((s: any) => s.status === 0).reduce((sum: number, s: any) => sum + parseFloat(s.amountPerPeriod || '0'), 0).toFixed(2) || '0.00';

  const handleStakeAsProvider = async () => {
    try {
      setLoading(true);
      await stakeAsProvider('100'); // Minimum stake amount
      toast.success('Successfully staked as provider!');
      // Refresh provider status
      if (address && getProviderStatus) {
        const status = await getProviderStatus(address);
        setProviderStatus(status);
      }
    } catch (error) {
      console.error('Staking failed:', error);
      toast.error('Staking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleListDataset = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.ipfsHash) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create metadata object
      const metadata = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        ipfsHash: formData.ipfsHash,
        filecoinDealId: formData.filecoinDealId || ''
      };

      await listDataset(
        JSON.stringify(metadata),
        formData.price,
        parseInt(formData.filecoinDealId) || 0
      );

      toast.success('Dataset listed successfully!');
      setShowUploadModal(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Computer Vision',
        ipfsHash: '',
        filecoinDealId: ''
      });
      
    } catch (error) {
      console.error('Dataset listing failed:', error);
      toast.error('Dataset listing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">✅ Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!isConnected) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access the Provider Dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || marketplaceLoading || paymentsLoading) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Check if user is staked as provider
  if (!providerStatus.isProvider) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto p-6", className)}>
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Become a Data Provider</h2>
            <p className="text-muted-foreground mb-6">
              Stake 100+ USDFC to become a verified data provider and start listing datasets
            </p>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Requirements:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Minimum 100 USDFC stake</li>
                <li>• Verified wallet address</li>
                <li>• Commitment to high-quality data</li>
              </ul>
              <p className="text-sm text-blue-700 mt-2">
                Current Balance: {parseFloat(usdcBalance || '0').toFixed(2)} USDFC
              </p>
            </div>
            <Button 
              className="vf-button-primary"
              onClick={handleStakeAsProvider}
              disabled={loading || parseFloat(usdcBalance || '0') < 100}
            >
              {loading ? 'Staking...' : '🚀 Stake 100 USDFC & Become Provider'}
            </Button>
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
          Provider Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your AI datasets and track earnings on VeriFlow
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datasets.reduce((total, dataset) => total + parseFloat(dataset.totalSales), 0).toFixed(2)} USDFC
            </div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEscrowValue} USDFC
            </div>
            <p className="text-xs text-muted-foreground">In escrow</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Subscriptions</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlySubscriptionCost} USDFC
            </div>
            <p className="text-xs text-muted-foreground">Recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="vf-card mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your datasets and marketplace presence</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button 
            className="vf-button-primary"
            onClick={() => setShowUploadModal(true)}
            disabled={loading}
          >
            📤 Upload New Dataset
          </Button>
          <Button variant="outline" disabled>
            📊 Analytics Dashboard
          </Button>
          <Button variant="outline" disabled>
            🔍 Verify Data Quality
          </Button>
          <Button variant="outline" disabled>
            💾 Create Filecoin Deal
          </Button>
        </CardContent>
      </Card>

      {/* Your Datasets */}
      <Card className="vf-card">
        <CardHeader>
          <CardTitle>Your Datasets</CardTitle>
          <CardDescription>
            Manage and track performance of your listed datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No datasets listed yet.</p>
              <Button 
                className="mt-4 vf-button-primary"
                onClick={() => setShowUploadModal(true)}
              >
                List Your First Dataset
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{dataset.name}</h3>
                          {getStatusBadge(dataset.verificationStatus)}
                          <Badge variant="outline">{dataset.category}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">{dataset.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Price per Batch</p>
                            <p className="font-semibold">{parseFloat(dataset.pricePerBatch).toFixed(2)} USDFC</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Sales</p>
                            <p className="font-semibold">{parseFloat(dataset.totalSales).toFixed(2)} USDFC</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Downloads</p>
                            <p className="font-semibold">{dataset.downloadCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-semibold">⭐ {dataset.rating}/5</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Filecoin Deal ID</p>
                            <p className="font-mono text-xs">{dataset.filecoinDealId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">IPFS Hash</p>
                            <p className="font-mono text-xs">{dataset.ipfsHash.slice(0, 20)}...</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="outline" disabled>
                          📝 Edit
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          📈 Analytics
                        </Button>
                        <Button 
                          size="sm" 
                          variant={dataset.isActive ? "destructive" : "default"}
                          disabled
                        >
                          {dataset.isActive ? '⏸️ Pause' : '▶️ Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Upload New Dataset</CardTitle>
              <CardDescription>
                Add a new AI training dataset to the VeriFlow marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dataset Name</label>
                <Input 
                  placeholder="Enter dataset name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input 
                  placeholder="Describe your dataset"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price per Batch (USDFC)</label>
                  <Input 
                    placeholder="25.00" 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Computer Vision</option>
                    <option>NLP</option>
                    <option>Time Series</option>
                    <option>Audio</option>
                    <option>Multimodal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">IPFS Hash</label>
                <Input 
                  placeholder="QmX1Y2Z3..."
                  value={formData.ipfsHash}
                  onChange={(e) => setFormData({ ...formData, ipfsHash: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Filecoin Deal ID (optional)</label>
                <Input 
                  placeholder="f0123456"
                  value={formData.filecoinDealId}
                  onChange={(e) => setFormData({ ...formData, filecoinDealId: e.target.value })}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your dataset will be listed on the marketplace immediately after upload.
                  Make sure all information is accurate.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1 vf-button-primary"
                  disabled={loading || marketplaceLoading}
                  onClick={handleListDataset}
                >
                  {loading || marketplaceLoading ? (
                    <>
                      <LoadingSpinner />
                      Uploading...
                    </>
                  ) : (
                    '📤 Upload Dataset'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={loading || marketplaceLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard; 