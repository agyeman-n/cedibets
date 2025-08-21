'use client'

import { useState, useEffect } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { foundry } from 'viem/chains'
import { CONTRACTS, CEDIBETS_ABI, ERC20_ABI } from '@/lib/contract'

const publicClient = createPublicClient({
  chain: foundry,
  transport: http('http://localhost:8545'),
})

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  result?: string
  error?: string
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Network Connection', status: 'pending' },
    { name: 'Cedibets Contract Code', status: 'pending' },
    { name: 'USDC Contract Code', status: 'pending' },
    { name: 'Read Policy Counter', status: 'pending' },
    { name: 'Read Contract Balance', status: 'pending' },
    { name: 'Read USDC Total Supply', status: 'pending' },
    { name: 'Read Premium Amount', status: 'pending' },
    { name: 'Read Payout Amount', status: 'pending' },
  ])

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test))
  }

  const runTests = async () => {
    try {
      // Test 1: Network Connection
      updateTest(0, { status: 'pending' })
      const blockNumber = await publicClient.getBlockNumber()
      updateTest(0, { 
        status: 'success', 
        result: `Block: ${blockNumber.toString()}` 
      })

      // Test 2: Cedibets Contract Code
      updateTest(1, { status: 'pending' })
      const cedibetsCode = await publicClient.getBytecode({ address: CONTRACTS.CEDIBETS })
      if (!cedibetsCode || cedibetsCode === '0x') {
        updateTest(1, { 
          status: 'error', 
          error: 'No contract code found' 
        })
      } else {
        updateTest(1, { 
          status: 'success', 
          result: `${cedibetsCode.length} bytes` 
        })
      }

      // Test 3: USDC Contract Code
      updateTest(2, { status: 'pending' })
      const usdcCode = await publicClient.getBytecode({ address: CONTRACTS.USDC })
      if (!usdcCode || usdcCode === '0x') {
        updateTest(2, { 
          status: 'error', 
          error: 'No contract code found' 
        })
      } else {
        updateTest(2, { 
          status: 'success', 
          result: `${usdcCode.length} bytes` 
        })
      }

      // Test 4: Read Policy Counter
      updateTest(3, { status: 'pending' })
      try {
        const policyCounter = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'policyCounter',
        }) as bigint
        updateTest(3, { 
          status: 'success', 
          result: policyCounter.toString() 
        })
      } catch (error) {
        updateTest(3, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      // Test 5: Read Contract Balance
      updateTest(4, { status: 'pending' })
      try {
        const contractBalance = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'getContractBalance',
        }) as bigint
        updateTest(4, { 
          status: 'success', 
          result: `${formatUnits(contractBalance, 6)} USDC` 
        })
      } catch (error) {
        updateTest(4, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      // Test 6: Read USDC Total Supply
      updateTest(5, { status: 'pending' })
      try {
        const totalSupply = await publicClient.readContract({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }) as bigint
        updateTest(5, { 
          status: 'success', 
          result: `${formatUnits(totalSupply, 6)} USDC` 
        })
      } catch (error) {
        updateTest(5, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      // Test 7: Read Premium Amount
      updateTest(6, { status: 'pending' })
      try {
        const premiumAmount = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'PREMIUM_AMOUNT',
        }) as bigint
        updateTest(6, { 
          status: 'success', 
          result: `${formatUnits(premiumAmount, 6)} USDC` 
        })
      } catch (error) {
        updateTest(6, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      // Test 8: Read Payout Amount
      updateTest(7, { status: 'pending' })
      try {
        const payoutAmount = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'PAYOUT_AMOUNT',
        }) as bigint
        updateTest(7, { 
          status: 'success', 
          result: `${formatUnits(payoutAmount, 6)} USDC` 
        })
      } catch (error) {
        updateTest(7, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

    } catch (error) {
      console.error('Test suite failed:', error)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
      case 'success':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      case 'error':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'border-blue-200 bg-blue-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
    }
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const pendingCount = tests.filter(t => t.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Contract Connectivity Tests</h1>
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Run Tests Again
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-800">Passed</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
              <div className="text-sm text-blue-800">Running</div>
            </div>
          </div>

          {/* Contract Addresses */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Contract Addresses</h3>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Cedibets:</span> <code className="bg-white px-2 py-1 rounded">{CONTRACTS.CEDIBETS}</code></div>
              <div><span className="font-medium">USDC:</span> <code className="bg-white px-2 py-1 rounded">{CONTRACTS.USDC}</code></div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-gray-900">{test.name}</span>
                  </div>
                  <div className="text-right">
                    {test.result && (
                      <div className="text-sm font-mono text-gray-700">{test.result}</div>
                    )}
                    {test.error && (
                      <div className="text-sm text-red-600">{test.error}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Environment Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Environment</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>RPC URL: http://localhost:8545</div>
              <div>Chain: Foundry (Local)</div>
              <div>Chain ID: 31337</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}