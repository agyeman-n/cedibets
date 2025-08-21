'use client'

import { Shield, Twitter, Github, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-mobile py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-400 mr-2" />
              <span className="text-xl font-bold">Cedibets</span>
            </div>
            <p className="text-gray-400 text-sm">
              Simple insurance protection against rising fuel prices in Ghana. 
              Powered by blockchain technology.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="hover:text-white transition-colors">
                  Risk Disclaimer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="mailto:hello@cedibets.com" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/cedibets" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com/cedibets" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Built with ❤️ in Ghana
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © {currentYear} Cedibets. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-xs text-gray-500">
              Powered by Arbitrum • Secured by Blockchain
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
