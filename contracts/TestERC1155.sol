// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//This is only for test
contract TestERC1155 is ERC1155("URI"), Ownable{
    function mint(address _to, uint256 _id, uint256 _amount, bytes memory _data) external onlyOwner{
        _mint(_to, _id, _amount, _data);
    }

}