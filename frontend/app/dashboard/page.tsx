'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, XCircle, BarChart2, Users, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Mock user positions data for demo
const mockPositions = [
  {
    id: '1',
    marketAddress: '0x1234567890123456789012345678901234567890',
    question: "Will GHS/USD exchange rate exceed 15.0 by December 31, 2024?",
    yesTokens: 150,
    noTokens: 0,
    currentYesPrice: 0.653,
    currentNoPrice: 0.347,
    totalInvested: 100, // USDC
    currentValue: 97.95, // USDC
    pnl: -2.05, // USDC
    pnlPercent: -2.05,
    resolutionDate: new Date('2024-12-31'),
    state: 'Open',
    winningToken: null
  },
  {
    id: '2',
    marketAddress: '0x2345678901234567890123456789012345678901',
    question: "Will Ghana national fuel price exceed 10.0 GHS/L by June 30, 2024?",
    yesTokens: 0,
    noTokens: 85,
    currentYesPrice: 0.721,
    currentNoPrice: 0.279,
    totalInvested: 50, // USDC
    currentValue: 23.72, // USDC
    pnl: -26.28, // USDC
    pnlPercent: -52.56,
    resolutionDate: new Date('2024-06-30'),
    state: 'Open',
    winningToken: null
  },
  {
    id: '3',
    marketAddress: '0x3456789012345678901234567890123456789012',
    question: "Will Bitcoin price exceed $100,000 by March 31, 2024?",
    yesTokens: 200,
    noTokens: 100,
    currentYesPrice: 0.234,
    currentNoPrice: 0.766,
    totalInvested: 200, // USDC
    currentValue: 123.4, // USDC
    pnl: -76.6, // USDC
    pnlPercent: -38.3,
    resolutionDate: new Date('2024-03-31'),
    state: 'Resolved',
    winningToken: 'NO' // Bitcoin didn't exceed $100k
  }
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active')
  const [isLoading, setIsLoading] = useState(false)

  const filteredPositions = mockPositions.filter(position => {
    if (activeTab === 'active') return position.state === 'Open'
    if (activeTab === 'resolved') return position.state === 'Resolved'
    return true // 'all'
  })

  // Calculate portfolio stats
  const totalInvested = mockPositions.reduce((sum, pos) => sum + pos.totalInvested, 0)
  const totalCurrentValue = mockPositions.reduce((sum, pos) => sum + pos.currentValue, 0)
  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  const activePositions = mockPositions.filter(pos => pos.state === 'Open').length
  const resolvedPositions = mockPositions.filter(pos => pos.state === 'Resolved').length

  const getStatusBadge = (position: any) => {
    if (position.state === 'Resolved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Resolved
        </span>
      )
    }
    
    const isExpired = position.resolutionDate.getTime() < Date.now()
    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Awaiting Resolution
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <BarChart2 className="h-3 w-3 mr-1" />
        Active
      </span>
    )
  }

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600'
    if (pnl < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            My Portfolio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your prediction market positions and portfolio performance.
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalInvested.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Current Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalCurrentValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total P&L</p>
                <p className={`text-2xl font-bold ${getPnLColor(totalPnL)}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
                <p className={`text-xs ${getPnLColor(totalPnL)}`}>
                  ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Active Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activePositions}
                </p>
                <p className="text-xs text-gray-500">
                  {resolvedPositions} resolved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 text-center">
            Explore Markets
          </Link>
          <button
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => setIsLoading(false), 1000)
            }}
            disabled={isLoading}
            className="bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-primary-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                Refreshing...
              </>
            ) : (
              'Refresh Portfolio'
            )}
          </button>
        </div>

        {/* Positions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { key: 'active', label: 'Active Positions' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'all', label: 'All Positions' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Positions List */}
          <div className="p-6">
            {filteredPositions.length === 0 ? (
              <div className="text-center py-12">
                <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'active' ? 'No Active Positions' : 'No Positions Found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'active' 
                    ? 'You don\'t have any active market positions yet.'
                    : 'No positions match the selected filter.'
                  }
                </p>
                {activeTab === 'active' && (
                  <Link href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700">
                    Start Trading
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPositions.map((position) => (
                  <div
                    key={position.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {position.question}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Resolves: {position.resolutionDate.toLocaleDateString()}</span>
                          <span>•</span>
                          <span>
                            {Math.max(0, Math.ceil((position.resolutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(position)}
                    </div>

                    {/* Position Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Holdings</p>
                        <div className="space-y-1">
                          {position.yesTokens > 0 && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium">{position.yesTokens} YES</span>
                            </div>
                          )}
                          {position.noTokens > 0 && (
                            <div className="flex items-center space-x-1">
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              <span className="text-sm font-medium">{position.noTokens} NO</span>
                            </div>
                          )}
                          {position.yesTokens === 0 && position.noTokens === 0 && (
                            <span className="text-sm text-gray-500">No tokens</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Invested</p>
                        <p className="font-semibold text-gray-900">
                          ${position.totalInvested.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="font-semibold text-gray-900">
                          ${position.currentValue.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">P&L</p>
                        <p className={`font-semibold ${getPnLColor(position.pnl)}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </p>
                        <p className={`text-xs ${getPnLColor(position.pnl)}`}>
                          ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>

                    {/* Current Prices */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">YES</span>
                        </div>
                        <span className="text-sm font-bold text-green-700">
                          {(position.currentYesPrice * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center space-x-1">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-900">NO</span>
                        </div>
                        <span className="text-sm font-bold text-red-700">
                          {(position.currentNoPrice * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Position ID: {position.id}
                        {position.state === 'Resolved' && position.winningToken && (
                          <span className="ml-2 text-gray-700">
                            • Winner: <span className="font-medium">{position.winningToken}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/market/${position.marketAddress}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Market
                        </Link>
                        {position.state === 'Resolved' && position.winningToken && (
                          <button className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700">
                            Redeem Winnings
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}