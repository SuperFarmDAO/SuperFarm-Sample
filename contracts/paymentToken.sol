//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TKN is ERC20, AccessControl {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * Function that mints some amount of TKN to address.
     * @param _account Address where we want to mint tokens.
     * @param _amount Amount of TKN that we want to mint.
     */
    function mint(address _account, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _mint(_account, _amount);
    }
}
