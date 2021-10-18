# ENVIROMENT
 - Hardhat 
 - Ethers 
 - Mocha

# BRIEF FOR WHAT SMART CONTRACT CAN BE USED
 Shop smart contract is ERC1155Holder contract that can be used for selling ERC1155 assets for native tokens(ETH) or ERC20 tokens. The owner of this contract can list items, change items's price or remove them. Other users can buy items.

# BUG FIXES & IMPROVEMENTS
- Replaced TODO with comment for docgen.
- Replaced uint by enum in PricePair struct to save one slot.
- Removed unnesassary storage writes in for loop in listItems() function. Add variable for increasing nextItamId at the end.
- Remove redundant requires in for loop in listItems() function.
- Wrote tests.
- Add ERC20 and ERC1155 contracts for testing.
- Wrote deploy scripts

# SUGGESTIONS 
  - Update solidity version to newer version 0.8.6+
  - Add events in functions.

# DEPLOYMENT DETAILS
Rinkeby
  SHOP_ADDRESS =
  TESTING_TOKENS_ADDRESS =  
  TESTING_NFT_ITEMS_ADDRESS = 