import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUnits, parseUnits } from 'viem'
import { Policy, FormattedPolicy, PolicyStatus } from '@/types'

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format USDC amount (6 decimals) for display
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6)
}

// Parse USDC amount from string to bigint
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6)
}

// Format fuel price (fixed-point format where 3050 = 30.50 GHS)
export function formatFuelPrice(price: bigint): string {
  const priceNumber = Number(price) / 100
  return `${priceNumber.toFixed(2)} GHS`
}

// Parse fuel price from string to fixed-point bigint
export function parseFuelPrice(price: string): bigint {
  const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''))
  return BigInt(Math.round(numericPrice * 100))
}

// Format timestamp to readable date
export function formatDate(timestamp: bigint): Date {
  return new Date(Number(timestamp) * 1000)
}

// Get policy status based on current time and settlement state
export function getPolicyStatus(policy: Policy): PolicyStatus {
  const now = Date.now() / 1000
  const expirationTime = Number(policy.expirationTimestamp)
  
  if (policy.settled) {
    // If settled, check if there was a payout by looking at events
    // For now, we'll assume if settled = true, it was paid out
    // In a real app, you'd check the PolicySettled event logs
    return 'paid-out'
  }
  
  if (now < expirationTime) {
    return 'active'
  }
  
  // Policy has expired but not settled yet
  return 'expired-pending'
}

// Convert Policy struct to FormattedPolicy for UI
export function formatPolicyForUI(policy: Policy): FormattedPolicy {
  return {
    id: policy.id.toString(),
    policyHolder: policy.policyHolder,
    premiumPaid: formatUSDC(policy.premiumPaid),
    payoutAmount: formatUSDC(policy.payoutAmount),
    strikePrice: formatFuelPrice(policy.strikePrice),
    expirationDate: formatDate(policy.expirationTimestamp),
    settled: policy.settled,
    status: getPolicyStatus(policy)
  }
}

// Get status badge color and text
export function getStatusDisplay(status: PolicyStatus): { color: string; text: string } {
  switch (status) {
    case 'active':
      return { color: 'bg-success-100 text-success-700', text: 'Active' }
    case 'expired-pending':
      return { color: 'bg-warning-100 text-warning-700', text: 'Settlement Pending' }
    case 'expired-no-payout':
      return { color: 'bg-gray-100 text-gray-700', text: 'Expired - No Payout' }
    case 'paid-out':
      return { color: 'bg-success-100 text-success-700', text: 'Paid Out' }
    default:
      return { color: 'bg-gray-100 text-gray-700', text: 'Unknown' }
  }
}

// Calculate days until expiration
export function getDaysUntilExpiry(expirationDate: Date): number {
  const now = new Date()
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}

// Format large numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number format (basic)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}
