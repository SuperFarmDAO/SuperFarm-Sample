// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
  @title A simple Shop contract for selling ERC-1155s for Ether or
         ERC-20 tokens.
  @author Tim Clancy

  This contract allows its owner to list NFT items for sale.
*/
contract Shop is ERC1155Holder, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * Enum that contains variaty of types for asset.
     * @param NONE Initial type.
     * @param ETHER Type for assets that represents Ether.
     * @param ERC20 Type for assets that represents ERC20 token.
     */
    enum AssetType {
        NONE,
        ETHER,
        ERC20
    }

    /// A version number for this Shop contract's interface.
    uint256 public version = 1;

    /// A user-specified, descriptive name for this Shop.
    string public name;

    /// An address who is paid fees from this Shop.
    address public feeOwner;

    /// A percent to pay to the Shop owner as fee.
    uint256 public feePercent;

    /// A percent to pay to the `royaltyOwner`.
    uint256 public itemRoyaltyPercent;

    /// An address to pay item royalty fees to.
    address public royaltyOwner;

    /**
     * This struct tracks information about a single asset with associated price
     * that an item is being sold in the shop for.
     *
     * @param assetType Type of asset.
     * @param asset Some more specific information about the asset to charge in.
     *              If the `assetType` is Ether, we ignore this field.
     *              If the `assetType` is ERC20, we use this address to find the ERC-20
     *              token that we should be specifically charging with.
     * @param price The amount of the specified `assetType` and `asset` to charge.
     */
    struct PricePair {
        AssetType assetType;
        address asset;
        uint256 price;
    }

    /**
     * This struct tracks information about each item of inventory in the Shop.
     *
     * @param token The address of an ERC-1155 collection contract containing the
     *             item we want to sell.
     * @param id The specific ID of the item within the ERC-1155 from `token`.
     * @param amount The amount of this specific item on sale in the Shop.
     */
    struct ShopItem {
        IERC1155 token;
        uint256 id;
        uint256 amount;
    }

    // The Shop's inventory of items for sale.
    uint256 public nextItemId;
    mapping(uint256 => ShopItem) public inventory;
    mapping(uint256 => uint256) public pricePairLengths;
    mapping(uint256 => mapping(uint256 => PricePair)) public prices;

    /**
     * constructor that deploys the contract with the specified parameters
     * @param _name name of the shop
     * @param _feeOwner address where to send fees
     * @param _feePercent fee percent from item sales which sends to _feeOwner
     * @param _royaltyOwner address where to send royalties
     * @param _itemRoyaltyPercent percent from item sales which sends to _royaltyOwner
     */
    constructor(
        string memory _name,
        address _feeOwner,
        uint256 _feePercent,
        address _royaltyOwner,
        uint256 _itemRoyaltyPercent
    ) {
        name = _name;
        feeOwner = _feeOwner;
        feePercent = _feePercent;
        itemRoyaltyPercent = _itemRoyaltyPercent;
        royaltyOwner = _royaltyOwner;
        nextItemId;
    }

    /**
     * Returns an objects of inventory item with with corresponding price pairs
     *
     * @param _id id of requested inventory item
     *
     * @return an object of inventory item and its pricePairs objects
     */
    function getInventoryItem(uint256 _id)
        external
        view
        returns (ShopItem memory, PricePair[] memory)
    {
        require(_id < nextItemId, "Shop: Wrong inventory item id");
        PricePair[] memory targetPrices = new PricePair[](
            pricePairLengths[_id]
        );
        for (uint256 i = 0; i < pricePairLengths[_id]; i++) {
            targetPrices[i] = prices[_id][i];
        }
        return (inventory[_id], targetPrices);
    }

    /**
     * Allows the Shop owner to list a new set of NFT items for sale.
     *
     * @param _pricePairs The asset address to price pairings to use for selling
     *                   each item.
     * @param _items The array of ERC-1155 item contracts to sell from.
     * @param _ids The specific ERC-1155 item IDs to sell.
     * @param _amounts The amount of inventory being listed for each item.
     */
    function listItems(
        PricePair[] memory _pricePairs,
        IERC1155[] calldata _items,
        uint256[][] calldata _ids,
        uint256[][] calldata _amounts
    ) external {
        require(_items.length > 0, "Shop: You must list at least one item.");
        require(
            _items.length == _ids.length,
            "Shop: Items length cannot be mismatched with IDs length."
        );
        require(
            _items.length == _amounts.length,
            "Shop: Items length cannot be mismatched with amounts length."
        );

        // Add an uint256 variable in memory for not rewrite storage in a loop
        uint256 count = nextItemId;

        // Iterate through every specified ERC-1155 contract to list items.
        for (uint256 i = 0; i < _items.length; i++) {
            IERC1155 item = _items[i];
            uint256[] memory ids = _ids[i];
            uint256[] memory amounts = _amounts[i];
            require(
                ids.length > 0,
                "Shop: You must specify at least one item ID."
            );
            require(
                ids.length == amounts.length,
                "Shop: Item IDs length cannot be mismatched with amounts length."
            );

            // For each ERC-1155 contract, add the requested item IDs to the Shop.
            for (uint256 j = 0; j < ids.length; j++) {
                uint256 id = ids[j];
                uint256 amount = amounts[j];
                require(
                    amount > 0,
                    "Shop: You cannot list an item with no starting amount."
                );
                inventory[count + j] = ShopItem({
                    token: item,
                    id: id,
                    amount: amount
                });
                for (uint256 k = 0; k < _pricePairs.length; k++) {
                    prices[count + j][k] = _pricePairs[k];
                }
                pricePairLengths[count + j] = _pricePairs.length;
            }
            count = count.add(ids.length);

            // Batch transfer the listed items to the Shop contract.
            item.safeBatchTransferFrom(
                msg.sender,
                address(this),
                ids,
                amounts,
                ""
            );
        }
        nextItemId = count;
    }

    /**
     *Allows the Shop owner to remove items.
     *
     * @param _itemId The id of the specific inventory item of this shop to remove.
     * @param _amount The amount of the specified item to remove.
     */
    function removeItem(uint256 _itemId, uint256 _amount) external onlyOwner {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount >= _amount && item.amount != 0,
            "Shop: There is not enough of your desired item to remove."
        );
        inventory[_itemId].amount = inventory[_itemId].amount.sub(_amount);
        item.token.safeTransferFrom(
            address(this),
            msg.sender,
            item.id,
            _amount,
            ""
        );
    }

    /**
     * Allows the Shop owner to adjust the prices of an NFT item set.
     *
     * @param _itemId The id of the specific inventory item of this shop to adjust.
     * @param _pricePairs The asset-price pairs at which to sell a single instance of the item.
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
     * Allows any user to purchase an item from this Shop provided they have enough
     * of the asset being used to purchase with.
     *
     * @param _itemId The ID of the specific inventory item of this shop to buy.
     * @param _amount The amount of the specified item to purchase.
     * @param _assetId The index of the asset from the item's asset-price pairs to
     *                 attempt this purchase using.
     */
    function purchaseItem(
        uint256 _itemId,
        uint256 _amount,
        uint256 _assetId
    ) external payable nonReentrant {
        ShopItem storage item = inventory[_itemId];
        require(
            item.amount >= _amount && item.amount != 0,
            "Shop: There is not enough of your desired item in stock to purchase."
        );
        require(
            _assetId < pricePairLengths[_itemId],
            "Shop: Your specified asset ID is not valid."
        );
        PricePair memory sellingPair = prices[_itemId][_assetId];

        // If the sentinel value for the Ether asset type is found, sell for Ether.
        if (sellingPair.assetType == AssetType.ETHER) {
            uint256 etherPrice = sellingPair.price.mul(_amount);
            require(
                msg.value >= etherPrice,
                "Shop: You did not send enough Ether to complete this purchase."
            );
            uint256 feeValue = etherPrice.mul(feePercent).div(100000);
            uint256 royaltyValue = etherPrice.mul(itemRoyaltyPercent).div(
                100000
            );
            (bool success, ) = payable(feeOwner).call{value: feeValue}("");
            (success, ) = payable(royaltyOwner).call{value: royaltyValue}("");
            (success, ) = payable(owner()).call{
                value: etherPrice.sub(feeValue).sub(royaltyValue)
            }("");
            // Returns change
            if (msg.value - etherPrice > 0) {
                (success, ) = payable(msg.sender).call{
                    value: msg.value - etherPrice
                }("");
            }
            inventory[_itemId].amount = inventory[_itemId].amount.sub(_amount);
            item.token.safeTransferFrom(
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
                "Shop: You do not have enough token to complete this purchase."
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
            item.token.safeTransferFrom(
                address(this),
                msg.sender,
                item.id,
                _amount,
                ""
            );
        }
    }

    /**
     * Function that changes fee percent
     *
     * @param _newFeePercent new fee percent (input must be as %*1000 e.g. 4.5% eq 4500)
     *
     */
    function changeFeePercent(uint256 _newFeePercent) external onlyOwner {
        require(
            _newFeePercent + itemRoyaltyPercent < 100000,
            "Shop: Invalid new value of fee percent"
        );
        if (feePercent != _newFeePercent) feePercent = _newFeePercent;
    }

    /**
     * Function that changes royalties percent
     *
     * @param _newRoyaltyPercent new royalties percent (input must be as %*1000 e.g. 4.5% eq 4500)
     *
     */
    function changeRoyaltyPercent(uint256 _newRoyaltyPercent)
        external
        onlyOwner
    {
        require(
            _newRoyaltyPercent + feePercent < 100000,
            "Shop: Invalid new value of royalties percent"
        );
        if (itemRoyaltyPercent != _newRoyaltyPercent)
            itemRoyaltyPercent = _newRoyaltyPercent;
    }

    /**
     * Function that changes fee owner
     *
     * @param _newFeeOwner new fee owner
     *
     */
    function changeFeeOwner(address _newFeeOwner) external onlyOwner {
        require(
            _newFeeOwner != address(0),
            "Shop: Invalid new address of new fee owner"
        );
        if (feeOwner != _newFeeOwner) feeOwner = _newFeeOwner;
    }

    /**
     * Function that changes royalty owner
     *
     * @param _newRoyaltyOwner new royalty owner
     *
     */
    function changeRoyaltyOwner(address _newRoyaltyOwner) external onlyOwner {
        require(
            _newRoyaltyOwner != address(0),
            "Shop: Invalid new address of new royalty owner"
        );
        if (royaltyOwner != _newRoyaltyOwner) royaltyOwner = _newRoyaltyOwner;
    }
}
