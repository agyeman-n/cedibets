'use client'

import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { MarketsList } from '@/components/markets/MarketsList'
import { usePredictionMarkets } from '@/hooks/usePredictionMarkets'

export default function HomePage() {
  const { markets, totalMarkets } = usePredictionMarkets()

  const totalLiquidity = markets.reduce((acc, market) => acc + market.totalLiquidity, 0)
  const averageYesPrice = markets.length > 0 
    ? markets.reduce((acc, market) => acc + market.yesPrice, 0) / markets.length 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-white overflow-hidden">
        <div className="relative container mx-auto px-4 py-20 sm:py-24 lg:py-32 max-w-6xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-8">
              <BarChart3 className="h-4 w-4 mr-2" />
              Decentralized Prediction Markets
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Trade on the Future of
              <span className="text-primary-600"> Ghana's Economy</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Buy YES or NO tokens on future events like GHS/USD exchange rates and fuel prices. 
              Earn rewards when your predictions are correct.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="#markets"
                className="bg-primary-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-primary-700"
              >
                Start Trading
              </a>
              <Link 
                href="/dashboard"
                className="bg-white text-primary-600 border border-primary-600 text-lg px-8 py-4 rounded-lg hover:bg-primary-50"
              >
                View Portfolio
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-3">
                <div className="h-6 w-6 text-success-500">✓</div>
                <span className="text-gray-700 font-medium">Blockchain Secured</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <TrendingUp className="h-6 w-6 text-success-500" />
                <span className="text-gray-700 font-medium">Automated Market Maker</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Users className="h-6 w-6 text-success-500" />
                <span className="text-gray-700 font-medium">Peer-to-Peer Trading</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Markets</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMarkets}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Active Markets</p>
                  <p className="text-2xl font-bold text-gray-900">{markets.filter(m => m.state === 'Open').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Liquidity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalLiquidity.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
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

          {/* Markets List */}
          <MarketsList filter="open" />

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">
                Ready to Start Trading?
              </h3>
              <p className="mb-6">
                Connect your wallet and start trading on Ghana's economic future. Click on any market above to begin.
              </p>
              <Link
                href="/dashboard"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                View Your Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
