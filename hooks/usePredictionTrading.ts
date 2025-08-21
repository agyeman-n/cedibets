'use client'

import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { MARKET_ABI, ERC20_ABI, CONTRACTS } from '@/lib/contract'
import { usePrivySafe } from './usePrivySafe'

export type TradeType = 'buy' | 'sell'
export type OutcomeType = 'yes' | 'no'

export interface TradeParams {
  marketAddress: string
  tokenAddress: string
  amount: string
  tradeType: TradeType
  outcomeType: OutcomeType
}

export function usePredictionTrading() {
  const { address, isPrivyReady } = usePrivySafe()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { writeContract: writeContractFn, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Buy YES/NO tokens
  const buyTokens = async (params: TradeParams) => {
    if (!address || !isPrivyReady) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const amountInWei = parseUnits(params.amount, 6) // USDC has 6 decimals

      // Call buy function on the market contract
      await writeContractFn({
        address: params.marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'buy',
        args: [params.tokenAddress as `0x${string}`, amountInWei],
      })

    } catch (err) {
      console.error('Buy tokens error:', err)
      setError(err instanceof Error ? err.message : 'Failed to buy tokens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Sell YES/NO tokens
  const sellTokens = async (params: TradeParams) => {
    if (!address || !isPrivyReady) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const amountInWei = parseUnits(params.amount, 18) // Outcome tokens have 18 decimals

      // Call sell function on the market contract
      await writeContractFn({
        address: params.marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'sell',
        args: [params.tokenAddress as `0x${string}`, amountInWei],
      })

    } catch (err) {
      console.error('Sell tokens error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sell tokens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Add liquidity to market
  const addLiquidity = async (marketAddress: string, amount: string) => {
    if (!address || !isPrivyReady) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const amountInWei = parseUnits(amount, 6) // USDC has 6 decimals

      // Call addLiquidity function on the market contract
      await writeContractFn({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'addLiquidity',
        args: [amountInWei],
      })

    } catch (err) {
      console.error('Add liquidity error:', err)
      setError(err instanceof Error ? err.message : 'Failed to add liquidity')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Approve USDC spending
  const approveUSDC = async (amount: string, spenderAddress: string) => {
    if (!address || !isPrivyReady) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const amountInWei = parseUnits(amount, 6) // USDC has 6 decimals

      // Call approve function on USDC contract
      await writeContractFn({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amountInWei],
      })

    } catch (err) {
      console.error('Approve USDC error:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve USDC')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Redeem winning tokens
  const redeemTokens = async (marketAddress: string) => {
    if (!address || !isPrivyReady) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Call redeem function on the market contract
      await writeContractFn({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'redeem',
        args: [],
      })

    } catch (err) {
      console.error('Redeem tokens error:', err)
      setError(err instanceof Error ? err.message : 'Failed to redeem tokens')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate estimated tokens out for buying
  const calculateTokensOut = (marketAddress: string, amountIn: string, tokenAddress: string) => {
    // This would normally call the contract's calculation function
    // For now, return a simple estimate
    const amount = parseFloat(amountIn)
    return (amount * 0.95).toFixed(6) // 5% slippage estimate
  }

  // Calculate estimated USDC out for selling
  const calculateUSDCOut = (marketAddress: string, tokensIn: string, tokenAddress: string) => {
    // This would normally call the contract's calculation function
    // For now, return a simple estimate
    const tokens = parseFloat(tokensIn)
    return (tokens * 0.95).toFixed(6) // 5% slippage estimate
  }

  return {
    // State
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    transactionHash: hash,

    // Actions
    buyTokens,
    sellTokens,
    addLiquidity,
    approveUSDC,
    redeemTokens,

    // Utilities
    calculateTokensOut,
    calculateUSDCOut,
    
    // Clear error
    clearError: () => setError(null),
  }
}
