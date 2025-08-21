'use client'

import { useState } from 'react'
import { Shield, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useUserPolicies } from '@/hooks/useContract'
import { formatPolicyForUI, getStatusDisplay } from '@/lib/utils'
import { PolicyStatus } from '@/types'

export function UserPolicies() {
  const { policies, isLoading } = useUserPolicies()
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all')

  // Mock policies for demo since the hook returns empty array
  const mockPolicies = [
    {
      id: '1',
      policyHolder: '0x1234567890123456789012345678901234567890' as const,
      premiumPaid: '5.00',
      payoutAmount: '50.00',
      strikePrice: '30.50 GHS',
      expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      settled: false,
      status: 'active' as PolicyStatus,
    },
    {
      id: '2',
      policyHolder: '0x1234567890123456789012345678901234567890' as const,
      premiumPaid: '5.00',
      payoutAmount: '50.00',
      strikePrice: '29.00 GHS',
      expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      settled: false,
      status: 'expired-pending' as PolicyStatus,
    },
    {
      id: '3',
      policyHolder: '0x1234567890123456789012345678901234567890' as const,
      premiumPaid: '5.00',
      payoutAmount: '50.00',
      strikePrice: '28.50 GHS',
      expirationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      settled: true,
      status: 'paid-out' as PolicyStatus,
    },
  ]

  const displayPolicies = mockPolicies.filter(policy => 
    filterStatus === 'all' || policy.status === filterStatus
  )

  const statusCounts = {
    all: mockPolicies.length,
    active: mockPolicies.filter(p => p.status === 'active').length,
    'expired-pending': mockPolicies.filter(p => p.status === 'expired-pending').length,
    'expired-no-payout': mockPolicies.filter(p => p.status === 'expired-no-payout').length,
    'paid-out': mockPolicies.filter(p => p.status === 'paid-out').length,
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-gray-900">Your Policies</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'expired-pending', label: 'Pending' },
          { key: 'paid-out', label: 'Paid Out' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key as PolicyStatus | 'all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterStatus === key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({statusCounts[key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Policies List */}
      {displayPolicies.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'No policies yet' : `No ${filterStatus} policies`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all' 
              ? 'Get started by purchasing your first fuel price protection policy.'
              : `You don't have any ${filterStatus} policies at the moment.`
            }
          </p>
          {filterStatus === 'all' && (
            <a href="/#insurance-offer" className="btn-primary">
              Buy Protection
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayPolicies.map((policy) => {
            const statusDisplay = getStatusDisplay(policy.status)
            
            return (
              <div
                key={policy.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Policy #{policy.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Strike Price: {policy.strikePrice}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Premium Paid</span>
                    </div>
                    <p className="font-semibold text-gray-900">{policy.premiumPaid} USDC</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Payout</span>
                    </div>
                    <p className="font-semibold text-gray-900">{policy.payoutAmount} USDC</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Expiration</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {policy.expirationDate.toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {policy.status === 'active' && <CheckCircle className="h-4 w-4 text-success-600" />}
                      {policy.status === 'expired-pending' && <AlertCircle className="h-4 w-4 text-warning-600" />}
                      {policy.status === 'paid-out' && <CheckCircle className="h-4 w-4 text-success-600" />}
                      <span className="font-semibold text-gray-900">
                        {policy.status === 'active' && 'Protected'}
                        {policy.status === 'expired-pending' && 'Pending'}
                        {policy.status === 'paid-out' && 'Paid Out'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons for expired policies */}
                {policy.status === 'expired-pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      This policy has expired and is ready for settlement.
                    </p>
                    <button className="btn-secondary text-sm">
                      Check Settlement
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
