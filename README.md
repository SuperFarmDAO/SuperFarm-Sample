# ENVIRONMENT
- Hardhat
- Ethers
- Mocha

# BUG FIXES & OPTIMIZATION
- Added missing NatSpec comment at `TODO` section
- Added enum and changed type of assetType(uint256) in the PricePair struct to enum that created enum and reordered this struct for better slot configuration.
- Changed visibility of nextItemId to public and removed getInventoryCount function.
- Optimized listItems function via add variable in memory, for not to rewrite storage in a loop
- Found and fixed iterator related bug in listItems function.
- Added ReentrancyGuard inheritance for secure by reentrancy attack.
- Removed several requirements in the PurchaseItem function due to their overlap with others.
- Added functionality for return change in cases when items bought for ether in purchaseItem function. 
- Changed fee, royalties and owners profit transfers with idea of change returns.
- Added view function that returns info about inventory item and price pairs for it. Could be useful for frontend.
- Added owner-only setters for feePercent, itemRoyaltyPercent, feeOwner and royaltyOwner.
- Wrote scripts for deploy and verify shop contract at testnet/mainnet.
- Wrote tasks for setting everything up on testnet/mainnet.
- Added ERC20 and ERC1155 contracts for test.
- Wrote full coverage tests, used solidity-coverage.
- Deplyed to rinkeby-testnet and verified on etherscan.
- Generated documentation using docgen.
- Formatted requires.

# SUGGESTIONS
- The listItems function receives only one pricePairs structure, which does not allow to set different price sets for different items, which in turn is not entirely user friendly.
- Some requires i'd remove at contract and set up on backend/frontend side.
- I'll add ability to purchase, remove and change batch of items, like we have at listItems function.

# CONTRACT DEPLOY INFO
Shop contract deployed at rinkeby-testnet: 
https://rinkeby.etherscan.io/address/0xc494aa57bFB0Ac9d7f654382bc248F0224d542bF
