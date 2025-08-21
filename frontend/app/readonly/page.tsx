'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { foundry } from 'viem/chains'
import { CONTRACTS, CEDIBETS_ABI, ERC20_ABI } from '@/lib/contract'

// Direct contract interaction without Privy
const publicClient = createPublicClient({
  chain: foundry,
  transport: http('http://localhost:8545')
})

export default function ReadOnlyMode() {
  const [contractData, setContractData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContractData() {
      try {
        setIsLoading(true)
        
        // Read contract data directly
        const [policyCounter, contractBalance, premiumAmount, payoutAmount] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.CEDIBETS,
            abi: CEDIBETS_ABI,
            functionName: 'policyCounter',
          }).catch(() => BigInt(1)),
          
          publicClient.readContract({
            address: CONTRACTS.CEDIBETS,
            abi: CEDIBETS_ABI,
            functionName: 'getContractBalance',
          }).catch(() => BigInt(0)),
          
          publicClient.readContract({
            address: CONTRACTS.CEDIBETS,
            abi: CEDIBETS_ABI,
            functionName: 'PREMIUM_AMOUNT',
          }).catch(() => BigInt(5000000)), // 5 USDC with 6 decimals
          
          publicClient.readContract({
            address: CONTRACTS.CEDIBETS,
            abi: CEDIBETS_ABI,
            functionName: 'PAYOUT_AMOUNT',
          }).catch(() => BigInt(50000000)), // 50 USDC with 6 decimals
        ])

        setContractData({
          policyCounter,
          contractBalance,
          premiumAmount,
          payoutAmount,
        })
        
      } catch (err) {
        console.error('Contract read error:', err)
        setError(err instanceof Error ? err.message : 'Failed to read contract data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContractData()
  }, [])

  const formatUSDC = (amount: bigint) => formatUnits(amount, 6)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cedibets - Read-Only Mode
          </h1>
          <p className="text-gray-600">
            View live contract data without authentication. Connect a wallet to interact with the platform.
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Authentication is temporarily unavailable. 
              You can view contract data but cannot make transactions.
            </p>
          </div>
        </div>

        {/* Contract Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Local Anvil (Chain ID: 31337)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Address:</span>
                <span className="font-mono text-sm">{CONTRACTS.CEDIBETS.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RPC:</span>
                <span className="font-mono text-sm">http://localhost:8545</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Insurance Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage Type:</span>
                <span className="font-medium">Fuel Price Protection</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage Period:</span>
                <span className="font-medium">30 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Strike Price:</span>
                <span className="font-medium">30.50 GHS/litre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Contract Data */}
        {error ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center text-red-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.71 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Contract Connection Error</span>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <p className="text-xs text-red-800">
                Make sure Anvil is running on localhost:8545 and contracts are deployed.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Live Contract Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {contractData.policyCounter?.toString() || '0'}
                </div>
                <div className="text-sm text-gray-600">Total Policies</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {contractData.premiumAmount ? formatUSDC(contractData.premiumAmount) : '5.00'}
                </div>
                <div className="text-sm text-gray-600">Premium (USDC)</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {contractData.payoutAmount ? formatUSDC(contractData.payoutAmount) : '50.00'}
                </div>
                <div className="text-sm text-gray-600">Payout (USDC)</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {contractData.contractBalance ? formatUSDC(contractData.contractBalance) : '0.00'}
                </div>
                <div className="text-sm text-gray-600">Contract Balance</div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Insurance Works</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Purchase Policy</h3>
                <p className="text-sm text-gray-600">
                  Pay {contractData.premiumAmount ? formatUSDC(contractData.premiumAmount) : '5.00'} USDC premium for 30-day coverage
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Price Monitoring</h3>
                <p className="text-sm text-gray-600">
                  We monitor official fuel prices against your strike price of 30.50 GHS/litre
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Automatic Payout</h3>
                <p className="text-sm text-gray-600">
                  If prices exceed 30.50 GHS, receive {contractData.payoutAmount ? formatUSDC(contractData.payoutAmount) : '50.00'} USDC payout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to Get Protected?</h2>
          <p className="text-gray-600 mb-4">
            Connect your wallet to purchase fuel price protection insurance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Authentication Again
            </button>
            <button
              onClick={() => window.location.href = '/status'}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View System Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
