// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


/**
  @title A simple Shop contract for selling ERC-1155s for Ether or
         ERC-20 tokens.
  @author Tim Clancy

  This contract allows its owner to list NFT items for sale.
*/
contract Shop is ERC1155Holder, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// A version number for this Shop contract's interface.
    uint256 public version = 1;

    /// A user-specified, descriptive name for this Shop.
    string public name;

    /// An address who is paid fees from this Shop.
    address payable public feeOwner;

    /// A percent to pay to the Shop owner as fee.
    uint256 public feePercent;

    /// A percent to pay to the `royaltyOwner`.
    uint256 public itemRoyaltyPercent;

    /// An address to pay item royalty fees to.
    address payable public royaltyOwner;

    /**
    This struct tracks information about each item of inventory in the Shop.

    @param token The address of an ERC-1155 collection contract containing the
                 item we want to sell.
    @param id The specific ID of the item within the ERC-1155 from `token`.
    @param amount The amount of this specific item on sale in the Shop.
    @param assetType A sentinel value for the specific type of asset being used.
                     1 = Ether.
                     2 = an ERC-20 token, see `asset`.
    @param asset Some more specific information about the asset to charge in.
                 If the `assetType` is 1, we ignore this field.
                 If the `assetType` is 2, we use this address to find the ERC-20
                 token that we should be specifically charging with.
    @param price The amount of the specified `assetType` and `asset` to charge.
  */
    struct ShopItem {
        address token;
        address asset;
        uint256 id;
        uint256 amount;
        uint256 assetType;
        uint256 price;
    }

    // The Shop's inventory of items for sale.
    uint256 nextItemId;
    mapping(uint256 => ShopItem) public inventory;

    /**
    Deploys the contract with initial values.
    @param _name The name of the Shop contract.
    @param _feeOwner The receiver of shop fees.
    @param _feePercent The value in Basis Points to be given to feeOwner.
    @param _itemRoyaltyPercent The value in Basis Points to be given to royaltyOwner.
    @param _royaltyOwner The receiver of royalties.
     */
    constructor(
        string memory _name,
        address payable _feeOwner,
        uint256 _feePercent,
        uint256 _itemRoyaltyPercent,
        address payable _royaltyOwner
    ) public {
        name = _name;
        feeOwner = _feeOwner;
        feePercent = _feePercent;
        itemRoyaltyPercent = _itemRoyaltyPercent;
        royaltyOwner = _royaltyOwner;
        nextItemId = 0;
    }

    /**
    Returns the number of items in the Shop's inventory.

    @return the number of items in the Shop's inventory.
    */
    function getInventoryCount() external view returns (uint256) {
        return nextItemId;
    }

    /**
    Allows the Shop owner to list a new set of NFT items for sale.

    @param _shopItem The item which will be selling in the shop.
  */
    function listItems(ShopItem[] memory _shopItem) external onlyOwner {
        for (uint256 i = 0; i < _shopItem.length; i++) {
            inventory[_shopItem[i].id] = _shopItem[i];

            IERC1155(_shopItem[i].token).safeTransferFrom(
                    msg.sender,
                    address(this),
                    _shopItem[i].id,
                    _shopItem[i].amount,
                    ""
                );   
        }
        nextItemId = nextItemId.add(_shopItem.length);
     
    }

    /**
    Allows the Shop owner to remove items.

    @param _itemId The id of the specific inventory item of this shop to remove.
    @param _amount The amount of the specified item to remove.
  */
    function removeItem(uint256 _itemId, uint256 _amount) external onlyOwner {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount.sub(_amount) >= 0,
            "There is not enough of your desired item to remove."
        );
        inventory[_itemId].amount = inventory[_itemId].amount.sub(_amount);
        IERC1155(item.token).safeTransferFrom(
            address(this),
            msg.sender,
            item.id,
            _amount,
            ""
        );
    }

    /**
    Allows the Shop owner to adjust the prices of an NFT item set.

    @param _itemId The id of the specific inventory item of this shop to adjust.
    @param _price The asset-price pairs at which to sell a single instance of the item.
  */
    function changeItemPrice(
        uint256[] calldata _itemId,
        uint256[] calldata _price
    ) external onlyOwner {
        require(
            _itemId.length == _price.length,
            "Items length cannot be mismatched with prices's length."
        );
        for (uint256 i = 0; i < _itemId.length; i++) {
            inventory[_itemId[i]].price = _price[i];
        }
    }

    /**
    Allows any user to purchase an item from this Shop provided they have enough
    of the asset being used to purchase with.

    @param _itemId The ID of the specific inventory item of this shop to buy.
    @param _amount The amount of the specified item to purchase.
    */
    function purchaseItem(uint256 _itemId, uint256 _amount)
        external
        payable
        nonReentrant
    {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount.sub(_amount) >= 0,
            "There is not enough of your desired item in stock to purchase."
        );

        uint256 price = item.price.mul(_amount);
        // If the sentinel value for the Ether asset type is found, sell for Ether.
        if (item.assetType == 1) {
            require(
                msg.value >= price,
                "You did not send enough Ether to complete this purchase."
            );
            uint256 feeValue = msg.value.mul(feePercent).div(100000);
            uint256 royaltyValue = msg.value.mul(itemRoyaltyPercent).div(
                100000
            );

            (bool success, ) = feeOwner.call{value: feeValue}("");
            require(success, "Platform fee transfer failed.");
            (success, ) = royaltyOwner.call{value: royaltyValue}("");
            require(success, "Creator royalty transfer failed.");
            (success, ) = payable(owner()).call{
                value: msg.value.sub(feeValue).sub(royaltyValue)
            }("");
            require(success, "Shop owner transfer failed.");

            inventory[_itemId].amount = inventory[_itemId].amount.sub(_amount);

            IERC1155(item.token).safeTransferFrom(
                address(this),
                msg.sender,
                item.id,
                _amount,
                ""
            );

            // Otherwise, attempt to sell for an ERC20 token.
        } else {
            IERC20 sellingAsset = IERC20(item.asset);

            require(
                sellingAsset.balanceOf(msg.sender) >= price,
                "You do not have enough token to complete this purchase."
            );
            sellingAsset.safeTransferFrom(msg.sender, address(this), item.price);
            uint256 feeValue = price.mul(feePercent).div(1000000);
            uint256 royaltyValue = price.mul(itemRoyaltyPercent).div(1000000);

            sellingAsset.safeTransfer(feeOwner, feeValue);
            sellingAsset.safeTransfer(royaltyOwner, royaltyValue);
            sellingAsset.safeTransfer(
                owner(),
                price.sub(feeValue).sub(royaltyValue)
            );

            inventory[_itemId].amount = inventory[_itemId].amount.sub(_amount);

            IERC1155(item.token).safeTransferFrom(
                address(this),
                msg.sender,
                item.id,
                _amount,
                ""
            );
            
        }
    }
}
