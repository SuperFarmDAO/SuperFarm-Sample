// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract Token1155 is ERC1155, AccessControl {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() public ERC1155("{_id}") {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);

        // Sets `DEFAULT_ADMIN_ROLE` as ``ADMIN_ROLE``'s admin role.
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, ADMIN_ROLE);

        _mint(msg.sender, 0, 1000*10**18, "");
        _mint(msg.sender, 1, 1000*10**18, "");
        _mint(msg.sender, 2, 1000*10**18, "");
        _mint(msg.sender, 3, 1000*10**18, "");
    }

    function mint(address to, uint256 amount, uint256 id, bytes memory uri) external {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not an minter");
        _mint(to, id, amount, uri);
    }

    function burn(address from, uint256 amount, uint256 id) external {
        require(hasRole(BURNER_ROLE, msg.sender), "Caller is not an burner");
        _burn(from, id, amount);
    }


}