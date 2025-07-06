"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { filecoinCalibration } from 'wagmi/chains'
import { useUSDFC } from '../../hooks/useUSDFC'
import { Button } from '../ui/button'
import styles from './index.module.css'

export default function Header() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const { balance, formattedBalance, mintWithCollateral } = useUSDFC()
  const [isMinting, setIsMinting] = useState(false)
  const [mintAmount, setMintAmount] = useState('1')

  // Check if on correct network (Filecoin Calibration)
  const isCorrectChain = chainId === filecoinCalibration.id

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      switchChain({ chainId: filecoinCalibration.id })
    } catch (err) {
      console.error('Network switch failed:', err)
    }
  }

  // Handle USDFC minting
  const handleMintUSDFC = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) return
    
    setIsMinting(true)
    try {
      await mintWithCollateral(mintAmount)
      setMintAmount('1')
    } catch (err) {
      console.error('Minting failed:', err)
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.svg"
              alt="VeriFlow"
              width={40}
              height={40}
              priority
            />
            <span className={styles.logoText}>VeriFlow</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <Link href="/" className={styles.navLink}>
            Marketplace
          </Link>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/verification" className={styles.navLink}>
            Verification
          </Link>
        </nav>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Network Status */}
          {isConnected && !isCorrectChain && (
            <div className={styles.networkSection}>
              <div className={styles.wrongNetwork}>
                <span className={styles.networkWarning}>Wrong Network</span>
                <Button
                  onClick={handleSwitchNetwork}
                  variant="outline"
                  size="sm"
                  className={styles.switchButton}
                >
                  Switch to Filecoin
                </Button>
              </div>
            </div>
          )}

          {/* USDFC Balance & Mint */}
          {isConnected && isCorrectChain && (
            <div className={styles.usdcSection}>
              <div className={styles.balanceDisplay}>
                <span className={styles.balanceLabel}>USDFC:</span>
                <span className={styles.balanceAmount}>{formattedBalance}</span>
              </div>
              
              <div className={styles.mintSection}>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="FIL amount"
                  className={styles.mintInput}
                  min="0.1"
                  step="0.1"
                />
                <Button
                  onClick={handleMintUSDFC}
                  disabled={isMinting || !mintAmount}
                  size="sm"
                  className={styles.mintButton}
                >
                  {isMinting ? 'Minting...' : 'Mint USDFC'}
                </Button>
              </div>
            </div>
          )}

          {/* Wallet Connection - Using RainbowKit */}
          <div className={styles.walletSection}>
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
