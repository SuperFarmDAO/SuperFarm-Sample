// contracts/ERC1155.sol
// spdx-license-identifier: mit

pragma solidity >= 0.6.2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItem is ERC1155, Ownable {
  constructor() public ERC1155("https://game.example/api/item/{id}.json") {
  }

  function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner() {
    _mint(to, id, amount, data);
  }

}