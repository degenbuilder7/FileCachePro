"use client";

import { useState } from "react";
import { useUser } from "@/context/userContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VerifiAIMarketplace from "@/components/VerifiAIMarketplace";
import ProviderDashboard from "@/components/ProviderDashboard";
import VerificationDashboard from "@/components/VerificationDashboard";
import VerifiAIDashboard from "@/components/VerifiAIDashboard";
import WalletConnect from "@/components/Header/components/WalletConnect";

export default function Home() {
  const { user, handleChangeRole, handleChangeUser } = useUser();
  const { role, roleChoose } = user;
  const [activeSection, setActiveSection] = useState('marketplace');

  // If user has chosen a role, show the appropriate dashboard
  if (roleChoose) {
    const sections = [
      { id: 'marketplace', name: '🏪 Marketplace', component: VerifiAIMarketplace },
      { id: 'dashboard', name: '📊 Dashboard', component: VerifiAIDashboard },
      { id: 'provider', name: '📤 Provider Hub', component: ProviderDashboard },
      { id: 'verification', name: '🔬 AI Verification', component: VerificationDashboard },
    ];

    const ActiveComponent = sections.find(s => s.id === activeSection)?.component || VerifiAIMarketplace;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Navigation */}
        <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold vf-gradient-primary bg-clip-text text-transparent">
                  VerifiAI
                </h1>
                <div className="flex gap-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      onClick={() => setActiveSection(section.id)}
                      className={activeSection === section.id ? "vf-button-primary" : ""}
                    >
                      {section.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {role === 'user' ? '👤 AI Developer' : '⛏️ Data Provider'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    handleChangeUser('roleChoose', false);
                    setActiveSection('marketplace');
                  }}
                >
                  🏠 Back to Home
                </Button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-8">
          <ActiveComponent />
        </main>
      </div>
    );
  }

  // Landing page for new users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">
              <span className="vf-gradient-primary bg-clip-text text-transparent">
                VerifiAI
              </span>
            </h1>
            <p className="text-2xl text-gray-600 mb-4">
              Verifiable AI Training Data Marketplace
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              The first marketplace for verifiable AI training data on Filecoin. 
              Trade with cryptographic proofs, USDFC payments, and F3 fast finality.
            </p>
            
            <div className="flex justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="vf-button-primary text-lg px-8 py-4"
                onClick={() => {
                  // Set user as AI Developer and redirect to marketplace
                  handleChangeRole('user');
                  setActiveSection('marketplace');
                }}
              >
                🚀 Explore Marketplace
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4"
                onClick={() => {
                  // Scroll to features section
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                📖 Learn More
              </Button>
            </div>

            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-blue-100 px-6 py-3 rounded-full border">
              <span className="text-2xl">🏆</span>
              <span className="font-semibold text-purple-800">
                Protocol Labs Genesis Hackathon 2025 • Fresh Code Challenge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Transforming the <span className="vf-gradient-primary bg-clip-text text-transparent">$9 Trillion AI Market</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              VerifiAI brings cryptographic verification, autonomous payments, and decentralized storage 
              to AI training data markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="vf-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚡</span>
                </div>
                <CardTitle>F3 Fast Finality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  450x faster transaction finality. Minutes instead of hours for real-time AI data trading.
                </p>
              </CardContent>
            </Card>

            <Card className="vf-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <CardTitle>USDFC Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Stable, efficient payments with Filecoin's native stablecoin. No volatility, just value.
                </p>
              </CardContent>
            </Card>

            <Card className="vf-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <CardTitle>Tellor Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI model performance verified by decentralized oracles. Cryptographic proof of training.
                </p>
              </CardContent>
            </Card>

            <Card className="vf-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📦</span>
                </div>
                <CardTitle>PDP Hot Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Proof of Data Possession ensures your ML datasets are always available and verifiable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">$9T</div>
              <div className="text-blue-100">Global AI Market Size</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">450x</div>
              <div className="text-blue-100">Faster with F3 Finality</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Verifiable Training Data</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Autonomous Marketplace</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the <span className="vf-gradient-primary bg-clip-text text-transparent">AI Revolution</span>?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you're an AI developer seeking quality data or a data provider looking to monetize your datasets, 
            VerifiAI has you covered.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="vf-card text-center p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-2xl font-bold mb-4">AI Developer</h3>
              <p className="text-gray-600 mb-6">
                Access verified, high-quality training data with cryptographic guarantees
              </p>
              <Button 
                className="w-full vf-button-primary"
                onClick={() => {
                  // Set user as AI Developer and redirect to marketplace
                  handleChangeRole('user');
                  setActiveSection('marketplace');
                }}
              >
                Start Building AI Models
              </Button>
            </Card>

            <Card className="vf-card text-center p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-6xl mb-4">⛏️</div>
              <h3 className="text-2xl font-bold mb-4">Data Provider</h3>
              <p className="text-gray-600 mb-6">
                Monetize your datasets with verifiable quality metrics and autonomous payments
              </p>
              <Button 
                className="w-full vf-button-primary"
                onClick={() => {
                  // Set user as Data Provider and redirect to provider dashboard
                  handleChangeRole('provider');
                  setActiveSection('provider');
                }}
              >
                Start Earning from Data
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 vf-gradient-primary bg-clip-text text-transparent">
                VerifiAI
              </h3>
              <p className="text-gray-400">
                Verifiable AI training data marketplace built on Filecoin for the Protocol Labs Genesis Hackathon 2025.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Browse Datasets</li>
                <li>Provider Dashboard</li>
                <li>AI Verification</li>
                <li>USDFC Payments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Filecoin Network</li>
                <li>F3 Fast Finality</li>
                <li>Tellor Oracles</li>
                <li>IPFS Storage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>GitHub</li>
                <li>Discord</li>
                <li>Documentation</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VerifiAI. Built for Protocol Labs Genesis Hackathon 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
