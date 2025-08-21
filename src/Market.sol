// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OutcomeToken.sol";

/**
 * @title Market
 * @dev AMM-based prediction market contract for binary outcomes
 * 
 * This contract implements a constant product AMM where:
 * - Users can provide liquidity by depositing collateral to receive YES and NO tokens
 * - Users can trade collateral for outcome tokens and vice versa
 * - Prices are determined by the AMM formula and always sum to 1 collateral unit
 * - After resolution, winning tokens can be redeemed 1:1 for collateral
 */
contract Market is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    /// @notice Market states
    enum State { Open, Resolving, Resolved }
    
    /// @notice Current state of the market
    State public state;
    
    /// @notice The market question being predicted
    string public question;
    
    /// @notice Timestamp when the market can be resolved
    uint256 public resolutionTimestamp;
    
    /// @notice Address authorized to resolve the market
    address public oracle;
    
    /// @notice Collateral token (e.g., USDC)
    IERC20 public immutable collateralToken;
    
    /// @notice YES outcome token
    OutcomeToken public immutable yesToken;
    
    /// @notice NO outcome token
    OutcomeToken public immutable noToken;
    
    /// @notice The winning token after resolution (address(0) if unresolved)
    address public winningToken;
    

    
    /// @notice Total collateral deposited as liquidity
    uint256 public totalLiquidity;
    
    /// @notice Fee taken on trades (in basis points, e.g., 30 = 0.3%)
    uint256 public constant TRADING_FEE = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Accumulated fees from trading
    uint256 public accumulatedFees;
    
    /// @notice Events
    event LiquidityAdded(address indexed provider, uint256 amount);
    event TokensPurchased(address indexed buyer, address indexed token, uint256 amountIn, uint256 tokensOut);
    event TokensSold(address indexed seller, address indexed token, uint256 tokensIn, uint256 amountOut);
    event MarketResolved(bool isYesOutcome, address winningToken);
    event TokensRedeemed(address indexed user, uint256 amount);
    
    /// @notice Constructor
    constructor(
        string memory _question,
        uint256 _resolutionTimestamp,
        address _oracle,
        address _collateralToken,
        address _yesToken,
        address _noToken,
        address _factory
    ) Ownable(_factory) {
        require(_resolutionTimestamp > block.timestamp, "Resolution time must be in future");
        require(_oracle != address(0), "Oracle cannot be zero address");
        require(_collateralToken != address(0), "Collateral token cannot be zero address");
        
        question = _question;
        resolutionTimestamp = _resolutionTimestamp;
        oracle = _oracle;
        collateralToken = IERC20(_collateralToken);
        yesToken = OutcomeToken(_yesToken);
        noToken = OutcomeToken(_noToken);
        state = State.Open;
    }
    
    /**
     * @notice Add liquidity to the market
     * @param _amount Amount of collateral to deposit
     * @dev Mints equal amounts of YES and NO tokens to the liquidity provider
     */
    function addLiquidity(uint256 _amount) external nonReentrant {
        require(state == State.Open, "Market not open");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Mint equal amounts of YES and NO tokens
        yesToken.mint(msg.sender, _amount);
        noToken.mint(msg.sender, _amount);
        
        // Update liquidity tracking
        totalLiquidity += _amount;
        
        emit LiquidityAdded(msg.sender, _amount);
    }
    
    /**
     * @notice Buy outcome tokens with collateral
     * @param _tokenToBuy Address of the outcome token to buy (YES or NO)
     * @param _amountIn Amount of collateral to spend
     */
    function buy(address _tokenToBuy, uint256 _amountIn) external nonReentrant {
        require(state == State.Open, "Market not open");
        require(_amountIn > 0, "Amount must be greater than 0");
        require(_tokenToBuy == address(yesToken) || _tokenToBuy == address(noToken), "Invalid token");
        
        // Calculate fee
        uint256 fee = (_amountIn * TRADING_FEE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = _amountIn - fee;
        
        // Calculate tokens to mint based on AMM formula
        uint256 tokensOut = _calculateTokensOut(_tokenToBuy, amountAfterFee);
        require(tokensOut > 0, "Insufficient output amount");
        
        // Transfer collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), _amountIn);
        
        // Mint outcome tokens to user
        OutcomeToken(_tokenToBuy).mint(msg.sender, tokensOut);
        
        // Update accumulated fees
        accumulatedFees += fee;
        
        emit TokensPurchased(msg.sender, _tokenToBuy, _amountIn, tokensOut);
    }
    
    /**
     * @notice Sell outcome tokens for collateral
     * @param _tokenToSell Address of the outcome token to sell
     * @param _amountIn Amount of tokens to sell
     */
    function sell(address _tokenToSell, uint256 _amountIn) external nonReentrant {
        require(state == State.Open, "Market not open");
        require(_amountIn > 0, "Amount must be greater than 0");
        require(_tokenToSell == address(yesToken) || _tokenToSell == address(noToken), "Invalid token");
        
        // Calculate collateral to return based on AMM formula
        uint256 collateralOut = _calculateCollateralOut(_tokenToSell, _amountIn);
        require(collateralOut > 0, "Insufficient output amount");
        
        // Calculate fee
        uint256 fee = (collateralOut * TRADING_FEE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = collateralOut - fee;
        
        // Burn tokens from user
        OutcomeToken(_tokenToSell).burn(msg.sender, _amountIn);
        
        // Transfer collateral to user
        collateralToken.safeTransfer(msg.sender, amountAfterFee);
        
        // Update accumulated fees
        accumulatedFees += fee;
        
        emit TokensSold(msg.sender, _tokenToSell, _amountIn, amountAfterFee);
    }
    
    /**
     * @notice Resolve the market (only callable by oracle)
     * @param _isYesOutcome True if YES is the winning outcome, false for NO
     */
    function resolveMarket(bool _isYesOutcome) external {
        require(msg.sender == oracle, "Only oracle can resolve");
        require(block.timestamp >= resolutionTimestamp, "Resolution time not reached");
        require(state == State.Open, "Market already resolved");
        
        state = State.Resolved;
        winningToken = _isYesOutcome ? address(yesToken) : address(noToken);
        
        emit MarketResolved(_isYesOutcome, winningToken);
    }
    
    /**
     * @notice Redeem winning tokens for collateral
     */
    function redeem() external nonReentrant {
        require(state == State.Resolved, "Market not resolved");
        require(winningToken != address(0), "No winning token set");
        
        uint256 winningBalance = IERC20(winningToken).balanceOf(msg.sender);
        require(winningBalance > 0, "No winning tokens to redeem");
        
        // Burn winning tokens
        OutcomeToken(winningToken).burn(msg.sender, winningBalance);
        
        // Transfer collateral 1:1
        collateralToken.safeTransfer(msg.sender, winningBalance);
        
        emit TokensRedeemed(msg.sender, winningBalance);
    }
    
    /**
     * @notice Get current prices for both tokens
     * @return yesPrice Price of YES token in collateral units (scaled by 1e18)
     * @return noPrice Price of NO token in collateral units (scaled by 1e18)
     */
    function getCurrentPrices() external view returns (uint256 yesPrice, uint256 noPrice) {
        if (state != State.Open) {
            return (0, 0);
        }
        
        uint256 yesSupply = yesToken.totalSupply();
        uint256 noSupply = noToken.totalSupply();
        uint256 totalSupply = yesSupply + noSupply;
        
        if (totalSupply == 0) {
            return (5e17, 5e17); // 0.5, 0.5 if no liquidity
        }
        
        // Price = opposite supply / total supply (scaled by 1e18)
        yesPrice = (noSupply * 1e18) / totalSupply;
        noPrice = (yesSupply * 1e18) / totalSupply;
    }
    
    /**
     * @notice Calculate tokens received for a given collateral input
     */
    function _calculateTokensOut(address _token, uint256 _amountIn) internal view returns (uint256) {
        uint256 yesSupply = yesToken.totalSupply();
        uint256 noSupply = noToken.totalSupply();
        
        if (yesSupply == 0 || noSupply == 0) {
            return _amountIn; // 1:1 if no liquidity
        }
        
        // For buying tokens, we use a simplified approach:
        // When buying YES tokens, we increase YES supply and decrease NO supply proportionally
        // The price is determined by the ratio of supplies
        uint256 totalSupply = yesSupply + noSupply;
        
        if (_token == address(yesToken)) {
            // Calculate new supplies after adding collateral
            uint256 newTotalSupply = totalSupply + _amountIn;
            uint256 yesRatio = (yesSupply * 1e18) / totalSupply;
            uint256 tokensOut = (_amountIn * (1e18 - yesRatio)) / 1e18;
            return tokensOut > 0 ? tokensOut : 1; // Ensure at least 1 token
        } else {
            // Calculate new supplies after adding collateral
            uint256 newTotalSupply = totalSupply + _amountIn;
            uint256 noRatio = (noSupply * 1e18) / totalSupply;
            uint256 tokensOut = (_amountIn * (1e18 - noRatio)) / 1e18;
            return tokensOut > 0 ? tokensOut : 1; // Ensure at least 1 token
        }
    }
    
    /**
     * @notice Calculate collateral received for selling tokens
     */
    function _calculateCollateralOut(address _token, uint256 _tokensIn) internal view returns (uint256) {
        uint256 yesSupply = yesToken.totalSupply();
        uint256 noSupply = noToken.totalSupply();
        
        if (yesSupply <= _tokensIn || noSupply <= _tokensIn || yesSupply == 0 || noSupply == 0) {
            return 0; // Cannot sell more than supply or if no liquidity
        }
        
        uint256 totalSupply = yesSupply + noSupply;
        
        if (_token == address(yesToken)) {
            // Selling YES tokens - calculate proportional return
            uint256 proportion = (_tokensIn * 1e18) / yesSupply;
            uint256 collateralOut = (totalSupply * proportion) / (2 * 1e18); // Divide by 2 for balanced return
            return collateralOut > 0 ? collateralOut : 1;
        } else {
            // Selling NO tokens - calculate proportional return
            uint256 proportion = (_tokensIn * 1e18) / noSupply;
            uint256 collateralOut = (totalSupply * proportion) / (2 * 1e18); // Divide by 2 for balanced return
            return collateralOut > 0 ? collateralOut : 1;
        }
    }
    

    
    /**
     * @notice Get market information
     */
    function getMarketInfo() external view returns (
        string memory questionText,
        State marketState,
        uint256 resolution,
        address oracleAddress,
        address collateral,
        address yes,
        address no,
        address winner,
        uint256 liquidity
    ) {
        return (
            question,
            state,
            resolutionTimestamp,
            oracle,
            address(collateralToken),
            address(yesToken),
            address(noToken),
            winningToken,
            totalLiquidity
        );
    }
    
    /**
     * @notice Withdraw accumulated fees (only factory owner)
     */
    function withdrawFees() external onlyOwner {
        require(accumulatedFees > 0, "No fees to withdraw");
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;
        collateralToken.safeTransfer(owner(), fees);
    }
}
