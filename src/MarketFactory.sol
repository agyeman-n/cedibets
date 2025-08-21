// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Market.sol";
import "./OutcomeToken.sol";

/**
 * @title MarketFactory
 * @dev Factory contract for creating new prediction markets
 * 
 * This contract handles the deployment of new Market contracts along with their
 * associated YES/NO outcome tokens. It maintains a registry of all created markets
 * and provides functions to query market information.
 */
contract MarketFactory is Ownable, ReentrancyGuard {
    /// @notice Array of all created markets
    address[] public markets;
    
    /// @notice Mapping from market address to market index
    mapping(address => uint256) public marketIndex;
    
    /// @notice Mapping to check if an address is a valid market
    mapping(address => bool) public isValidMarket;
    
    /// @notice Default oracle address for markets
    address public defaultOracle;
    
    /// @notice Minimum resolution time (in seconds from creation)
    uint256 public constant MIN_RESOLUTION_TIME = 1 hours;
    
    /// @notice Maximum resolution time (in seconds from creation)
    uint256 public constant MAX_RESOLUTION_TIME = 365 days;
    
    /// @notice Events
    event MarketCreated(
        address indexed market,
        string question,
        address indexed collateralToken,
        address indexed oracle,
        uint256 resolutionTimestamp,
        address yesToken,
        address noToken
    );
    
    event DefaultOracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    /// @notice Constructor
    constructor(address _defaultOracle) Ownable(msg.sender) {
        require(_defaultOracle != address(0), "Oracle cannot be zero address");
        defaultOracle = _defaultOracle;
    }
    
    /**
     * @notice Create a new prediction market
     * @param _question The market question (e.g., "Will GHS/USD exceed 15.0 by Dec 31, 2024?")
     * @param _collateralToken Address of the collateral token (e.g., USDC)
     * @param _oracle Address authorized to resolve the market (address(0) uses default)
     * @param _resolutionTimestamp When the market can be resolved
     * @return market Address of the created market
     * @return yesToken Address of the YES outcome token
     * @return noToken Address of the NO outcome token
     */
    function createMarket(
        string memory _question,
        address _collateralToken,
        address _oracle,
        uint256 _resolutionTimestamp
    ) external nonReentrant returns (address market, address yesToken, address noToken) {
        // Validation
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_collateralToken != address(0), "Collateral token cannot be zero address");
        require(
            _resolutionTimestamp >= block.timestamp + MIN_RESOLUTION_TIME &&
            _resolutionTimestamp <= block.timestamp + MAX_RESOLUTION_TIME,
            "Invalid resolution timestamp"
        );
        
        // Use default oracle if none specified
        address oracle = _oracle == address(0) ? defaultOracle : _oracle;
        require(oracle != address(0), "Oracle cannot be zero address");
        
        // Generate token symbols based on market index
        uint256 marketId = markets.length;
        string memory yesSymbol = string(abi.encodePacked("YES-", _uint2str(marketId)));
        string memory noSymbol = string(abi.encodePacked("NO-", _uint2str(marketId)));
        
        // Create YES and NO tokens (temporarily owned by factory)
        OutcomeToken yesTokenContract = new OutcomeToken(
            string(abi.encodePacked("YES - ", _question)),
            yesSymbol,
            true,
            address(this) // Temporarily owned by factory
        );
        
        OutcomeToken noTokenContract = new OutcomeToken(
            string(abi.encodePacked("NO - ", _question)),
            noSymbol,
            false,
            address(this) // Temporarily owned by factory
        );
        
        // Create the market contract
        Market marketContract = new Market(
            _question,
            _resolutionTimestamp,
            oracle,
            _collateralToken,
            address(yesTokenContract),
            address(noTokenContract),
            address(this)
        );
        
        // Transfer ownership of tokens to the market contract
        yesTokenContract.transferOwnership(address(marketContract));
        noTokenContract.transferOwnership(address(marketContract));
        
        // Store market information
        market = address(marketContract);
        yesToken = address(yesTokenContract);
        noToken = address(noTokenContract);
        
        markets.push(market);
        marketIndex[market] = marketId;
        isValidMarket[market] = true;
        
        emit MarketCreated(
            market,
            _question,
            _collateralToken,
            oracle,
            _resolutionTimestamp,
            yesToken,
            noToken
        );
    }
    
    /**
     * @notice Get the total number of markets created
     */
    function getMarketsCount() external view returns (uint256) {
        return markets.length;
    }
    
    /**
     * @notice Get markets within a range
     * @param _start Start index (inclusive)
     * @param _end End index (exclusive)
     */
    function getMarkets(uint256 _start, uint256 _end) external view returns (address[] memory) {
        require(_start < _end, "Invalid range");
        require(_end <= markets.length, "End index out of bounds");
        
        address[] memory result = new address[](_end - _start);
        for (uint256 i = _start; i < _end; i++) {
            result[i - _start] = markets[i];
        }
        return result;
    }
    
    /**
     * @notice Get all markets
     */
    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }
    
    /**
     * @notice Get market information by index
     */
    function getMarketByIndex(uint256 _index) external view returns (
        address market,
        string memory question,
        Market.State state,
        uint256 resolutionTimestamp,
        address oracle,
        address collateralToken,
        address yesToken,
        address noToken,
        uint256 totalLiquidity
    ) {
        require(_index < markets.length, "Market index out of bounds");
        
        market = markets[_index];
        Market marketContract = Market(market);
        
        (
            question,
            state,
            resolutionTimestamp,
            oracle,
            collateralToken,
            yesToken,
            noToken,
            ,
            totalLiquidity
        ) = marketContract.getMarketInfo();
    }
    
    /**
     * @notice Get markets by state
     */
    function getMarketsByState(Market.State _state) external view returns (address[] memory) {
        // First pass: count markets with the specified state
        uint256 count = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            Market market = Market(markets[i]);
            if (market.state() == _state) {
                count++;
            }
        }
        
        // Second pass: populate the result array
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            Market market = Market(markets[i]);
            if (market.state() == _state) {
                result[index] = markets[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Update the default oracle address (only owner)
     */
    function updateDefaultOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Oracle cannot be zero address");
        address oldOracle = defaultOracle;
        defaultOracle = _newOracle;
        emit DefaultOracleUpdated(oldOracle, _newOracle);
    }
    
    /**
     * @notice Get markets that are ready to resolve
     */
    function getResolvableMarkets() external view returns (address[] memory) {
        uint256 count = 0;
        
        // First pass: count resolvable markets
        for (uint256 i = 0; i < markets.length; i++) {
            Market market = Market(markets[i]);
            if (market.state() == Market.State.Open && 
                block.timestamp >= market.resolutionTimestamp()) {
                count++;
            }
        }
        
        // Second pass: populate result
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            Market market = Market(markets[i]);
            if (market.state() == Market.State.Open && 
                block.timestamp >= market.resolutionTimestamp()) {
                result[index] = markets[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
