'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { TrendingUp, Calendar, Users, DollarSign, Filter, Search } from 'lucide-react'
import { useMarkets } from '@/lib/hooks/useMarkets'
import { MarketCard } from './MarketCard'
import { MarketState } from '@/types'
import { formatUnits } from 'viem'

type FilterState = 'all' | 'open' | 'resolved'

export function MarketListing() {
  const { ready, authenticated, login } = usePrivy()
  const { markets, isLoading, error, refetch } = useMarkets()
  const [filter, setFilter] = useState<FilterState>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter markets based on current filter
  const filteredMarkets = markets.filter(market => {
    const matchesFilter = filter === 'all' || 
      (filter === 'open' && market.state === MarketState.Open) ||
      (filter === 'resolved' && market.state === MarketState.Resolved)
    
    const matchesSearch = searchQuery === '' || 
      market.question.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Calculate stats
  const openMarkets = markets.filter(m => m.state === MarketState.Open).length
  const totalLiquidity = markets.reduce((acc, market) => acc + market.totalLiquidity, 0n)
  const averageYesPrice = markets.length > 0 
    ? markets.reduce((acc, market) => acc + Number(formatUnits(market.yesPrice, 18)), 0) / markets.length 
    : 0

  if (!ready) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Prediction Markets
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Trade on the outcomes of future events. Buy YES or NO tokens and earn rewards when you're right.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Markets</p>
              <p className="text-2xl font-bold text-gray-900">{markets.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Active Markets</p>
              <p className="text-2xl font-bold text-gray-900">{openMarkets}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Liquidity</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(formatUnits(totalLiquidity, 6)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Avg YES Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {(averageYesPrice * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Markets' },
              { key: 'open', label: 'Open' },
              { key: 'resolved', label: 'Resolved' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterState)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Login prompt for unauthenticated users */}
      {!authenticated && (
        <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Start Trading Predictions
            </h3>
            <p className="text-gray-600 mb-6">
              Sign in with your email or phone to start trading on prediction markets
            </p>
            <button
              onClick={login}
              className="btn-primary text-lg px-8 py-3"
            >
              Sign In to Trade
            </button>
          </div>
        </div>
      )}

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="card h-80">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card border border-red-200 bg-red-50">
          <div className="text-center py-8">
            <p className="text-red-800 mb-4">Failed to load markets: {error}</p>
            <button
              onClick={refetch}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredMarkets.length === 0 ? (
        <div className="card">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No markets match your search.' : 'No markets found.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-secondary"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard
              key={market.address}
              market={market}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      {authenticated && markets.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold mb-4">
              Ready to Start Trading?
            </h3>
            <p className="mb-6">
              Click on any market above to view details and start trading YES/NO tokens
            </p>
            <button
              onClick={() => {
                const firstOpenMarket = markets.find(m => m.state === MarketState.Open)
                if (firstOpenMarket) {
                  // Navigate to market detail page
                  window.location.href = `/market/${firstOpenMarket.address}`
                }
              }}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Trade Your First Market
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
