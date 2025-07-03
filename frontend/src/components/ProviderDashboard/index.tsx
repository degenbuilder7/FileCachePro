"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [earnings, setEarnings] = useState({
    total: '2,450.75',
    thisMonth: '485.20',
    pending: '125.50',
  });

  // Sample datasets
  const sampleDatasets: Dataset[] = [
    {
      id: 1,
      name: "High-Resolution Medical Images",
      description: "Curated collection of medical imaging data for computer vision models",
      category: "Computer Vision",
      pricePerBatch: "25.00",
      totalSales: "750.00",
      downloadCount: 30,
      rating: 4.8,
      filecoinDealId: "f0123456",
      ipfsHash: "QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T",
      isActive: true,
      verificationStatus: 'verified',
    },
    {
      id: 2,
      name: "Financial Time Series Dataset",
      description: "Stock market and cryptocurrency price data with technical indicators",
      category: "Time Series",
      pricePerBatch: "15.00",
      totalSales: "450.00",
      downloadCount: 30,
      rating: 4.6,
      filecoinDealId: "f0789012",
      ipfsHash: "QmA4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W",
      isActive: true,
      verificationStatus: 'verified',
    },
    {
      id: 3,
      name: "Multilingual Text Corpus",
      description: "Large-scale text dataset for NLP training in 15 languages",
      category: "NLP",
      pricePerBatch: "35.00",
      totalSales: "1,050.00",
      downloadCount: 30,
      rating: 4.9,
      filecoinDealId: "f0345678",
      ipfsHash: "QmG0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C",
      isActive: true,
      verificationStatus: 'pending',
    },
  ];

  useEffect(() => {
    setDatasets(sampleDatasets);
  }, []);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleListDataset = async (metadataUri: string, pricePerBatch: string, filecoinDealId: string) => {
    try {
      await writeContract({
        address: '0x1234567890123456789012345678901234567890', // VeriFlow Marketplace contract
        abi: [
          {
            inputs: [
              { name: 'metadataUri', type: 'string' },
              { name: 'pricePerBatch', type: 'uint256' },
              { name: 'filecoinDealId', type: 'uint64' }
            ],
            name: 'listDataset',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'listDataset',
        args: [metadataUri, parseEther(pricePerBatch), BigInt(filecoinDealId)],
      });
    } catch (error) {
      console.error('Listing failed:', error);
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
            <div className="text-2xl font-bold">{earnings.total} USDFC</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.thisMonth} USDFC</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="vf-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.pending} USDFC</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
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
          >
            📤 Upload New Dataset
          </Button>
          <Button variant="outline">
            📊 Analytics Dashboard
          </Button>
          <Button variant="outline">
            🔍 Verify Data Quality
          </Button>
          <Button variant="outline">
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
                          <p className="font-semibold">{dataset.pricePerBatch} USDFC</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Sales</p>
                          <p className="font-semibold">{dataset.totalSales} USDFC</p>
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
                      <Button size="sm" variant="outline">
                        📝 Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        📈 Analytics
                      </Button>
                      <Button 
                        size="sm" 
                        variant={dataset.isActive ? "destructive" : "default"}
                      >
                        {dataset.isActive ? '⏸️ Pause' : '▶️ Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal Placeholder */}
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
                <Input placeholder="Enter dataset name" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Describe your dataset" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price per Batch (USDFC)</label>
                  <Input placeholder="25.00" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full p-2 border rounded">
                    <option>Computer Vision</option>
                    <option>NLP</option>
                    <option>Time Series</option>
                    <option>Audio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">IPFS Hash</label>
                <Input placeholder="QmX1Y2Z3..." />
              </div>
              <div>
                <label className="text-sm font-medium">Filecoin Deal ID (optional)</label>
                <Input placeholder="f0123456" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1 vf-button-primary"
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? 'Uploading...' : '📤 Upload Dataset'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadModal(false)}
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