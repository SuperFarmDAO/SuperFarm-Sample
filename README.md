===ENVIROMENT===
- Hardhat
- Ethers
- Unit Testing

===BUG FIXES & IMPROVEMENTS===
- Added comments replacing TODO
- Fixed the ordering of variables inside struct (Solidity packs similar types together for memory managment)
- Removed redundant require checks in the 'listItems' function
- Fixed an iterator variable bug inside 'listItems' function (Replaced 'nextItem' with 'nextItem + j')
- One extra zero in the purchaseItems when considering Basis Points (10000). (1% is 100, 100% is 10000 in Basis Points)
- Changed 'item.amount != 0' to '_amount > 0' in the 'purchaseItem' and 'removeItem' functions.

===SUGGESTIONS===
- The 'listItems' function gets an array of IERC1155 which can be hooked to the shop. And each IERC1155 has sub token IDs that can be NFTs or FTs. While it is 
understandable that the owner can only list items (custodial) but the owner is going to pay alot of gas because of the nested loops. A suggestion is to
make this function a non-custodial function which accepts only one IERC1155 and making the function 'external' so the person who lists pays the gas. Keeping in 
mind the code to be not radically changed, any change of logic in this batch listing will break the inputs from the front end (function parameters). 
Another suggestion would be to completely change the function parameters which accepts only an array of shop items. The suggestions can be found in the 
Suggestion_listItems file in the root of project
- It is a good idea to use addresses inside structs rather than interface pointer variables (address instead of IERC20)

===CURRENT LISTITEMS===
This image can help to understand how the current 'listItems' works
![](images/listItems.jpeg)

===DEPLOYMENT DETAILS
- Shop address: 0xf11894A2EF1887a010dCe68603eac21F0CEDF603
- ERC20 address: 0x8432e5423F499764e2ae76f40d98E2489b5f68f2
- ERC1155 address: 0xCA4cE588A6311A29eBf05bc564f333339211d060