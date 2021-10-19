# ENVIROMENT

- Hardhat
- Ethers
- Tests: chai/mocha

# BUG FIXES & IMPROVEMENTS

- Added nonReentrant modifier to `purchaseItem` function.
- Added payable modifier to `royaltyOwner` and `feeOwner` parameters.
- Added comments replacing `//TODO`.
- Changed the type of assetType parameter in PricePair struct from `uint256` to `enum` hence to fewer storage allocations and
cheaper writing.
- Changed the type of `token` variable from interface pointer to an address inside `ShopItem` struct.
- Changed the type of `_items` parameter from an array of interface pointer to an address array inside `listItems` function accordingly. Wrapped address type parameter using interface pointer inside the function.
- Removed redundant initialization `nextItemId = 0` from the constructor. Each type in Solidity has a default value. For example, boolean has a default value of false, integer has 0 by default and strings' default value is "".
- Removed excessive require checks in the contract, modified require condition from`item.amount != 0` to `_amount > 0`
in the `purchaseItem` and `removeItem` functions.
- Fixed an iterator variable bug inside the `listItems` function.
- Added view function to get all the global parametrs at once. Could be useful for handling and optimizing variable number of requests and its parameters to the node, i.e Infura, Alchemy, etc.
- Added ERC20 and ERC1155 test contracts.
- Added unit tests.
- Added some tasks.
- Added Docgen and Coverage.

# SUGGESTIONS

Suggestions that do not break the logic of the contract:\
The following changes will alter the abi file. However, this will not result in a front-end or back-end behavior when replacing the old version of the file with the new one.
- Update the solidity version to `^0.8.7`. This will remove unnecessary SafeMath imports and pragma experimental `ABIEncoderV2`. As of `^0.8.0` `ABI coder v2` is activated by default, arithmetic operations revert on underflow and overflow.
- Add events to the contract, i.e `ItemPurchased (address indexed buyer, uint256 indexed itemId, uint256 amount, uint256 assetId)`, `ItemRemoved (uint256 indexed itemId, uint256 amount)` etc, hence to easy logging for any back-end type services. 
- Kepping the `listItems` function's logic unchanged, I would rewrite the 'loop' part of the function using inline assembly to lower the gas consumption. 

Suggestions that do break the logic of the contract:
- Since `listItems` function writes same PricePairs for every item, I'd make a map of PricePairs, for every item.id there is a set of PricePairs.
- Make another non-custodial `listItems` type function with `external` modifier which accepts single IERC1155 hence to letting other people not only list their tokens but also pay the gas for it.

# Deployment & Etherscan verification

Rinkeby:
- Shop contract address: 0x1918aa7de6b798371fa18BACF1792B6afad1244E
- ERC20 asset address: 0x9d826a57dF3a93de5708E83d89dD410FC0B83BD4
- ERC1155 item address: 0x688921Db1dFC814Ba01da733c4eFc69A9bf0B381