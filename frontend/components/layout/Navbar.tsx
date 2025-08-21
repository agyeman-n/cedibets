'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Shield, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { truncateAddress } from '@/lib/utils'

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Get user identifier (email or phone)
  const userIdentifier = user?.email?.address || user?.phone?.number || user?.wallet?.address

  const handleAuth = () => {
    if (authenticated) {
      logout()
    } else {
      login()
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-mobile">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">Cedibets</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </a>
            <a href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
              My Policies
            </a>
            <a href="/how-it-works" className="text-gray-700 hover:text-primary-600 transition-colors">
              How It Works
            </a>
          </div>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center">
            {ready && (
              <>
                {authenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <User className="h-4 w-4" />
                      <span>
                        {userIdentifier && userIdentifier.includes('@') 
                          ? userIdentifier.split('@')[0]
                          : userIdentifier && userIdentifier.startsWith('+')
                          ? userIdentifier
                          : userIdentifier
                          ? truncateAddress(userIdentifier)
                          : 'User'
                        }
                      </span>
                    </div>
                    <button
                      onClick={handleAuth}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAuth}
                    className="btn-primary"
                  >
                    Get Started
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-up">
            <div className="flex flex-col space-y-4">
              <a 
                href="/" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a 
                href="/dashboard" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Policies
              </a>
              <a 
                href="/how-it-works" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              
              {/* Mobile Auth */}
              {ready && (
                <div className="pt-4 border-t border-gray-200">
                  {authenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>
                          {userIdentifier && userIdentifier.includes('@') 
                            ? userIdentifier.split('@')[0]
                            : userIdentifier && userIdentifier.startsWith('+')
                            ? userIdentifier
                            : userIdentifier
                            ? truncateAddress(userIdentifier)
                            : 'User'
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          handleAuth()
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        handleAuth()
                        setIsMenuOpen(false)
                      }}
                      className="btn-primary w-full"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
