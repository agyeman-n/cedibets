'use client'

import { useState } from 'react'
import { Shield, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useRealContract } from '@/hooks/useRealContract'
import { usePrivySafe } from '@/hooks/usePrivySafe'
import { getDaysUntilExpiry } from '@/lib/utils'
import { APP_CONFIG } from '@/lib/config'

export function InsuranceOffer() {
  const { ready, authenticated, login, isConnected } = usePrivySafe()
  const { 
    contractData, 
    isLoading: contractLoading, 
    error: contractError,
    approveUSDC,
    purchasePolicy,
    approveState,
    purchaseState,
    needsApproval,
    hasEnoughBalance,
    premiumInUSDC,
    payoutInUSDC,
    formatUSDC,
    isConnected: walletConnected
  } = useRealContract()
  
  // Default offer parameters
  const [strikePrice] = useState(APP_CONFIG.DEFAULT_OFFER.STRIKE_PRICE)
  const [expirationDate] = useState(
    new Date(Date.now() + APP_CONFIG.DEFAULT_OFFER.DAYS_UNTIL_EXPIRY * 24 * 60 * 60 * 1000)
  )
  
  const daysUntilExpiry = getDaysUntilExpiry(expirationDate)
  const premiumAmount = contractData.premiumAmount || BigInt(0)
  const usdcBalance = contractData.usdcBalance || BigInt(0)
  const hasBalance = hasEnoughBalance(premiumAmount)
  const needsUSDCApproval = needsApproval(premiumAmount)
  
  const handlePurchase = async () => {
    if (!authenticated) {
      login()
      return
    }
    
    if (!hasBalance) {
      alert(`Insufficient USDC balance. You need ${premiumInUSDC} USDC.`)
      return
    }
    
    try {
      // First approve USDC if needed
      if (needsUSDCApproval) {
        await approveUSDC(premiumAmount)
      }
      
      // Then purchase policy
      await purchasePolicy(strikePrice, expirationDate)
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  const getButtonText = () => {
    if (!ready || contractLoading) return 'Loading...'
    if (!authenticated) return 'Sign In to Buy Protection'
    if (!walletConnected) return 'Connecting Wallet...'
    if (contractError) return 'Contract Error'
    if (!hasBalance) return `Need ${premiumInUSDC} USDC`
    if (approveState.isLoading) return 'Approving USDC...'
    if (purchaseState.isLoading) return 'Purchasing Policy...'
    if (purchaseState.isSuccess) return 'Policy Purchased!'
    if (needsUSDCApproval) return 'Approve & Buy Protection'
    return 'Buy Protection'
  }

  const isLoading = !ready || contractLoading || approveState.isLoading || purchaseState.isLoading

  return (
    <div id="insurance-offer" className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Current Insurance Offer
        </h2>
        <p className="text-lg text-gray-600">
          Protect yourself against fuel price increases with our simple insurance policy
        </p>
      </div>

      {/* Main Offer Card */}
      <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Offer Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Fuel Price Protection</h3>
                <p className="text-gray-600">30-Day Coverage</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Premium</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {premiumInUSDC} USDC
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Payout</span>
                </div>
                <p className="text-2xl font-bold text-primary-600">
                  {payoutInUSDC} USDC
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-warning-600" />
                  <span className="text-sm font-medium text-gray-700">Strike Price</span>
                </div>
                <p className="text-xl font-bold text-warning-600">{strikePrice} GHS</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Expires In</span>
                </div>
                <p className="text-xl font-bold text-purple-600">{daysUntilExpiry} Days</p>
              </div>
            </div>

            {/* How it works explanation */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Pay {premiumInUSDC} USDC now. 
                If fuel prices exceed {strikePrice} GHS by {expirationDate.toLocaleDateString()}, 
                you'll receive {payoutInUSDC} USDC. That's a potential 
                {' '}<span className="font-bold">
                  {((Number(payoutInUSDC) / Number(premiumInUSDC)) - 1) * 100}% return
                </span>!
              </p>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="space-y-6">
            {/* Wallet Status */}
            {authenticated && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your USDC Balance</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatUSDC(contractData.usdcBalance || BigInt(0))} USDC
                  </span>
                </div>
                {hasBalance ? (
                  <div className="flex items-center space-x-2 text-success-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Sufficient balance</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-warning-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Insufficient balance</span>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {(approveState.error || purchaseState.error) && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger-800">Transaction Failed</p>
                    <p className="text-xs text-danger-700 mt-1">{approveState.error || purchaseState.error}</p>
                  </div>
                </div>
              </div>
            )}

            {purchaseState.isSuccess && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-success-800">Policy Purchased!</p>
                    <p className="text-xs text-success-700 mt-1">
                      Your fuel price protection is now active. View it in your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={isLoading || (authenticated && !hasBalance) || purchaseState.isSuccess}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              <span>{getButtonText()}</span>
            </button>

            {needsUSDCApproval && authenticated && hasBalance && (
              <p className="text-xs text-gray-600 text-center">
                This will require two transactions: first to approve USDC spending, then to purchase the policy.
              </p>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By purchasing this policy, you agree to our{' '}
              <a href="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{' '}
              and understand the risks involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
