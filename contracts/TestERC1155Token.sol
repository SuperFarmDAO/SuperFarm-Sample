// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

///@title Test ERC1155 token, used only for the test
contract TestERC1155 is ERC1155, AccessControl{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory _URI) ERC1155(_URI) public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function mint(address _to, uint256 _id, uint256 _amount, bytes memory _data) external{
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not the minter");
        _mint(_to, _id, _amount, _data);
    }
}