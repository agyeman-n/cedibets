'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useState, useEffect } from 'react'

// Safe wrapper for Privy hooks that handles provider lifecycle
export function usePrivySafe() {
  const [mounted, setMounted] = useState(false)
  const [privyError, setPrivyError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always call hooks (React requirement), but handle errors gracefully
  let privyData: ReturnType<typeof usePrivy>

  try {
    privyData = usePrivy()
  } catch (error) {
    console.warn('Privy provider error:', error)
    if (error instanceof Error) {
      setPrivyError(error.message)
    }
    
    // Return safe defaults when hooks fail
    return {
      ready: false,
      authenticated: false,
      user: null,
      login: () => console.warn('Privy not available'),
      logout: () => console.warn('Privy not available'),
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      mounted,
      privyError,
      isPrivyReady: false,
    }
  }

  // Extract address from Privy user if authenticated
  const address = privyData.authenticated && privyData.user?.wallet?.address 
    ? privyData.user.wallet.address as `0x${string}`
    : undefined

  // Return actual data if hooks work
  return {
    // Privy data
    ready: mounted && privyData.ready,
    authenticated: privyData.authenticated,
    user: privyData.user,
    login: privyData.login,
    logout: privyData.logout,

    // Derived wallet data from Privy (not wagmi)
    address,
    isConnected: privyData.authenticated && !!address,
    isConnecting: false,
    isDisconnected: !privyData.authenticated || !address,

    // Safe state flags
    mounted,
    privyError,
    isPrivyReady: mounted && privyData.ready && !privyError,
  }
}

// Helper to get component safety state (no JSX in hooks)
export function getPrivySafetyState() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return {
    isMounted: mounted,
    shouldShowLoadingState: !mounted,
  }
}
