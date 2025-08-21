# Oracle Integration Guide

This document outlines the current oracle implementation and provides a roadmap for integrating Chainlink Functions to replace the manual fuel price input with real-time data.

## 📋 Current Implementation

### Smart Contract State

The `Cedibets.sol` contract currently uses a placeholder parameter for fuel price data:

```solidity
/**
 * @notice Check and settle a policy based on current fuel price
 * @dev This function uses a placeholder for oracle integration
 * @param _policyId The ID of the policy to settle
 * @param _currentFuelPrice The current fuel price (placeholder for oracle data)
 * 
 * TODO: Replace _currentFuelPrice parameter with Chainlink Functions oracle call
 * The oracle should fetch real-time fuel price data from a reliable API source
 * Example integration point for Chainlink Functions:
 * - Set up Chainlink Functions subscription
 * - Create JavaScript source code to fetch fuel price from API
 * - Handle the oracle response in a callback function
 * - Remove the _currentFuelPrice parameter once oracle is integrated
 */
function checkAndSettlePolicy(
    uint256 _policyId,
    uint256 _currentFuelPrice // TODO: Remove this parameter when oracle is integrated
) external nonReentrant {
    // ... existing settlement logic ...
}
```

### Current Limitations

1. **Manual Price Input**: Requires manual fuel price input for settlement
2. **Centralization Risk**: Relies on trusted parties to provide accurate prices
3. **No Real-time Data**: Cannot automatically trigger settlements
4. **Human Error**: Potential for incorrect price inputs

## 🔗 Chainlink Functions Integration Plan

### Phase 1: Oracle Function Development

#### 1.1 Fuel Price API Research

**Recommended APIs for Ghana Fuel Prices:**

| API Provider | Endpoint | Reliability | Cost | Notes |
|--------------|----------|-------------|------|-------|
| **Ghana National Petroleum Authority (NPA)** | Official government data | High | Free | Most authoritative source |
| **Global Petrol Prices** | https://www.globalpetrolprices.com/Ghana/ | Medium | Free | International comparison |
| **Fuel Price API** | https://fuelpriceapi.com/ | Medium | Paid | Multiple countries |
| **Custom Aggregator** | Multiple sources | High | Development cost | Most reliable |

**Recommended Implementation:**
```javascript
// Multiple source aggregation for reliability
const sources = [
  'https://npa.gov.gh/fuel-prices', // Official NPA data
  'https://www.globalpetrolprices.com/api/ghana', // Backup source
  'https://fuelpriceapi.com/ghana' // Tertiary source
];
```

#### 1.2 Oracle Function Implementation

Create `fuel-price-oracle.js` for Chainlink Functions:

```javascript
const axios = require('axios');

/**
 * Chainlink Functions handler for fetching Ghana fuel prices
 * @param {Array} args - Function arguments [sourceApi, fallbackApi]
 * @returns {string} - Fixed-point fuel price (e.g., "3050" for 30.50 GHS)
 */
async function fetchFuelPrice(args) {
  const sourceApi = args[0] || 'https://npa.gov.gh/api/fuel-prices';
  const fallbackApi = args[1] || 'https://www.globalpetrolprices.com/api/ghana';
  
  try {
    // Primary source attempt
    const primaryResponse = await axios.get(sourceApi, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Chainlink-Functions/1.0'
      }
    });
    
    const fuelPrice = extractFuelPrice(primaryResponse.data);
    return validateAndFormatPrice(fuelPrice);
    
  } catch (primaryError) {
    console.log('Primary source failed, trying fallback:', primaryError.message);
    
    try {
      // Fallback source attempt
      const fallbackResponse = await axios.get(fallbackApi, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Chainlink-Functions/1.0'
        }
      });
      
      const fuelPrice = extractFuelPrice(fallbackResponse.data);
      return validateAndFormatPrice(fuelPrice);
      
    } catch (fallbackError) {
      throw new Error(`All fuel price sources failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Extract fuel price from API response
 * @param {Object} data - API response data
 * @returns {number} - Raw fuel price
 */
function extractFuelPrice(data) {
  // Handle different API response formats
  if (data.petrol_price) return data.petrol_price;
  if (data.prices && data.prices.petrol) return data.prices.petrol;
  if (data.fuel_prices && data.fuel_prices.petrol) return data.fuel_prices.petrol;
  
  // Default extraction logic
  const priceMatch = JSON.stringify(data).match(/"petrol_price":\s*([\d.]+)/);
  if (priceMatch) return parseFloat(priceMatch[1]);
  
  throw new Error('Could not extract fuel price from API response');
}

/**
 * Validate and format price for smart contract
 * @param {number} price - Raw fuel price
 * @returns {string} - Fixed-point formatted price
 */
function validateAndFormatPrice(price) {
  // Validate price range (reasonable fuel prices in Ghana: 10-50 GHS)
  if (price < 10 || price > 50) {
    throw new Error(`Fuel price out of reasonable range: ${price} GHS`);
  }
  
  // Convert to fixed-point format (e.g., 30.50 -> "3050")
  const fixedPointPrice = Math.round(price * 100);
  
  return fixedPointPrice.toString();
}

// Chainlink Functions entry point
module.exports = async (args) => {
  return await fetchFuelPrice(args);
};
```

### Phase 2: Smart Contract Updates

#### 2.1 Updated Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// TODO: Add Chainlink Functions imports
// import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
// import "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";

/**
 * @title Cedibets
 * @dev Fuel price protection contract with oracle integration
 */
contract Cedibets is Ownable, ReentrancyGuard /* TODO: Add FunctionsClient */ {
    
    // ============ Oracle State Variables ============
    
    // TODO: Add Chainlink Functions state variables
    // bytes32 public s_lastRequestId;
    // bytes public s_lastResponse;
    // bytes public s_lastError;
    // uint256 public s_lastFuelPrice;
    // mapping(bytes32 => uint256) public s_requestToPolicyId;
    
    // ============ Existing State Variables ============
    
    struct Policy {
        uint256 id;
        address policyHolder;
        uint256 premiumPaid;
        uint256 payoutAmount;
        uint256 strikePrice;
        uint256 expirationTimestamp;
        bool settled;
    }
    
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public policyCounter;
    IERC20 public immutable USDC_TOKEN;
    uint256 public constant PREMIUM_AMOUNT = 5 * 10**6; // 5 USDC
    uint256 public constant PAYOUT_AMOUNT = 50 * 10**6; // 50 USDC
    
    // ============ Oracle Integration Functions ============
    
    /**
     * @notice Request fuel price from Chainlink Functions oracle
     * @dev Initiates oracle request for policy settlement
     * @param _policyId The policy ID to settle
     */
    function requestFuelPriceSettlement(uint256 _policyId) external nonReentrant {
        // TODO: Implement Chainlink Functions request
        // 1. Validate policy exists and is ready for settlement
        // 2. Create oracle request with policy ID
        // 3. Store request ID mapping
        // 4. Emit oracle request event
        
        Policy storage policy = policies[_policyId];
        
        // Validate policy exists
        if (policy.policyHolder == address(0)) revert PolicyNotFound();
        
        // Check if policy has expired
        if (block.timestamp <= policy.expirationTimestamp) revert PolicyNotExpired();
        
        // Check if policy is already settled
        if (policy.settled) revert PolicyAlreadySettled();
        
        // TODO: Implement oracle request
        // bytes32 requestId = _sendOracleRequest(_policyId);
        // s_requestToPolicyId[requestId] = _policyId;
        
        // For now, revert with instruction
        revert("Oracle integration not yet implemented");
    }
    
    /**
     * @notice Handle oracle response and settle policy
     * @dev Called by Chainlink Functions with fuel price data
     * @param requestId The oracle request ID
     * @param response The oracle response containing fuel price
     * @param err Any error from the oracle
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        // TODO: Implement oracle response handling
        // 1. Validate request ID
        // 2. Parse fuel price from response
        // 3. Settle policy with real price data
        // 4. Handle oracle errors gracefully
        
        uint256 policyId = s_requestToPolicyId[requestId];
        require(policyId != 0, "Invalid request ID");
        
        if (err.length > 0) {
            // Handle oracle error
            emit OracleError(requestId, policyId, err);
            return;
        }
        
        // Parse fuel price from response
        uint256 fuelPrice = abi.decode(response, (uint256));
        
        // Settle policy with real price data
        settlePolicyWithPrice(policyId, fuelPrice);
        
        // Clean up request mapping
        delete s_requestToPolicyId[requestId];
    }
    
    /**
     * @notice Settle policy with provided fuel price
     * @dev Internal function to handle policy settlement
     * @param _policyId The policy ID to settle
     * @param _fuelPrice The current fuel price from oracle
     */
    function settlePolicyWithPrice(uint256 _policyId, uint256 _fuelPrice) internal {
        Policy storage policy = policies[_policyId];
        
        // Mark policy as settled first (CEI pattern)
        policy.settled = true;
        
        // Check if payout condition is met
        if (_fuelPrice > policy.strikePrice) {
            // Ensure contract has sufficient balance for payout
            if (USDC_TOKEN.balanceOf(address(this)) < policy.payoutAmount) {
                revert InsufficientContractBalance();
            }
            
            // Transfer payout to policy holder
            bool success = USDC_TOKEN.transfer(policy.policyHolder, policy.payoutAmount);
            if (!success) revert TransferFailed();
            
            emit PolicySettled(_policyId, policy.payoutAmount, _fuelPrice);
        } else {
            // No payout - policy expires without payment
            emit PolicySettled(_policyId, 0, _fuelPrice);
        }
    }
    
    // ============ Legacy Function (Deprecated) ============
    
    /**
     * @notice Legacy settlement function (deprecated)
     * @dev This function will be removed once oracle integration is complete
     * @param _policyId The policy ID to settle
     * @param _currentFuelPrice Manual fuel price input (deprecated)
     */
    function checkAndSettlePolicy(
        uint256 _policyId,
        uint256 _currentFuelPrice
    ) external nonReentrant {
        // TODO: Remove this function once oracle integration is complete
        // For now, mark as deprecated and redirect to oracle function
        
        emit DeprecatedFunctionCalled("checkAndSettlePolicy", msg.sender);
        revert("Use requestFuelPriceSettlement() instead");
    }
    
    // ============ Events ============
    
    event OracleRequestSent(bytes32 indexed requestId, uint256 indexed policyId);
    event OracleResponseReceived(bytes32 indexed requestId, uint256 fuelPrice);
    event OracleError(bytes32 indexed requestId, uint256 indexed policyId, bytes error);
    event DeprecatedFunctionCalled(string functionName, address caller);
    
    // ... existing events ...
}
```

### Phase 3: Oracle Setup and Configuration

#### 3.1 Chainlink Functions Subscription Setup

1. **Create Subscription**:
   - Visit [Chainlink Functions](https://functions.chain.link/)
   - Create new subscription
   - Fund with LINK tokens (minimum 10 LINK recommended)

2. **Configure Subscription**:
   ```javascript
   // Subscription configuration
   const subscriptionConfig = {
     name: "Cedibets Fuel Price Oracle",
     consumerContract: "YOUR_CEDIBETS_CONTRACT_ADDRESS",
     gasLimit: 300000,
     interval: 0, // On-demand requests only
     callbackGasLimit: 500000,
     requestTimeout: 300, // 5 minutes
     secrets: {
       // Add any API keys if needed
       "API_KEY": "your_api_key_here"
     }
   };
   ```

#### 3.2 Oracle Function Deployment

1. **Test Function Locally**:
   ```bash
   # Test oracle function
   node test-oracle.js
   ```

2. **Deploy to Chainlink Functions**:
   - Upload `fuel-price-oracle.js` to Chainlink Functions
   - Configure function parameters
   - Test with sample data

3. **Verify Function**:
   ```bash
   # Test with sample API response
   curl -X POST https://functions.chain.link/test \
     -H "Content-Type: application/json" \
     -d '{"args": ["https://npa.gov.gh/api/fuel-prices"]}'
   ```

### Phase 4: Integration Testing

#### 4.1 Test Scenarios

1. **Successful Oracle Response**:
   - Policy expires
   - Oracle fetches fuel price
   - Policy settles with payout (if conditions met)

2. **Oracle Error Handling**:
   - API timeout
   - Invalid response format
   - Network errors

3. **Price Validation**:
   - Extreme price values
   - Missing data
   - Format errors

#### 4.2 Test Implementation

```javascript
// test-oracle-integration.js
const { ethers } = require('hardhat');

describe('Oracle Integration', function() {
  let cedibets, owner, user;
  
  beforeEach(async function() {
    [owner, user] = await ethers.getSigners();
    cedibets = await Cedibets.deploy(usdcAddress);
  });
  
  it('Should request fuel price from oracle', async function() {
    // Create test policy
    await cedibets.connect(user).purchasePolicy(3050, futureTimestamp);
    
    // Request settlement
    await cedibets.connect(user).requestFuelPriceSettlement(1);
    
    // Verify oracle request was sent
    // TODO: Mock oracle response
  });
  
  it('Should handle oracle errors gracefully', async function() {
    // Test oracle error scenarios
    // TODO: Implement error handling tests
  });
});
```

## 📊 Oracle Data Sources

### Recommended APIs for Ghana

1. **National Petroleum Authority (NPA)**:
   - **URL**: https://npa.gov.gh/fuel-prices
   - **Reliability**: High (Official government source)
   - **Update Frequency**: Weekly
   - **Format**: HTML/JSON
   - **Cost**: Free

2. **Global Petrol Prices**:
   - **URL**: https://www.globalpetrolprices.com/Ghana/
   - **Reliability**: Medium
   - **Update Frequency**: Daily
   - **Format**: JSON API
   - **Cost**: Free tier available

3. **Custom Aggregator**:
   - **Sources**: Multiple APIs
   - **Reliability**: High (redundant sources)
   - **Update Frequency**: Real-time
   - **Format**: Custom JSON
   - **Cost**: Development cost

### Data Format Standards

```json
{
  "petrol_price": 30.50,
  "diesel_price": 28.75,
  "lpg_price": 12.25,
  "currency": "GHS",
  "last_updated": "2024-01-15T10:30:00Z",
  "source": "NPA",
  "region": "Ghana"
}
```

## 🔧 Implementation Timeline

| Week | Task | Description |
|------|------|-------------|
| 1 | API Research | Identify and test fuel price APIs |
| 2 | Oracle Function | Develop and test Chainlink Functions code |
| 3 | Contract Updates | Update smart contract for oracle integration |
| 4 | Testing | Comprehensive testing of oracle integration |
| 5 | Deployment | Deploy to testnet and verify |
| 6 | Monitoring | Set up monitoring and alerts |

## 🚨 Security Considerations

### Oracle Security

1. **Multiple Data Sources**: Use multiple APIs to prevent single point of failure
2. **Price Validation**: Validate price ranges to prevent manipulation
3. **Error Handling**: Graceful handling of oracle failures
4. **Rate Limiting**: Prevent oracle spam attacks

### Smart Contract Security

1. **Access Control**: Only authorized users can trigger oracle requests
2. **Reentrancy Protection**: Prevent reentrancy attacks during settlement
3. **Gas Optimization**: Efficient oracle request handling
4. **Emergency Pause**: Ability to pause oracle requests if needed

## 📈 Monitoring and Maintenance

### Oracle Health Monitoring

```javascript
// oracle-monitor.js
const monitorOracle = async () => {
  // Check oracle response times
  // Monitor API availability
  // Track settlement success rates
  // Alert on failures
};
```

### Performance Metrics

- **Oracle Response Time**: Target < 30 seconds
- **Settlement Success Rate**: Target > 99%
- **API Uptime**: Target > 99.9%
- **Price Accuracy**: Validate against official sources

## 🔄 Migration Strategy

### Phase 1: Parallel Operation
- Deploy oracle-enabled contract alongside current contract
- Test oracle integration thoroughly
- Maintain manual settlement as backup

### Phase 2: Gradual Migration
- Encourage users to migrate to new contract
- Provide migration incentives
- Monitor oracle performance

### Phase 3: Full Migration
- Deprecate manual settlement function
- Complete migration to oracle-based settlement
- Remove legacy code

## 📞 Support and Resources

### Documentation
- [Chainlink Functions Documentation](https://docs.chain.link/functions)
- [Arbitrum Documentation](https://docs.arbitrum.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### Community
- [Chainlink Discord](https://discord.gg/chainlink)
- [Arbitrum Discord](https://discord.gg/arbitrum)
- [Cedibets Community](https://discord.gg/cedibets)

---

**Note**: This oracle integration guide provides a comprehensive roadmap for replacing manual fuel price input with automated, reliable oracle data. The implementation should be thoroughly tested before mainnet deployment.
