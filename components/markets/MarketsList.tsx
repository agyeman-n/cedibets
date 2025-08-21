'use client'

import { usePredictionMarkets } from '@/hooks/usePredictionMarkets'
import { MarketCard } from './MarketCard'

interface MarketsListProps {
  title?: string
  filter?: 'all' | 'open' | 'resolved' | 'user'
  maxItems?: number
}

export function MarketsList({ title = "Prediction Markets", filter = 'all', maxItems }: MarketsListProps) {
  const { 
    markets, 
    isLoading, 
    error, 
    getOpenMarkets, 
    getUserMarkets,
    refresh 
  } = usePredictionMarkets()

  const getFilteredMarkets = () => {
    let filtered = markets
    
    switch (filter) {
      case 'open':
        filtered = getOpenMarkets()
        break
      case 'resolved':
        filtered = markets.filter(m => m.state === 'Resolved')
        break
      case 'user':
        filtered = getUserMarkets()
        break
      default:
        filtered = markets
    }

    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }

    return filtered
  }

  const filteredMarkets = getFilteredMarkets()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading markets</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refresh}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No markets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'open' ? 'No open markets available.' :
             filter === 'resolved' ? 'No resolved markets found.' :
             filter === 'user' ? 'You haven\'t participated in any markets yet.' :
             'No prediction markets available.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-600">
          {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => (
          <MarketCard
            key={market.address}
            market={market}
            onTrade={refresh}
          />
        ))}
      </div>
    </div>
  )
}
