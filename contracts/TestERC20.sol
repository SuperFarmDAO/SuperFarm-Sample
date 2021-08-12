// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//This is only for test
contract TestERC20 is ERC20("TestERC20", "TERC"), Ownable{
    constructor() public {
        _mint(msg.sender, 2500000000 * 10 ** 18);
    } 
}