'use client'

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { APP_CONFIG } from '@/lib/config'
import { arbitrumSepolia, foundry } from 'viem/chains'
import { ErrorBoundary } from './ErrorBoundary'
import { useState, useEffect } from 'react'

// Create a single instance to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

interface AuthProviderProps {
  children: React.ReactNode
}

const PrivyErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.71 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">Authentication Service Unavailable</h3>
        <p className="mt-2 text-sm text-gray-500">
          We're having trouble connecting to the authentication service. This might be a temporary issue.
        </p>
        
        {error.message.includes('invalid Privy app ID') && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Developer Note:</strong> The Privy App ID may need to be updated in the environment configuration.
            </p>
          </div>
        )}
        
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={retry}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
          <button
            onClick={() => {
              window.location.href = '/readonly'
            }}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Continue in Read-Only Mode
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Fallback component for when authentication fails
function MinimalProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </QueryClientProvider>
  )
}

function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render providers on the server to avoid hydration issues
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // If we've hit an error, show minimal provider
  if (hasError) {
    return <MinimalProvider>{children}</MinimalProvider>
  }

  // Validate Privy App ID before initializing
  const privyAppId = APP_CONFIG.PRIVY_APP_ID
  
  if (!privyAppId || privyAppId === 'your-privy-app-id') {
    console.warn('Invalid or missing Privy App ID. Falling back to minimal provider.')
    return <MinimalProvider>{children}</MinimalProvider>
  }

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <BasePrivyProvider
          appId={privyAppId}
          config={{
            // Customize the login methods
            loginMethods: ['email', 'sms', 'wallet'],
            
            // Customize the appearance
            appearance: {
              theme: 'light',
              accentColor: '#3b82f6',
              logo: '/logo.png',
              showWalletLoginFirst: false,
            },
            
            // Embed wallets configuration
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
              requireUserPasswordOnCreate: false,
            },
            
            // Network configuration
            defaultChain: process.env.NEXT_PUBLIC_DEBUG === 'true' ? foundry : arbitrumSepolia,
            supportedChains: process.env.NEXT_PUBLIC_DEBUG === 'true' ? [foundry, arbitrumSepolia] : [arbitrumSepolia],
            
            // Additional configuration
            legal: {
              termsAndConditionsUrl: '/terms',
              privacyPolicyUrl: '/privacy',
            },
          }}
        >
          <WagmiProvider config={config}>
            {children}
          </WagmiProvider>
        </BasePrivyProvider>
      </QueryClientProvider>
    )
  } catch (error) {
    console.error('Failed to initialize Privy provider:', error)
    setHasError(true)
    return <MinimalProvider>{children}</MinimalProvider>
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ErrorBoundary fallback={PrivyErrorFallback}>
      <PrivyProviderWrapper>
        {children}
      </PrivyProviderWrapper>
    </ErrorBoundary>
  )
}
