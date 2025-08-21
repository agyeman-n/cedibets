#!/bin/bash

# Cedibets Local Development Startup Script
# This script helps you start the local development environment

echo "🚀 Starting Cedibets Local Development Environment"
echo "=================================================="

# Check if Anvil is already running
if curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ Anvil is already running on port 8545"
else
    echo "📡 Starting Anvil (local blockchain)..."
    echo "   This will start a new terminal window with Anvil"
    echo "   Keep that terminal open while developing"
    echo ""
    echo "   Anvil will provide:"
    echo "   - 10 pre-funded accounts with 10,000 ETH each"
    echo "   - Fast block times (1 second)"
    echo "   - RPC endpoint: http://localhost:8545"
    echo ""
    
    # Start Anvil in a new terminal (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && anvil --port 8545 --accounts 10 --balance 10000"'
    else
        echo "Please start Anvil manually in a new terminal:"
        echo "anvil --port 8545 --accounts 10 --balance 10000"
    fi
    
    echo "⏳ Waiting for Anvil to start..."
    sleep 3
fi

# Check if Anvil is now running
if curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ Anvil is running successfully"
else
    echo "❌ Anvil is not running. Please start it manually:"
    echo "   anvil --port 8545 --accounts 10 --balance 10000"
    exit 1
fi

echo ""
echo "🔧 Deploying smart contracts..."
echo "=================================================="

# Set private key for deployment (first Anvil account)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Find forge binary
FORGE_CMD=""
if command -v forge &> /dev/null; then
    FORGE_CMD="forge"
elif [ -f "/Users/gyingo/.foundry/bin/forge" ]; then
    FORGE_CMD="/Users/gyingo/.foundry/bin/forge"
elif [ -f "$HOME/.foundry/bin/forge" ]; then
    FORGE_CMD="$HOME/.foundry/bin/forge"
else
    echo "❌ forge command not found. Please ensure Foundry is installed and in PATH"
    exit 1
fi

# Deploy contracts manually (script has environment issues)
echo "Deploying Mock USDC and Cedibets contracts..."

# Deploy Mock USDC
echo "1. Deploying Mock USDC..."
USDC_RESULT=$($FORGE_CMD create --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast test/mocks/MockERC20.sol:MockERC20 --constructor-args "Mock USD Coin" "USDC" 6 2>/dev/null)
USDC_ADDRESS=$(echo "$USDC_RESULT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$USDC_ADDRESS" ]; then
    echo "❌ Failed to deploy Mock USDC"
    exit 1
fi

echo "   Mock USDC deployed to: $USDC_ADDRESS"

# Deploy Cedibets
echo "2. Deploying Cedibets..."
CEDIBETS_RESULT=$($FORGE_CMD create --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast src/Cedibets.sol:Cedibets --constructor-args $USDC_ADDRESS 2>/dev/null)
CEDIBETS_ADDRESS=$(echo "$CEDIBETS_RESULT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$CEDIBETS_ADDRESS" ]; then
    echo "❌ Failed to deploy Cedibets"
    exit 1
fi

echo "   Cedibets deployed to: $CEDIBETS_ADDRESS"

# Mint USDC to deployer
echo "3. Minting USDC to deployer..."
cast send $USDC_ADDRESS "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1000000000000 --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY > /dev/null 2>&1

# Create deployment info file
cat > deployment-local.json << EOF
{
  "network": "local-anvil",
  "chainId": 31337,
  "cedibets": "$CEDIBETS_ADDRESS",
  "usdc": "$USDC_ADDRESS",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "timestamp": $(date +%s),
  "blockNumber": 3
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Smart contracts deployed successfully"
    
    # Read deployment info
    if [ -f "deployment-local.json" ]; then
        echo ""
        echo "📋 Deployment Information:"
        echo "=================================================="
        cat deployment-local.json
    fi
else
    echo "❌ Contract deployment failed"
    exit 1
fi

echo ""
echo "🌐 Setting up frontend..."
echo "=================================================="

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Create frontend environment file if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "⚙️  Creating frontend environment file..."
    
    # Use contract addresses from deployment
    if [ ! -z "$CEDIBETS_ADDRESS" ] && [ ! -z "$USDC_ADDRESS" ]; then
        
        cat > frontend/.env.local << EOF
# Local Development Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Contract Addresses (from local deployment)
NEXT_PUBLIC_CEDIBETS_ADDRESS=${CEDIBETS_ADDRESS}
NEXT_PUBLIC_USDC_ADDRESS=${USDC_ADDRESS}

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Local Anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# App Configuration
NEXT_PUBLIC_APP_NAME=Cedibets (Local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development
NEXT_PUBLIC_DEBUG=true
EOF
        
        echo "✅ Frontend environment file created"
        echo "   Please update NEXT_PUBLIC_PRIVY_APP_ID with your Privy App ID"
    else
        echo "❌ Could not read deployment information"
        exit 1
    fi
else
    echo "✅ Frontend environment file already exists"
fi

echo ""
echo "🎉 Local Development Environment Ready!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "1. Update frontend/.env.local with your Privy App ID"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Visit: http://localhost:3000"
echo "4. Import an Anvil account to MetaMask:"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "🔧 Useful Commands:"
echo "- Check contract state: cast call CONTRACT_ADDRESS 'functionName()' --rpc-url http://localhost:8545"
echo "- Check USDC balance: cast call USDC_ADDRESS 'balanceOf(address)' YOUR_ADDRESS --rpc-url http://localhost:8545"
echo "- Run tests: forge test --fork-url http://localhost:8545"
echo ""
echo "📚 Documentation:"
echo "- Local Development Guide: LOCAL_DEVELOPMENT.md"
echo "- Deployment Guide: DEPLOYMENT.md"
echo "- Oracle Integration: ORACLE_INTEGRATION.md"
echo ""
echo "Happy coding! 🚀"
