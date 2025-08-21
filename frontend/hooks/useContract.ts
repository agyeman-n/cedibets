'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { useState, useCallback } from 'react'
import { CEDIBETS_ABI, ERC20_ABI, CONTRACTS } from '@/lib/contract'
import { Policy, TransactionState } from '@/types'
import { formatUSDC, parseUSDC, parseFuelPrice } from '@/lib/utils'
import { Address } from 'viem'

// Hook for reading contract data
export function useContractReads() {
  const { address } = useAccount()

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read USDC allowance for Cedibets contract
  const { data: usdcAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CEDIBETS] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read user policies
  const { data: userPolicyIds } = useReadContract({
    address: CONTRACTS.CEDIBETS,
    abi: CEDIBETS_ABI,
    functionName: 'getUserPolicies',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read contract balance
  const { data: contractBalance } = useReadContract({
    address: CONTRACTS.CEDIBETS,
    abi: CEDIBETS_ABI,
    functionName: 'getContractBalance',
  })

  // Read premium and payout amounts
  const { data: premiumAmount } = useReadContract({
    address: CONTRACTS.CEDIBETS,
    abi: CEDIBETS_ABI,
    functionName: 'PREMIUM_AMOUNT',
  })

  const { data: payoutAmount } = useReadContract({
    address: CONTRACTS.CEDIBETS,
    abi: CEDIBETS_ABI,
    functionName: 'PAYOUT_AMOUNT',
  })

  return {
    usdcBalance: usdcBalance || 0n,
    usdcAllowance: usdcAllowance || 0n,
    userPolicyIds: userPolicyIds || [],
    contractBalance: contractBalance || 0n,
    premiumAmount: premiumAmount || 0n,
    payoutAmount: payoutAmount || 0n,
  }
}

// Hook for getting user policies with details
export function useUserPolicies() {
  const { address } = useAccount()
  const { userPolicyIds } = useContractReads()

  // Read individual policy details
  const policyQueries = userPolicyIds.map((policyId) => ({
    address: CONTRACTS.CEDIBETS,
    abi: CEDIBETS_ABI,
    functionName: 'getPolicy',
    args: [policyId],
  }))

  // This is a simplified version - in a real app you'd use multicall or individual queries
  // For now, we'll return empty array and implement this properly when needed
  return {
    policies: [] as Policy[],
    isLoading: false,
  }
}

// Hook for contract write operations
export function useContractWrites() {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    hash: null,
  })

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // USDC approval
  const approveUSDC = useCallback(async (amount: bigint) => {
    try {
      setTxState({ isLoading: true, error: null, hash: null })
      
      await writeContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.CEDIBETS, amount],
      })
      
      setTxState(prev => ({ ...prev, hash: hash?.toString() || null }))
    } catch (err: any) {
      setTxState({
        isLoading: false,
        error: err.message || 'Failed to approve USDC',
        hash: null,
      })
    }
  }, [writeContract, hash])

  // Purchase policy
  const purchasePolicy = useCallback(async (
    strikePrice: string,
    expirationDate: Date
  ) => {
    try {
      setTxState({ isLoading: true, error: null, hash: null })
      
      const strikePriceBigInt = parseFuelPrice(strikePrice)
      const expirationTimestamp = BigInt(Math.floor(expirationDate.getTime() / 1000))
      
      await writeContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'purchasePolicy',
        args: [strikePriceBigInt, expirationTimestamp],
      })
      
      setTxState(prev => ({ ...prev, hash: hash?.toString() || null }))
    } catch (err: any) {
      setTxState({
        isLoading: false,
        error: err.message || 'Failed to purchase policy',
        hash: null,
      })
    }
  }, [writeContract, hash])

  // Settle policy (for testing)
  const settlePolicy = useCallback(async (
    policyId: string,
    currentFuelPrice: string
  ) => {
    try {
      setTxState({ isLoading: true, error: null, hash: null })
      
      const policyIdBigInt = BigInt(policyId)
      const fuelPriceBigInt = parseFuelPrice(currentFuelPrice)
      
      await writeContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'checkAndSettlePolicy',
        args: [policyIdBigInt, fuelPriceBigInt],
      })
      
      setTxState(prev => ({ ...prev, hash: hash?.toString() || null }))
    } catch (err: any) {
      setTxState({
        isLoading: false,
        error: err.message || 'Failed to settle policy',
        hash: null,
      })
    }
  }, [writeContract, hash])

  return {
    approveUSDC,
    purchasePolicy,
    settlePolicy,
    txState: {
      ...txState,
      isLoading: txState.isLoading || isPending || isConfirming,
    },
    isSuccess,
  }
}

// Hook for purchasing a policy with approval flow
export function usePurchasePolicy() {
  const { usdcAllowance, premiumAmount } = useContractReads()
  const { approveUSDC, purchasePolicy, txState, isSuccess } = useContractWrites()
  const [step, setStep] = useState<'idle' | 'approving' | 'purchasing' | 'completed'>('idle')

  const purchase = useCallback(async (
    strikePrice: string,
    expirationDate: Date
  ) => {
    try {
      setStep('idle')
      
      // Check if approval is needed
      if (usdcAllowance < premiumAmount) {
        setStep('approving')
        await approveUSDC(premiumAmount)
        
        // Wait for approval to complete
        // In a real app, you'd wait for the approval transaction to be confirmed
        // before proceeding to purchase
      }
      
      setStep('purchasing')
      await purchasePolicy(strikePrice, expirationDate)
      
      if (isSuccess) {
        setStep('completed')
      }
    } catch (error) {
      setStep('idle')
    }
  }, [usdcAllowance, premiumAmount, approveUSDC, purchasePolicy, isSuccess])

  return {
    purchase,
    step,
    txState,
    needsApproval: usdcAllowance < premiumAmount,
  }
}
