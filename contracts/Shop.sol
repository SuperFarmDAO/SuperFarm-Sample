// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

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
        Specifies a type of an asset
        @param native  Selects a native blockchain currency
        @param erc20 Selects an erc20 type token
     */
    enum AssetType {
        undefined,
        native,
        erc20
    }

    /**
        This struct tracks information about a single asset with associated price
        that an item is being sold in the shop for.
        @param assetType A sentinel value for the specific type of asset being used.
                        native = blockchain currency, e.g. Ether.
                        erc20 = an ERC-20 token, see `asset`.
        @param asset Some more specific information about the asset to charge in.
                     If the `assetType` is `native`, we ignore this field.
                     If the `assetType` is `erc20`, we use this address to find the ERC-20
                     token that we should be specifically charging with.
        @param price The amount of the specified `assetType` and `asset` to charge.
      */
    struct PricePair {
        AssetType assetType;
        address asset;
        uint256 price;
    }

    /**
        This struct tracks information about each item of inventory in the Shop.
        @param token The address of an ERC-1155 collection contract containing the
                     item we want to sell.
        @param id The specific ID of the item within the ERC-1155 from `token`.
        @param amount The amount of this specific item on sale in the Shop.
      */
    struct ShopItem {
        uint256 id;
        uint256 amount;
        address token;
    }

    // The Shop's inventory of items for sale.
    uint256 nextItemId;
    mapping(uint256 => ShopItem) public inventory;
    mapping(uint256 => uint256) public pricePairLengths;
    mapping(uint256 => mapping(uint256 => PricePair)) public prices;

    /** 
        Deploys the contract with initial values.
        @param _name The name of the Shop contract.
        @param _feeOwner The address all the shop fees are sent to.
        @param _feePercent The fee percent in Basis Points to be transfered to `feeOwner` per each purchase.
        @param _itemRoyaltyPercent The royalty percent in Basis Points to be transfered to `royaltyOwner` per each purchase.
        @param _royaltyOwner The address all the royalties are sent to.
    */
    constructor(
        string memory _name,
        address payable _feeOwner,
        uint256 _feePercent,
        uint256 _itemRoyaltyPercent,
        address payable _royaltyOwner
    ) public {
        require(
            _feeOwner != address(0) &&
                _royaltyOwner != address(0) &&
                _feePercent > 0 &&
                _itemRoyaltyPercent > 0,
            "Shop: bad constructor arguments."
        );
        name = _name;
        feeOwner = _feeOwner;
        feePercent = _feePercent;
        itemRoyaltyPercent = _itemRoyaltyPercent;
        royaltyOwner = _royaltyOwner;
    }

    /**
    Returns the number of items in the Shop's inventory.
    @return the number of items in the Shop's inventory.
  */
    function getInventoryCount() external view returns (uint256) {
        return nextItemId;
    }

    /**
        @dev Returns current parameterof the shop 
        @return Shop's version 
        @return Shop's name.
        @return Fee owner's address.
        @return Fee percent.
        @return Royaty fee owner's address.
        @return Royalty fee percent.
     */
    function getShopInfo()
        external
        view
        returns (
            uint256,
            string memory,
            address,
            uint256,
            address,
            uint256
        )
    {
        return (
            version,
            name,
            feeOwner,
            feePercent,
            royaltyOwner,
            itemRoyaltyPercent
        );
    }

    /**
        Allows the Shop owner to list a new set of NFT items for sale.
        @param _pricePairs The asset address to price pairings to use for selling each item.
        @param _items The array of ERC-1155 item contracts to sell from.
        @param _ids The specific ERC-1155 item IDs to sell.
        @param _amounts The amount of inventory being listed for each item.
    */
    function listItems(
        PricePair[] memory _pricePairs,
        address[] calldata _items,
        uint256[][] calldata _ids,
        uint256[][] calldata _amounts
    ) external onlyOwner {
        require(_items.length > 0, "You must list at least one item.");
        require(
            _items.length == _ids.length,
            "Items length cannot be mismatched with IDs length."
        );
        require(
            _items.length == _amounts.length,
            "Items length cannot be mismatched with amounts length."
        );

        uint256 idCounter = nextItemId; // to increase id parameter in memory without rewriting storage in a loop

        // Iterate through every specified ERC-1155 contract to list items.
        for (uint256 i = 0; i < _items.length; i++) {
            address item = _items[i];
            uint256[] memory ids = _ids[i];
            uint256[] memory amounts = _amounts[i];

            // For each ERC-1155 contract, add the requested item IDs to the Shop.
            for (uint256 j = 0; j < ids.length; j++) {
                uint256 id = ids[j];
                uint256 amount = amounts[j];
                require(
                    amount > 0,
                    "You cannot list an item with no starting amount."
                );
                inventory[idCounter + j] = ShopItem({
                    token: item,
                    id: id,
                    amount: amount
                });
                for (uint256 k = 0; k < _pricePairs.length; k++) {
                    prices[idCounter + j][k] = _pricePairs[k];
                }
                pricePairLengths[idCounter + j] = _pricePairs.length;
            }
            idCounter = idCounter.add(ids.length);

            // Batch transfer the listed items to the Shop contract.
            IERC1155(item).safeBatchTransferFrom(
                msg.sender,
                address(this),
                ids,
                amounts,
                ""
            );
        }
        nextItemId = idCounter;
    }

    /**
        Allows the Shop owner to remove items.
        @param _itemId The id of the specific inventory item of this shop to remove.
        @param _amount The amount of the specified item to remove.
    */
    function removeItem(uint256 _itemId, uint256 _amount) external onlyOwner {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount >= _amount && item.amount > 0,
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
        @param _pricePairs The asset-price pairs at which to sell a single instance of the item.
    */
    function changeItemPrice(uint256 _itemId, PricePair[] memory _pricePairs)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            prices[_itemId][i] = _pricePairs[i];
        }
        pricePairLengths[_itemId] = _pricePairs.length;
    }

    /**
        Allows any user to purchase an item from this Shop provided they have enough
        of the asset being used to purchase with.
        @param _itemId The ID of the specific inventory item of this shop to buy.
        @param _amount The amount of the specified item to purchase.
        @param _assetId The index of the asset from the item's asset-price pairs to
                    attempt this purchase using.
    */
    function purchaseItem(
        uint256 _itemId,
        uint256 _amount,
        uint256 _assetId
    ) external payable nonReentrant {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount >= _amount && item.amount > 0,
            "There is not enough of your desired item in stock to purchase."
        );
        require(
            _assetId < pricePairLengths[_itemId],
            "Your specified asset ID is not valid."
        );
        PricePair memory sellingPair = prices[_itemId][_assetId];

        // If the sentinel value for the Ether asset type is found, sell for Ether.
        if (sellingPair.assetType == AssetType.native) {
            uint256 etherPrice = sellingPair.price.mul(_amount);
            require(
                msg.value >= etherPrice,
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
            IERC20 sellingAsset = IERC20(sellingPair.asset);
            uint256 tokenPrice = sellingPair.price.mul(_amount);
            require(
                sellingAsset.balanceOf(msg.sender) >= tokenPrice,
                "You do not have enough token to complete this purchase."
            );
            uint256 feeValue = tokenPrice.mul(feePercent).div(100000);
            uint256 royaltyValue = tokenPrice.mul(itemRoyaltyPercent).div(
                100000
            );
            sellingAsset.safeTransferFrom(msg.sender, feeOwner, feeValue);
            sellingAsset.safeTransferFrom(
                msg.sender,
                royaltyOwner,
                royaltyValue
            );
            sellingAsset.safeTransferFrom(
                msg.sender,
                owner(),
                tokenPrice.sub(feeValue).sub(royaltyValue)
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
