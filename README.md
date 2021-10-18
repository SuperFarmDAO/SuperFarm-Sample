## ENVIROMENT
 - Hardhat 
 - Ethers 
 - Mocha

## BRIEF FOR WHAT SMART CONTRACT CAN BE USED
 Shop smart contract is ERC1155Holder contract that can be used for selling ERC1155 assets for native tokens(ETH) or ERC20 tokens. The owner of this contract can list items, change items's price or remove them. Other users can buy items.

## BUG FIXES & IMPROVEMENTS
- Replaced TODO with comment for docgen.
- Added name of contract in require's messages.
- Added precision variable instead of fixed value in division operation when fees calculates.
- Replaced uint by enum in PricePair struct to save one slot.
- Removed unnesassary storage writes in for loop in listItems() function. Add variable for increasing nextItamId at the end.
- Remove redundant requires in for loop in listItems() function.
- Wrote tests.
- Add ERC20 and ERC1155 contracts for testing.
- Wrote deploy scripts

## SUGGESTIONS 
  - Update solidity version to newer version 0.8.6+
  - Add events in functions.
  - make contract upgradeable.

## DEPLOYMENT DETAILS
Rinkeby  
  SHOP_ADDRESS = 0xc050A580d0B8637F8fdb038d4E5Fd83B98e86a12  
  TESTING_TOKENS_ADDRESS = 0xBDFb5519ac401A2a2d27242833B3a1bCa8a12193  
  TESTING_NFT_ITEMS_ADDRESS = 0x6D620E9A32af5EDED4BB7203C493bAf4FD5c6111 