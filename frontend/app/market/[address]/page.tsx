'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useMarket } from '@/lib/hooks/useMarkets'
import { useMarketTrade } from '@/lib/hooks/usePredictionMarkets'
import { MarketState } from '@/types'
import { formatUnits, parseUnits } from 'viem'

export default function MarketDetailPage() {
  const params = useParams()
  const marketAddress = params.address as Address
  const { ready, authenticated, login } = usePrivy()
  const { address: userAddress, isConnected } = useAccount()
  
  const { market, isLoading, error, refetch } = useMarket(marketAddress)
  const { 
    buyTokens, 
    sellTokens, 
    approveUSDC, 
    addLiquidity,
    redeemTokens,
    txState, 
    isSuccess 
  } = useMarketTrade(marketAddress)

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [selectedToken, setSelectedToken] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState('')
  const [showLiquidityModal, setShowLiquidityModal] = useState(false)
  const [liquidityAmount, setLiquidityAmount] = useState('')

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-mobile py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-mobile py-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Market Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'This market does not exist.'}</p>
            <Link href="/" className="btn-primary">
              Back to Markets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Format market data
  const yesPrice = market.yesPrice * 100 // Already a number between 0-1
  const noPrice = market.noPrice * 100 // Already a number between 0-1
  const totalLiquidity = Number(market.totalLiquidity) / 1e6 // Convert from wei to USDC
  const resolutionDate = new Date(Number(market.resolutionTimestamp) * 1000)
  const isExpired = resolutionDate.getTime() < Date.now()
  
  // Mock additional data that would come from contract calls
  const yesSupply = BigInt(8200 * 1e6) // Mock 8,200 YES tokens
  const noSupply = BigInt(4300 * 1e6) // Mock 4,300 NO tokens
  
  const selectedTokenAddress = selectedToken === 'YES' ? market.yesToken : market.noToken
  const selectedTokenPrice = selectedToken === 'YES' ? yesPrice : noPrice

  const handleTrade = async () => {
    if (!authenticated) {
      login()
      return
    }

    if (!amount) return

    try {
      const amountBigInt = parseUnits(amount, 6) // USDC has 6 decimals
      
      if (tradeType === 'buy') {
        await buyTokens(selectedTokenAddress, amountBigInt)
      } else {
        await sellTokens(selectedTokenAddress, amountBigInt)
      }
      
      // Refresh market data after trade
      setTimeout(refetch, 2000)
    } catch (error) {
      console.error('Trade failed:', error)
    }
  }

  const handleAddLiquidity = async () => {
    if (!liquidityAmount) return
    
    try {
      const amountBigInt = parseUnits(liquidityAmount, 6)
      await addLiquidity(amountBigInt)
      setShowLiquidityModal(false)
      setLiquidityAmount('')
      setTimeout(refetch, 2000)
    } catch (error) {
      console.error('Add liquidity failed:', error)
    }
  }

  const getMarketStatusBadge = () => {
    switch (market.state) {
      case MarketState.Open:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Open for Trading
          </span>
        )
      case MarketState.Resolving:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
            Awaiting Resolution
          </span>
        )
      case MarketState.Resolved:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            Resolved
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {market.question}
              </h1>
              <div className="flex items-center space-x-4">
                {getMarketStatusBadge()}
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Resolves: {resolutionDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {market.state === MarketState.Open && (
              <button
                onClick={() => setShowLiquidityModal(true)}
                className="btn-secondary"
              >
                Add Liquidity
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Display */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Current Prices</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* YES Token */}
                <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-bold text-green-900">YES</span>
                    </div>
                    <span className="text-3xl font-bold text-green-700">
                      {yesPrice.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    {(Number(yesSupply) / 1e6).toLocaleString()} tokens
                  </p>
                </div>

                {/* NO Token */}
                <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                      <span className="text-lg font-bold text-red-900">NO</span>
                    </div>
                    <span className="text-3xl font-bold text-red-700">
                      {noPrice.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    {(Number(noSupply) / 1e6).toLocaleString()} tokens
                  </p>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Market Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Liquidity</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${totalLiquidity.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(Number(yesSupply + noSupply) / 1e6).toLocaleString()}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-600">Days Left</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.max(0, Math.ceil((resolutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {market.state === MarketState.Open ? (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Trade</h2>
                
                {/* Trade Type Toggle */}
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      tradeType === 'buy'
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      tradeType === 'sell'
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Token Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Token
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedToken('YES')}
                      className={`p-3 rounded-lg border-2 ${
                        selectedToken === 'YES'
                          ? 'border-green-200 bg-green-50 text-green-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">YES</span>
                      </div>
                      <p className="text-sm mt-1">{yesPrice.toFixed(1)}%</p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedToken('NO')}
                      className={`p-3 rounded-lg border-2 ${
                        selectedToken === 'NO'
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-medium">NO</span>
                      </div>
                      <p className="text-sm mt-1">{noPrice.toFixed(1)}%</p>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>≈ ${amount || '0'}</span>
                    <span>≈ {amount ? (Number(amount) / (selectedTokenPrice / 100)).toFixed(2) : '0'} tokens</span>
                  </div>
                </div>

                {/* Transaction Status */}
                {txState.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{txState.error}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">Transaction successful!</p>
                  </div>
                )}

                {/* Trade Button */}
                {!authenticated ? (
                  <button
                    onClick={login}
                    className="w-full btn-primary"
                  >
                    Sign In to Trade
                  </button>
                ) : (
                  <button
                    onClick={handleTrade}
                    disabled={!amount || txState.isLoading}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {txState.isLoading 
                      ? 'Processing...' 
                      : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedToken} Tokens`
                    }
                  </button>
                )}
              </div>
            ) : market.state === MarketState.Resolved ? (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Market Resolved</h2>
                <p className="text-gray-600 mb-4">
                  This market has been resolved. If you hold winning tokens, you can redeem them below.
                </p>
                <button
                  onClick={redeemTokens}
                  disabled={txState.isLoading}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {txState.isLoading ? 'Processing...' : 'Redeem Winning Tokens'}
                </button>
              </div>
            ) : (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Awaiting Resolution</h2>
                <p className="text-gray-600">
                  This market is waiting to be resolved. Trading is currently disabled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {showLiquidityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Liquidity</h3>
            <p className="text-gray-600 mb-4">
              Add USDC to the market to earn fees from trades. You'll receive equal amounts of YES and NO tokens.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={liquidityAmount}
                onChange={(e) => setLiquidityAmount(e.target.value)}
                placeholder="100.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLiquidityModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLiquidity}
                disabled={!liquidityAmount || txState.isLoading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {txState.isLoading ? 'Processing...' : 'Add Liquidity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
