'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function SimpleTestPage() {
  const [selectedToken, setSelectedToken] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState('')

  // Mock market data
  const mockMarket = {
    question: "Will GHS/USD exchange rate exceed 15.0 by December 31, 2024?",
    yesPrice: 65.3,
    noPrice: 34.7,
    totalLiquidity: 12500,
    yesSupply: 8200,
    noSupply: 4300,
    resolutionDate: new Date('2024-12-31'),
    state: 'Open'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            ← Back to Markets
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {mockMarket.question}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Open for Trading
                </span>
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Resolves: {mockMarket.resolutionDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                      {mockMarket.yesPrice}%
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    {mockMarket.yesSupply.toLocaleString()} tokens
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
                      {mockMarket.noPrice}%
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    {mockMarket.noSupply.toLocaleString()} tokens
                  </p>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Market Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Liquidity</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${mockMarket.totalLiquidity.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(mockMarket.yesSupply + mockMarket.noSupply).toLocaleString()}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-600">Days Left</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.max(0, Math.ceil((mockMarket.resolutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Trade (Demo)</h2>
              
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
                    <p className="text-sm mt-1">{mockMarket.yesPrice}%</p>
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
                    <p className="text-sm mt-1">{mockMarket.noPrice}%</p>
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
                  <span>≈ {amount ? (Number(amount) / ((selectedToken === 'YES' ? mockMarket.yesPrice : mockMarket.noPrice) / 100)).toFixed(2) : '0'} tokens</span>
                </div>
              </div>

              {/* Demo Trade Button */}
              <button
                onClick={() => alert(`Demo: Would buy ${amount || '0'} USDC worth of ${selectedToken} tokens`)}
                disabled={!amount}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy {selectedToken} Tokens (Demo)
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                This is a demo page. Real trading requires wallet connection.
              </p>
            </div>

            {/* Demo Market Listing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Other Markets</h3>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Will Bitcoin exceed $100k?</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>YES: 23%</span>
                    <span>NO: 77%</span>
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Will fuel prices exceed 10 GHS?</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>YES: 72%</span>
                    <span>NO: 28%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
