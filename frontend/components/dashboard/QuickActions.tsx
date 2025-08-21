'use client'

import { Shield, TrendingUp, HelpCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      icon: Shield,
      title: 'Buy New Policy',
      description: 'Get additional fuel price protection',
      href: '/#insurance-offer',
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      external: false,
    },
    {
      icon: TrendingUp,
      title: 'Current Fuel Prices',
      description: 'Check live fuel prices in Ghana',
      href: '/fuel-prices',
      color: 'text-success-600',
      bgColor: 'bg-success-100',
      external: false,
    },
    {
      icon: HelpCircle,
      title: 'How It Works',
      description: 'Learn about fuel price protection',
      href: '/how-it-works',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      external: false,
    },
    {
      icon: ExternalLink,
      title: 'View Contract',
      description: 'Explore the smart contract on Arbiscan',
      href: 'https://sepolia.arbiscan.io/address/0x...',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      external: true,
    },
  ]

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          const Component = action.external ? 'a' : Link
          
          return (
            <Component
              key={index}
              href={action.href}
              {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="block p-4 border border-gray-200 rounded-lg hover:shadow-sm hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-105 transition-transform`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-gray-700 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
                {action.external && (
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </div>
            </Component>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            💡 Pro Tip
          </h4>
          <p className="text-sm text-gray-600">
            Consider buying protection when fuel prices are stable or decreasing. 
            This gives you the best chance of a payout if prices spike unexpectedly.
          </p>
        </div>
      </div>
    </div>
  )
}
