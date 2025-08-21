'use client'

import { useState } from 'react'
import { Market } from '@/hooks/usePredictionMarkets'
import { usePredictionTrading } from '@/hooks/usePredictionTrading'
import { usePrivySafe } from '@/hooks/usePrivySafe'

interface MarketCardProps {
  market: Market
  onTrade?: () => void
}

export function MarketCard({ market, onTrade }: MarketCardProps) {
  const { address, isPrivyReady, login } = usePrivySafe()
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')
  const [showTradeForm, setShowTradeForm] = useState(false)
  
  const {
    buyTokens,
    approveUSDC,
    isLoading,
    error,
    isSuccess,
    clearError,
    calculateTokensOut
  } = usePredictionTrading()

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now()
    const remaining = timestamp - now
    
    if (remaining <= 0) return 'Expired'
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const handleTrade = async () => {
    if (!address) {
      login()
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      return
    }

    try {
      clearError()
      
      // First approve USDC spending
      await approveUSDC(amount, market.address)
      
      // Then buy tokens
      await buyTokens({
        marketAddress: market.address,
        tokenAddress: selectedOutcome === 'yes' ? market.yesToken : market.noToken,
        amount,
        tradeType: 'buy',
        outcomeType: selectedOutcome
      })

      // Reset form and call callback
      setAmount('')
      setShowTradeForm(false)
      onTrade?.()
      
    } catch (err) {
      console.error('Trade failed:', err)
    }
  }

  const selectedPrice = selectedOutcome === 'yes' ? market.yesPrice : market.noPrice
  const estimatedTokens = amount ? calculateTokensOut(market.address, amount, selectedOutcome === 'yes' ? market.yesToken : market.noToken) : '0'

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Market Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {market.question}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            market.state === 'Open' ? 'bg-green-100 text-green-800' :
            market.state === 'Resolved' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {market.state}
          </span>
          <span>{formatTimeRemaining(market.resolutionTimestamp)}</span>
        </div>
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg cursor-pointer transition-colors ${
          selectedOutcome === 'yes' 
            ? 'bg-green-50 border-2 border-green-500' 
            : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
        }`} onClick={() => setSelectedOutcome('yes')}>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700 mb-1">YES</div>
            <div className="text-xl font-bold text-green-600">
              ${market.yesPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {(market.yesPrice * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg cursor-pointer transition-colors ${
          selectedOutcome === 'no' 
            ? 'bg-red-50 border-2 border-red-500' 
            : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
        }`} onClick={() => setSelectedOutcome('no')}>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700 mb-1">NO</div>
            <div className="text-xl font-bold text-red-600">
              ${market.noPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {(market.noPrice * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Trade Form */}
      {market.state === 'Open' && (
        <div className="space-y-3">
          {showTradeForm && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="text-sm text-gray-600">
                  <div>Buying: <span className="font-medium">{selectedOutcome.toUpperCase()}</span> tokens</div>
                  <div>Price: <span className="font-medium">${selectedPrice.toFixed(2)}</span> per token</div>
                  <div>You'll receive: <span className="font-medium">~{estimatedTokens}</span> tokens</div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    selectedOutcome === 'yes'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {isLoading ? 'Trading...' : `Buy ${selectedOutcome.toUpperCase()}`}
                </button>
                <button
                  onClick={() => setShowTradeForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showTradeForm && (
            <button
              onClick={() => {
                if (!address) {
                  login()
                } else {
                  setShowTradeForm(true)
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              {address ? 'Trade' : 'Connect Wallet to Trade'}
            </button>
          )}
        </div>
      )}

      {/* Resolved Market */}
      {market.state === 'Resolved' && market.winningToken && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-blue-700 mb-1">Market Resolved</div>
            <div className="font-medium text-blue-900">
              {market.winningToken === market.yesToken ? 'YES' : 'NO'} won
            </div>
            {(market.userYesBalance || market.userNoBalance) && (
              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm">
                Claim Winnings
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
