'use client'

import { useState, useEffect } from 'react'
import { useRealContract } from '@/hooks/useRealContract'
import { usePrivySafe } from '@/hooks/usePrivySafe'
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react'

export default function StatusPage() {
  const { 
    contractData, 
    isLoading, 
    error, 
    lastUpdate,
    formatUSDC,
    formatStrikePrice,
    isConnected,
    totalPolicies,
    premiumInUSDC,
    payoutInUSDC
  } = useRealContract()
  
  const { ready, authenticated, privyError } = usePrivySafe()

  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (condition: boolean, loading: boolean = false) => {
    if (loading) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    return condition ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusText = (condition: boolean, loading: boolean = false) => {
    if (loading) return 'Loading...'
    return condition ? 'Connected' : 'Disconnected'
  }

  const systemChecks = [
    {
      name: 'Privy Authentication',
      status: ready && !privyError,
      loading: !ready,
      details: privyError || 'Authentication service ready'
    },
    {
      name: 'Wallet Connection',
      status: authenticated && isConnected,
      loading: false,
      details: authenticated ? 'Wallet connected' : 'No wallet connected'
    },
    {
      name: 'Contract Connection',
      status: !error && !isLoading && contractData.policyCounter !== undefined,
      loading: isLoading,
      details: error || 'Smart contracts accessible'
    },
    {
      name: 'Anvil Local Network',
      status: !error && !isLoading && currentTime - lastUpdate < 60000,
      loading: isLoading,
      details: `Last update: ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Status</h1>
          <p className="text-gray-600">Real-time status of Cedibets platform components</p>
          <div className="mt-4 text-sm text-gray-500">
            Last checked: {new Date(currentTime).toLocaleString()}
          </div>
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {systemChecks.map((check, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{check.name}</h3>
                {getStatusIcon(check.status, check.loading)}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Status: <span className={`font-medium ${check.status ? 'text-green-600' : 'text-red-600'}`}>
                  {getStatusText(check.status, check.loading)}
                </span>
              </div>
              <div className="text-xs text-gray-500">{check.details}</div>
            </div>
          ))}
        </div>

        {/* Contract Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Contract Data</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading contract data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <span>Error: {error}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalPolicies.toString()}</div>
                <div className="text-sm text-gray-600">Total Policies</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{premiumInUSDC}</div>
                <div className="text-sm text-gray-600">Premium (USDC)</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{payoutInUSDC}</div>
                <div className="text-sm text-gray-600">Payout (USDC)</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatUSDC(contractData.contractBalance || BigInt(0))}
                </div>
                <div className="text-sm text-gray-600">Contract Balance</div>
              </div>
            </div>
          )}
        </div>

        {/* User Wallet Info */}
        {authenticated && isConnected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Wallet</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {formatUSDC(contractData.usdcBalance || BigInt(0))} USDC
                </div>
                <div className="text-sm text-gray-600">Your Balance</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {formatUSDC(contractData.usdcAllowance || BigInt(0))} USDC
                </div>
                <div className="text-sm text-gray-600">Allowance</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {contractData.userPolicies?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Your Policies</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {contractData.usdcBalance && contractData.premiumAmount && 
                   contractData.usdcBalance >= contractData.premiumAmount ? 
                   '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Can Purchase</div>
              </div>
            </div>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Environment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Network:</span>
              <span className="font-mono">Local Anvil (Chain ID: 31337)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RPC URL:</span>
              <span className="font-mono">http://localhost:8545</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frontend:</span>
              <span className="font-mono">Next.js 14 + React</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Framework:</span>
              <span className="font-mono">Foundry + Viem + Wagmi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
