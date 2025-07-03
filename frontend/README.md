# VerifiAI Frontend

This is the frontend application for VerifiAI - the first verifiable AI training data marketplace on Filecoin.

## 🚀 VerifiAI Features

- **AI Data Marketplace**: Browse and purchase verified AI training datasets
- **Provider Dashboard**: Manage datasets, earnings, and reputation
- **Verification System**: Submit AI models for cryptographic verification via Tellor oracles
- **WFIL Payments**: Seamless transactions using Wrapped FIL tokens
- **Real-time Updates**: Live marketplace statistics and transaction status

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: wagmi + viem for Filecoin interactions
- **State Management**: React hooks and context
- **Icons**: Lucide React icons

## 🔗 Filecoin Integration

- **Network**: Filecoin Calibration Testnet
- **RPC**: https://calibration.filfox.info/rpc/v1
- **Explorer**: https://calibration.filfox.info/en
- **Contracts**: VerifiAI smart contracts deployed on Calibration

## Getting Started

First, install dependencies:

```bash
bun install
# or
npm install
```

Then, run the development server:

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the VerifiAI marketplace.

## 🎯 Main Components

### VerifiAI Marketplace (`/src/components/VerifiAIMarketplace`)
- Dataset browsing and filtering
- WFIL payments integration
- Provider staking functionality

### Provider Dashboard (`/src/components/ProviderDashboard`)
- Dataset upload and management
- Earnings tracking
- Performance analytics

### Verification Dashboard (`/src/components/VerificationDashboard`)
- AI model training submission
- Tellor oracle verification
- Performance metrics tracking

## 🔧 Configuration

Update contract addresses in `/src/config/contracts.js` after deployment:

```javascript
export const FILECOIN_CALIBRATION_CONFIG = {
  contracts: {
    VerifiAIMarketplace: "0x...", // Update after deployment
    VerifiAIPayments: "0x...",    // Update after deployment
    // ...
  }
};
```

## 📱 Responsive Design

The VerifiAI frontend is fully responsive and optimized for:
- Desktop browsers
- Tablet devices  
- Mobile phones
- Web3 wallets (MetaMask, etc.)

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - utility-first CSS framework
- [wagmi Documentation](https://wagmi.sh/) - React hooks for Ethereum
- [Filecoin Documentation](https://docs.filecoin.io/) - Filecoin network guide

---

## 🏆 Protocol Labs Genesis Hackathon 2025

Built for the **Fresh Code Challenge - AI & Autonomous Infrastructure**

VerifiAI demonstrates the future of verifiable AI data markets on Filecoin with:
- F3 Fast Finality (450x faster transactions)
- Tellor Oracle verification
- WFIL stable payments
- Production-ready UI/UX
