// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OutcomeToken
 * @dev ERC-20 token representing a prediction market outcome (YES or NO)
 * 
 * These tokens are minted and burned by the Market contract to represent
 * positions in prediction markets. The Market contract is the only entity
 * that can mint or burn these tokens.
 */
contract OutcomeToken is ERC20, Ownable {
    /// @notice Whether this token represents the YES or NO outcome
    bool public immutable isYesToken;
    
    /**
     * @notice Constructor to create an outcome token
     * @param _name Token name (e.g., "YES - Will GHS/USD exceed 15.0 by Dec 2024?")
     * @param _symbol Token symbol (e.g., "YES-GHS-DEC24")
     * @param _isYesToken True if this represents YES outcome, false for NO
     * @param _initialOwner Address that will initially own this token (typically factory)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        bool _isYesToken,
        address _initialOwner
    ) ERC20(_name, _symbol) Ownable(_initialOwner) {
        isYesToken = _isYesToken;
    }
    
    /**
     * @notice Mint tokens to a user (only callable by market contract)
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
    
    /**
     * @notice Burn tokens from a user (only callable by market contract)
     * @param _from Address to burn tokens from
     * @param _amount Amount of tokens to burn
     */
    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }
    
    /**
     * @notice Get human-readable information about this token
     * @return isYes Whether this is a YES token
     * @return marketAddress The market contract address (owner)
     */
    function getTokenInfo() external view returns (bool isYes, address marketAddress) {
        return (isYesToken, owner());
    }
}
