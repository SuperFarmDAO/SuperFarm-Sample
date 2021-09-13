# ENVIROMENT
- Hardhat
- Ethers
- Mocha

# BUG FIXES & IMPROVEMENTS
- Added comments replacing TODO
- Added enum instead of uint256 in the PricePair struct to save up one slot. abiCoder encodes nested types packed so multiple types can take single slot, e.g. address and uint8 (enum)
- Reordered structs so they need less storage allocations when saved, cheaper to write.
- Removed unnecessary storage writes in loop, listItems function. Added memory variable which added to nextItemId in the end.
- Removed redundant require checks in contract and optimized couple others.
- Fixed the iterator bug in listItems function.
- Added view function where grouped shop config variables. Could be useful for saving traffic on node for loading UI.
- Wrote tasks for setting everything up on testnet/mainnet.
- Wrote tests.
- Added ERC20 and ERC1155 test contracts.
- Added gas limit to address.call internal calls in purchaseItem function, not really needed, unless somehow wrong address is set for any of fee receivers and all the items exposed to reentrancy attack.
- Verified on etherscan.
- Docgen and Coverage.

# SUGGESTIONS
- listItems function writes same PricePairs for every item, which behaviour I didn't change, because I don't know if it is intended to be this way. I'd change signature of this function and provide a map of PricePairs as well, so for every item.id there would be a set of PricePairs.
- It is a good idea to use addresses inside structs rather than interface pointer variables (address instead of IERC1155).
- I'd create a configuration struct, which would include all constructor parameters and create a setter for them.

# DEPLOYMENT DETAILS
RInkeby
- Shop contract address - 0x0f0F81599c5B178596d998ab6dF7eF8bA168ff10
- ERC20 asset address - 0x77848418BA768C4C3B1f288e244E0aE3d27574b2
- ERC1155 item address - 0xf68CA60696d79FA287FF10916f34386e7fb9AFf2