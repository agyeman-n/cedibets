'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { Address, formatUnits, parseUnits, encodeFunctionData } from 'viem'
import { CONTRACTS, CEDIBETS_ABI, ERC20_ABI } from '@/lib/contract'

// Types for better type safety
export interface PolicyDetails {
  id: bigint
  policyHolder: Address
  premiumPaid: bigint
  payoutAmount: bigint
  strikePrice: bigint
  expirationTimestamp: bigint
  settled: boolean
}

export interface ContractData {
  usdcBalance: bigint
  usdcAllowance: bigint
  userPolicies: bigint[]
  contractBalance: bigint
  policyCounter: bigint
  premiumAmount: bigint
  payoutAmount: bigint
}

export interface TransactionState {
  isLoading: boolean
  error: string | null
  txHash: string | null
  isSuccess: boolean
}

// Main hook for real contract interactions
export function useRealContract() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [contractData, setContractData] = useState<Partial<ContractData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(0)

  // Transaction states for different operations
  const [approveState, setApproveState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
    isSuccess: false,
  })
  
  const [purchaseState, setPurchaseState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
    isSuccess: false,
  })

  // Read all contract data
  const refreshContractData = useCallback(async () => {
    if (!publicClient) return

    try {
      setIsLoading(true)
      setError(null)

      const data: Partial<ContractData> = {}

      // Read policy counter
      try {
        data.policyCounter = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'policyCounter',
        }) as bigint
      } catch (err) {
        console.warn('Failed to read policy counter:', err)
        data.policyCounter = BigInt(1)
      }

      // Read contract balance
      try {
        data.contractBalance = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'getContractBalance',
        }) as bigint
      } catch (err) {
        console.warn('Failed to read contract balance:', err)
        data.contractBalance = BigInt(0)
      }

      // Read premium and payout amounts
      try {
        data.premiumAmount = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'PREMIUM_AMOUNT',
        }) as bigint
      } catch (err) {
        console.warn('Failed to read premium amount:', err)
        data.premiumAmount = parseUnits('5', 6) // 5 USDC default
      }

      try {
        data.payoutAmount = await publicClient.readContract({
          address: CONTRACTS.CEDIBETS,
          abi: CEDIBETS_ABI,
          functionName: 'PAYOUT_AMOUNT',
        }) as bigint
      } catch (err) {
        console.warn('Failed to read payout amount:', err)
        data.payoutAmount = parseUnits('50', 6) // 50 USDC default
      }

      // User-specific data (only if address is connected)
      if (address) {
        // Read USDC balance
        try {
          data.usdcBalance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint
        } catch (err) {
          console.warn('Failed to read USDC balance:', err)
          data.usdcBalance = BigInt(0)
        }

        // Read USDC allowance
        try {
          data.usdcAllowance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [address, CONTRACTS.CEDIBETS],
          }) as bigint
        } catch (err) {
          console.warn('Failed to read USDC allowance:', err)
          data.usdcAllowance = BigInt(0)
        }

        // Read user policies
        try {
          data.userPolicies = await publicClient.readContract({
            address: CONTRACTS.CEDIBETS,
            abi: CEDIBETS_ABI,
            functionName: 'getUserPolicies',
            args: [address],
          }) as bigint[]
        } catch (err) {
          console.warn('Failed to read user policies:', err)
          data.userPolicies = []
        }
      }

      setContractData(data)
      setLastUpdate(Date.now())
      
    } catch (err) {
      console.error('Failed to refresh contract data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, address])

  // Read specific policy details
  const readPolicy = useCallback(async (policyId: bigint): Promise<PolicyDetails | null> => {
    if (!publicClient) return null

    try {
      const policy = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'getPolicy',
        args: [policyId],
      }) as any[]

      return {
        id: policy[0],
        policyHolder: policy[1],
        premiumPaid: policy[2],
        payoutAmount: policy[3],
        strikePrice: policy[4],
        expirationTimestamp: policy[5],
        settled: policy[6],
      }
    } catch (err) {
      console.error('Failed to read policy:', err)
      return null
    }
  }, [publicClient])

  // Approve USDC spending
  const approveUSDC = useCallback(async (amount: bigint) => {
    if (!walletClient) {
      setApproveState({
        isLoading: false,
        error: 'Wallet not connected',
        txHash: null,
        isSuccess: false,
      })
      return
    }

    try {
      setApproveState({
        isLoading: true,
        error: null,
        txHash: null,
        isSuccess: false,
      })

      const hash = await walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.CEDIBETS, amount],
      })

      setApproveState({
        isLoading: true,
        error: null,
        txHash: hash,
        isSuccess: false,
      })

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      setApproveState({
        isLoading: false,
        error: null,
        txHash: hash,
        isSuccess: true,
      })

      // Refresh contract data after successful approval
      await refreshContractData()

    } catch (err) {
      console.error('Approval failed:', err)
      setApproveState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Approval failed',
        txHash: null,
        isSuccess: false,
      })
    }
  }, [walletClient, publicClient, refreshContractData])

  // Purchase policy
  const purchasePolicy = useCallback(async (strikePriceGHS: string, expirationDate: Date) => {
    if (!walletClient) {
      setPurchaseState({
        isLoading: false,
        error: 'Wallet not connected',
        txHash: null,
        isSuccess: false,
      })
      return
    }

    try {
      setPurchaseState({
        isLoading: true,
        error: null,
        txHash: null,
        isSuccess: false,
      })

      // Convert strike price to contract format (e.g., 30.50 -> 3050)
      const strikePriceFormatted = BigInt(Math.round(parseFloat(strikePriceGHS) * 100))
      const expirationTimestamp = BigInt(Math.floor(expirationDate.getTime() / 1000))

      const hash = await walletClient.writeContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'purchasePolicy',
        args: [strikePriceFormatted, expirationTimestamp],
      })

      setPurchaseState({
        isLoading: true,
        error: null,
        txHash: hash,
        isSuccess: false,
      })

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      setPurchaseState({
        isLoading: false,
        error: null,
        txHash: hash,
        isSuccess: true,
      })

      // Refresh contract data after successful purchase
      await refreshContractData()

    } catch (err) {
      console.error('Policy purchase failed:', err)
      setPurchaseState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Purchase failed',
        txHash: null,
        isSuccess: false,
      })
    }
  }, [walletClient, publicClient, refreshContractData])

  // Auto-refresh contract data
  useEffect(() => {
    refreshContractData()
    
    // Set up periodic refresh
    const interval = setInterval(refreshContractData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [refreshContractData])

  // Helper functions for formatting
  const formatUSDC = useCallback((amount: bigint) => {
    return formatUnits(amount, 6)
  }, [])

  const formatStrikePrice = useCallback((strikePrice: bigint) => {
    return (Number(strikePrice) / 100).toFixed(2)
  }, [])

  const formatDate = useCallback((timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }, [])

  // Check if user needs to approve USDC
  const needsApproval = useCallback((amount: bigint) => {
    return (contractData.usdcAllowance || BigInt(0)) < amount
  }, [contractData.usdcAllowance])

  // Check if user has enough balance
  const hasEnoughBalance = useCallback((amount: bigint) => {
    return (contractData.usdcBalance || BigInt(0)) >= amount
  }, [contractData.usdcBalance])

  return {
    // Contract data
    contractData,
    isLoading,
    error,
    lastUpdate,
    
    // Actions
    refreshContractData,
    readPolicy,
    approveUSDC,
    purchasePolicy,
    
    // Transaction states
    approveState,
    purchaseState,
    
    // Helper functions
    formatUSDC,
    formatStrikePrice,
    formatDate,
    needsApproval,
    hasEnoughBalance,
    
    // Derived values
    isConnected: !!address,
    userHasPolicies: (contractData.userPolicies?.length || 0) > 0,
    totalPolicies: contractData.policyCounter || BigInt(0),
    premiumInUSDC: contractData.premiumAmount ? formatUSDC(contractData.premiumAmount) : '5.00',
    payoutInUSDC: contractData.payoutAmount ? formatUSDC(contractData.payoutAmount) : '50.00',
  }
}
