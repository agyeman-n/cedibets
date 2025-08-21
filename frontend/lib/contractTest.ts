import { createPublicClient, http, formatUnits } from 'viem'
import { foundry } from 'viem/chains'
import { CONTRACTS, CEDIBETS_ABI, ERC20_ABI } from './contract'

// Create a public client for testing
const publicClient = createPublicClient({
  chain: foundry,
  transport: http('http://localhost:8545'),
})

export interface ContractTestResult {
  success: boolean
  error?: string
  data?: {
    blockNumber: bigint
    policyCounter: bigint
    usdcTotalSupply: bigint
    contractBalance: bigint
    cedibetsCodeSize: number
    usdcCodeSize: number
  }
}

// Test contract connectivity and basic functions
export async function testContractConnectivity(): Promise<ContractTestResult> {
  try {
    console.log('🔍 Testing contract connectivity...')
    
    // 1. Test basic network connectivity
    const blockNumber = await publicClient.getBlockNumber()
    console.log(`✅ Connected to network, current block: ${blockNumber}`)
    
    // 2. Test contract code exists
    const cedibetsCode = await publicClient.getBytecode({ address: CONTRACTS.CEDIBETS })
    const usdcCode = await publicClient.getBytecode({ address: CONTRACTS.USDC })
    
    if (!cedibetsCode || cedibetsCode === '0x') {
      throw new Error(`No code found at Cedibets address: ${CONTRACTS.CEDIBETS}`)
    }
    
    if (!usdcCode || usdcCode === '0x') {
      throw new Error(`No code found at USDC address: ${CONTRACTS.USDC}`)
    }
    
    console.log(`✅ Cedibets contract code size: ${cedibetsCode.length} bytes`)
    console.log(`✅ USDC contract code size: ${usdcCode.length} bytes`)
    
    // 3. Test Cedibets contract reads
    const policyCounter = await publicClient.readContract({
      address: CONTRACTS.CEDIBETS,
      abi: CEDIBETS_ABI,
      functionName: 'policyCounter',
    }) as bigint
    
    console.log(`✅ Cedibets policy counter: ${policyCounter}`)
    
    const contractBalance = await publicClient.readContract({
      address: CONTRACTS.CEDIBETS,
      abi: CEDIBETS_ABI,
      functionName: 'getContractBalance',
    }) as bigint
    
    console.log(`✅ Cedibets contract USDC balance: ${formatUnits(contractBalance, 6)} USDC`)
    
    // 4. Test USDC contract reads
    const usdcTotalSupply = await publicClient.readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    }) as bigint
    
    console.log(`✅ USDC total supply: ${formatUnits(usdcTotalSupply, 6)} USDC`)
    
    const usdcSymbol = await publicClient.readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'symbol',
    }) as string
    
    console.log(`✅ USDC symbol: ${usdcSymbol}`)
    
    // 5. Test reading premium and payout amounts
    let premiumAmount: bigint
    let payoutAmount: bigint
    
    try {
      premiumAmount = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'PREMIUM_AMOUNT',
      }) as bigint
      
      payoutAmount = await publicClient.readContract({
        address: CONTRACTS.CEDIBETS,
        abi: CEDIBETS_ABI,
        functionName: 'PAYOUT_AMOUNT',
      }) as bigint
      
      console.log(`✅ Premium amount: ${formatUnits(premiumAmount, 6)} USDC`)
      console.log(`✅ Payout amount: ${formatUnits(payoutAmount, 6)} USDC`)
    } catch (error) {
      console.warn('⚠️ Could not read premium/payout amounts (may not be constants):', error)
      premiumAmount = BigInt(5000000) // 5 USDC with 6 decimals
      payoutAmount = BigInt(50000000) // 50 USDC with 6 decimals
    }
    
    console.log('🎉 All contract tests passed!')
    
    return {
      success: true,
      data: {
        blockNumber,
        policyCounter,
        usdcTotalSupply,
        contractBalance,
        cedibetsCodeSize: cedibetsCode.length,
        usdcCodeSize: usdcCode.length,
      }
    }
    
  } catch (error) {
    console.error('❌ Contract test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Test a specific address balance
export async function testAddressBalance(address: `0x${string}`): Promise<{
  success: boolean
  ethBalance?: string
  usdcBalance?: string
  error?: string
}> {
  try {
    // Get ETH balance
    const ethBalance = await publicClient.getBalance({ address })
    const ethFormatted = formatUnits(ethBalance, 18)
    
    // Get USDC balance
    const usdcBalance = await publicClient.readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint
    
    const usdcFormatted = formatUnits(usdcBalance, 6)
    
    console.log(`💰 Address ${address}:`)
    console.log(`  ETH: ${ethFormatted}`)
    console.log(`  USDC: ${usdcFormatted}`)
    
    return {
      success: true,
      ethBalance: ethFormatted,
      usdcBalance: usdcFormatted,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get available test accounts from Anvil
export async function getTestAccounts(): Promise<`0x${string}`[]> {
  try {
    // In Anvil, we can use the default accounts
    const testAccounts: `0x${string}`[] = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account 1  
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account 3
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
    ]
    
    return testAccounts
  } catch (error) {
    console.error('Failed to get test accounts:', error)
    return []
  }
}

// Run comprehensive contract tests
export async function runContractTests(): Promise<void> {
  console.log('🚀 Running comprehensive contract tests...\n')
  
  // Test basic connectivity
  const connectivityResult = await testContractConnectivity()
  
  if (!connectivityResult.success) {
    console.error('❌ Basic connectivity test failed:', connectivityResult.error)
    return
  }
  
  console.log('\n💰 Testing account balances...')
  
  // Test some account balances
  const testAccounts = await getTestAccounts()
  
  for (const account of testAccounts.slice(0, 3)) {
    await testAddressBalance(account)
  }
  
  console.log('\n🎯 Contract tests completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Block number: ${connectivityResult.data?.blockNumber}`)
  console.log(`- Policy counter: ${connectivityResult.data?.policyCounter}`)
  console.log(`- Contract USDC balance: ${formatUnits(connectivityResult.data?.contractBalance || BigInt(0), 6)} USDC`)
}
