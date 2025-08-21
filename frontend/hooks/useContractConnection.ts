'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { Address, formatUnits, parseUnits } from 'viem'
import { CONTRACTS, CEDIBETS_ABI, ERC20_ABI } from '@/lib/contract'

// Types for better type safety
export interface ContractConnectionState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  chainId: number | null
  blockNumber: bigint | null
  lastUpdated: number
}

export interface TokenBalance {
  balance: bigint
  formatted: string
  symbol: string
  decimals: number
}

export interface PolicyData {
  id: bigint
  policyHolder: Address
  premiumPaid: bigint
  payoutAmount: bigint
  strikePrice: bigint
  expirationTimestamp: bigint
  settled: boolean
}

// Custom errors for better error handling
export class ContractConnectionError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'ContractConnectionError'
  }
}

export class ContractReadError extends Error {
  constructor(message: string, public readonly functionName: string) {
    super(message)
    this.name = 'ContractReadError'
  }
}

export class ContractWriteError extends Error {
  constructor(message: string, public readonly functionName: string, public readonly txHash?: string) {
    super(message)
    this.name = 'ContractWriteError'
  }
}

export function useContractConnection() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [connectionState, setConnectionState] = useState<ContractConnectionState>({
    isConnected: false,
    isLoading: true,
    error: null,
    chainId: null,
    blockNumber: null,
    lastUpdated: 0,
  })

  // Validate contract addresses
  const validateContractAddresses = useCallback(() => {
    const issues: string[] = []
    
    if (!CONTRACTS.CEDIBETS || CONTRACTS.CEDIBETS === '0x0000000000000000000000000000000000000000') {
      issues.push('Cedibets contract address not configured')
    }
    
    if (!CONTRACTS.USDC || CONTRACTS.USDC === '0x0000000000000000000000000000000000000000') {
      issues.push('USDC contract address not configured')
    }
    
    return issues
  }, [])

  // Test contract connectivity
  const testContractConnection = useCallback(async () => {
    if (!publicClient) {
      throw new ContractConnectionError('Public client not available')
    }

    try {
      // Test basic chain connectivity
      const chainId = await publicClient.getChainId()
      const blockNumber = await publicClient.getBlockNumber()
      
      // Test contract exists and has code
      const contractCode = await publicClient.getBytecode({
        address: CONTRACTS.CEDIBETS,
      })
      
      if (!contractCode || contractCode === '0x') {
        throw new ContractConnectionError(
          `No contract found at address ${CONTRACTS.CEDIBETS}. Please verify the contract is deployed.`
        )
      }

      // Test a simple read operation
      const policyCounter = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'policyCounter',
      })

      return {
        chainId,
        blockNumber,
        policyCounter: policyCounter as bigint,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new ContractConnectionError(`Contract connection test failed: ${error.message}`)
      }
      throw new ContractConnectionError('Unknown error during contract connection test')
    }
  }, [publicClient])

  // Initialize and test connection
  useEffect(() => {
    let mounted = true
    
    const initializeConnection = async () => {
      setConnectionState(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        // Validate addresses first
        const addressIssues = validateContractAddresses()
        if (addressIssues.length > 0) {
          throw new ContractConnectionError(`Configuration issues: ${addressIssues.join(', ')}`)
        }

        // Test connection
        const testResult = await testContractConnection()
        
        if (mounted) {
          setConnectionState({
            isConnected: true,
            isLoading: false,
            error: null,
            chainId: testResult.chainId,
            blockNumber: testResult.blockNumber,
            lastUpdated: Date.now(),
          })
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
          setConnectionState({
            isConnected: false,
            isLoading: false,
            error: errorMessage,
            chainId: null,
            blockNumber: null,
            lastUpdated: Date.now(),
          })
        }
      }
    }

    initializeConnection()
    
    return () => {
      mounted = false
    }
  }, [publicClient, validateContractAddresses, testContractConnection])

  // Read user's USDC balance
  const readUSDCBalance = useCallback(async (address: Address): Promise<TokenBalance> => {
    if (!publicClient) {
      throw new ContractReadError('Public client not available', 'readUSDCBalance')
    }

    try {
      const [balance, decimals, symbol] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: CONTRACTS.USDC,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }) as Promise<string>,
      ])

      return {
        balance,
        formatted: formatUnits(balance, decimals),
        symbol,
        decimals,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractReadError(`Failed to read USDC balance: ${message}`, 'readUSDCBalance')
    }
  }, [publicClient])

  // Read user's USDC allowance for the Cedibets contract
  const readUSDCAllowance = useCallback(async (ownerAddress: Address): Promise<bigint> => {
    if (!publicClient) {
      throw new ContractReadError('Public client not available', 'readUSDCAllowance')
    }

    try {
      const allowance = await publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, CONTRACTS.CEDIBETS],
      }) as bigint

      return allowance
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractReadError(`Failed to read USDC allowance: ${message}`, 'readUSDCAllowance')
    }
  }, [publicClient])

  // Read a user's policies
  const readUserPolicies = useCallback(async (address: Address): Promise<bigint[]> => {
    if (!publicClient) {
      throw new ContractReadError('Public client not available', 'readUserPolicies')
    }

    try {
      const policyIds = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'getUserPolicies',
        args: [address],
      }) as bigint[]

      return policyIds
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractReadError(`Failed to read user policies: ${message}`, 'readUserPolicies')
    }
  }, [publicClient])

  // Read policy details
  const readPolicy = useCallback(async (policyId: bigint): Promise<PolicyData> => {
    if (!publicClient) {
      throw new ContractReadError('Public client not available', 'readPolicy')
    }

    try {
      const policy = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'getPolicy',
        args: [policyId],
      }) as any[] // Will be a tuple that matches the Policy struct

      return {
        id: policy[0],
        policyHolder: policy[1],
        premiumPaid: policy[2],
        payoutAmount: policy[3],
        strikePrice: policy[4],
        expirationTimestamp: policy[5],
        settled: policy[6],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractReadError(`Failed to read policy ${policyId}: ${message}`, 'readPolicy')
    }
  }, [publicClient])

  // Approve USDC spending
  const approveUSDC = useCallback(async (amount: bigint): Promise<string> => {
    if (!walletClient) {
      throw new ContractWriteError('Wallet client not available', 'approveUSDC')
    }

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.CEDIBETS, amount],
      })

      return hash
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractWriteError(`Failed to approve USDC: ${message}`, 'approveUSDC')
    }
  }, [walletClient])

  // Purchase a policy
  const purchasePolicy = useCallback(async (strikePrice: bigint, expirationTimestamp: bigint): Promise<string> => {
    if (!walletClient) {
      throw new ContractWriteError('Wallet client not available', 'purchasePolicy')
    }

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'purchasePolicy',
        args: [strikePrice, expirationTimestamp],
      })

      return hash
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ContractWriteError(`Failed to purchase policy: ${message}`, 'purchasePolicy')
    }
  }, [walletClient])

  // Retry connection
  const retryConnection = useCallback(async () => {
    setConnectionState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const testResult = await testContractConnection()
      setConnectionState({
        isConnected: true,
        isLoading: false,
        error: null,
        chainId: testResult.chainId,
        blockNumber: testResult.blockNumber,
        lastUpdated: Date.now(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastUpdated: Date.now(),
      }))
    }
  }, [testContractConnection])

  return {
    // Connection state
    ...connectionState,
    
    // Actions
    retryConnection,
    
    // Read operations
    readUSDCBalance,
    readUSDCAllowance,
    readUserPolicies,
    readPolicy,
    
    // Write operations
    approveUSDC,
    purchasePolicy,
    
    // Constants for the UI
    PREMIUM_AMOUNT: parseUnits('5', 6), // 5 USDC
    PAYOUT_AMOUNT: parseUnits('50', 6), // 50 USDC
  }
}
