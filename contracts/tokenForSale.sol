//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TRADETOKEN is ERC1155, Ownable {
    constructor(string memory _uri) ERC1155(_uri) {}

    /**
     * Function that mints some amount of token type to address.
     * @param _account Address where we want to mint tokens.
     * @param _tokenId Id which will be assigned to the token.
     * @param _amount Amount of token by id to mint.
     * @param _data It is additional data, it has no specified format and it is sent in call to _account.
     */
    function mint(
        address _account,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data
    ) external onlyOwner {
        _mint(_account, _tokenId, _amount, _data);
    }

    /*/**
     * Function that sets URI.
     * @param _newURI Sets a new URI for all token types.
     */
    /*function setURI(string memory _newURI) external onlyOwner {
        _setURI(_newURI);
    }*/
}
