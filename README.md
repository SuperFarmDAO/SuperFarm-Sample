# ENVIROMENT
- Hardhat
- Ethers
- For testing: chai/mocha

# BUG FIXES & IMPROVEMENTS
- Added comments replacing TODO
- Completely redesigned the structure of smartcontract methods, in particular merged the structures, removed unnecessary mappings. 
- Removed redundant require checks in contract.
- Completely redid the listItems function because it wastes too much gas when used. 
- Added a task that adds items to the shop.
- Added ERC20 and ERC1155 token contracts for tests
- Changed the variables to payable royaltyOwner and feeOwner. 

# SUGGESTIONS
- Since I have changed the logic of the smart contract functions a lot, I understand that this may break the logic of the whole project, but these changes are necessary so that the contract consumes less gas, and the contract code is easier to maintain
- It is a good idea to use addresses inside structs rather than interface pointer variables (address instead of IERC20)
- I would add updaters for each global variable in the contract, just in case something needs to be changed. 
- I think adding AccessControl is a good idea. You could use it to differentiate contract management. Perhaps some functions would be performed by the backend and some functions by the users.
- I would add a method by which you can update any item in the store, in case there is an error when adding items.


# DEPLOYMENT DETAILS
- SHOP_ADDRESS=0x831333417425eb9824d3837fd769fee600157ad1
- TOKEN20_ADDRESS=0xE84e771d2D69Fe18f8d6e42054529c89598B93A2
- TOKEN1155_ADDRESS=0x29c8Da8243b174bA32cA1606deE3C5e5cdC23be0