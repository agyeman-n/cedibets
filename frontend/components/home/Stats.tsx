'use client'

import { useRealContract } from '@/hooks/useRealContract'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, Shield, Users, DollarSign } from 'lucide-react'

export function Stats() {
  const { contractData, formatUSDC, totalPolicies } = useRealContract()

  // Calculate real stats from contract data
  const stats = [
    {
      icon: Shield,
      label: 'Total Policies',
      value: totalPolicies.toString(),
      change: 'All time',
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      icon: DollarSign,
      label: 'Contract Balance',
      value: formatUSDC(contractData.contractBalance || BigInt(0)) + ' USDC',
      change: 'Available reserves',
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      icon: Users,
      label: 'Current Price',
      value: '25.80 GHS',
      change: 'Per litre',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: TrendingUp,
      label: 'Potential Return',
      value: '900%',
      change: 'When triggered',
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-mobile">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Ghanaians
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join the growing community of people protecting themselves against fuel price volatility
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card text-center">
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.change}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Secured by</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-lg font-bold text-gray-700">Arbitrum</div>
            <div className="text-lg font-bold text-gray-700">OpenZeppelin</div>
            <div className="text-lg font-bold text-gray-700">Privy</div>
            <div className="text-lg font-bold text-gray-700">Chainlink</div>
          </div>
        </div>
      </div>
    </section>
  )
}
