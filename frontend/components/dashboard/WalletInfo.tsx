'use client'

import { useState } from 'react'
import { Wallet, ExternalLink, Copy, Check } from 'lucide-react'
import { useRealContract } from '@/hooks/useRealContract'
import { usePrivySafe } from '@/hooks/usePrivySafe'
import { truncateAddress } from '@/lib/utils'

export function WalletInfo() {
  const { address, isConnected } = usePrivySafe()
  const { contractData, formatUSDC } = useRealContract()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleViewOnExplorer = () => {
    if (address) {
      window.open(`https://sepolia.arbiscan.io/address/${address}`, '_blank')
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="card">
        <div className="text-center py-6">
          <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Wallet not connected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Wallet className="h-5 w-5 text-primary-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Wallet Info</h3>
      </div>

      <div className="space-y-4">
        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded-lg flex-1">
              {truncateAddress(address, 6)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleViewOnExplorer}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="View on explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* USDC Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            USDC Balance
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {formatUSDC(contractData.usdcBalance || BigInt(0))} USDC
            </div>
            <div className="text-sm text-gray-600">
              ≈ ${formatUSDC(contractData.usdcBalance || BigInt(0))} USD
            </div>
          </div>
        </div>

        {/* Network */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span className="text-sm text-gray-900">Arbitrum Sepolia</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <button className="w-full btn-secondary text-sm">
              Add USDC
            </button>
            <button className="w-full btn-secondary text-sm">
              Switch Network
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Security:</strong> Your wallet is managed by Privy's secure embedded wallet technology. 
            Your private keys are encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  )
}
