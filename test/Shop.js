// test/Airdrop.js
// Load dependencies
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const Web3 = require('web3');

const OWNER_ADDRESS = ethers.utils.getAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

const DECIMALS = 2;

const AMT = 150

///////////////////////////////////////////////////////////
// SEE https://hardhat.org/tutorial/testing-contracts.html
// FOR HELP WRITING TESTS
// USE https://github.com/gnosis/mock-contract FOR HELP
// WITH MOCK CONTRACT
///////////////////////////////////////////////////////////

// Start test block
describe('Shop', function () {
    let owner, signer1, signer2, signer3, feeOwner, royaltyOwner;
    let pricePairs;
    let items;
    let ids;
    let amounts;

    let GOLD_ID = 0;
    let SILVER_ID = 1;
    let BRONZE_ID = 2;
    let SWORD_ID = 3;
    let SHIELD_ID = 4;

    before(async function () {
        this.Shop = await ethers.getContractFactory("Shop");
        this.ERC20 = await ethers.getContractFactory("ExampleERC20");
        this.ERC1155 = await ethers.getContractFactory("GameItem");
    });

    beforeEach(async function () {
        [owner, signer1, signer2, signer3, feeOwner, royaltyOwner] = await ethers.getSigners();

        this.shop = await this.Shop.deploy('testShop', feeOwner.address, 1000, 2000, royaltyOwner.address)
        await this.shop.deployed();

        this.erc20 = await this.ERC20.deploy();
        await this.erc20.deployed();

        this.erc1155 = await this.ERC1155.deploy();
        await this.erc1155.deployed();

        pricePairs = [
            { assetType: BigNumber.from(1),
              asset: '0x0000000000000000000000000000000000000000',
              price: BigNumber.from(100) },
            { assetType: BigNumber.from(2),
              asset: this.erc20.address,
              price: BigNumber.from(1000) },
        ];
        // TODO: different 1155s
        items = [
          this.erc1155.address,
          this.erc1155.address,
        ];
        ids = [
          [GOLD_ID],
          [SILVER_ID],
        ];
        amounts = [
          [10],
          [100],
        ];

        expect((await this.erc1155.balanceOf(owner.address, GOLD_ID))).to.equal(0);
        expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(0);
        expect((await this.erc1155.balanceOf(owner.address, BRONZE_ID))).to.equal(0);
        expect((await this.erc1155.balanceOf(owner.address, SWORD_ID))).to.equal(0);

        await this.erc1155.mint(owner.address, GOLD_ID, 100, ethers.utils.id('gold'));
        await this.erc1155.mint(owner.address, SILVER_ID, 1000, ethers.utils.id('silver'));
        await this.erc1155.mint(owner.address, BRONZE_ID, 1000000, ethers.utils.id('bronze'));
        await this.erc1155.mint(owner.address, SWORD_ID, 10, ethers.utils.id('sword'));

        expect((await this.erc1155.balanceOf(owner.address, GOLD_ID))).to.equal(100);
        expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(1000);
        expect((await this.erc1155.balanceOf(owner.address, BRONZE_ID))).to.equal(1000000);
        expect((await this.erc1155.balanceOf(owner.address, SWORD_ID))).to.equal(10);
    });

    describe("getInventoryCount", function () {
        it('returns the expected count', async function () {
            expect((await this.shop.getInventoryCount())).to.equal(0);
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((await this.shop.getInventoryCount())).to.equal(2);

            pricePairs = [
                { assetType: BigNumber.from(1),
                  asset: '0x0000000000000000000000000000000000000000',
                  price: BigNumber.from(10) },
            ];
            items = [
              this.erc1155.address,
            ];
            ids = [
              [BRONZE_ID, SWORD_ID],
            ];
            amounts = [
              [1000, 10],
            ];

            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((await this.shop.getInventoryCount())).to.equal(4);
        });
    });

    describe("listItems", function () {
        it('reverts when arguments are not valid', async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await expect(
                this.shop.listItems(pricePairs, [], ids, amounts)
            ).to.be.revertedWith("You must list at least one item.");
            await expect(
                this.shop.listItems(pricePairs, items, [], amounts)
            ).to.be.revertedWith("Items length cannot be mismatched with IDs length.");
            await expect(
                this.shop.listItems(pricePairs, items, ids, [])
            ).to.be.revertedWith("Items length cannot be mismatched with amounts length.");
            await expect(
                this.shop.listItems(pricePairs, items, ids, [[0],[0]])
            ).to.be.revertedWith("You cannot list an item with no starting amount.");
        });

        it('updates the inventory, prices, and pricePairLengths', async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            expect((JSON.stringify(await this.shop.inventory(0)))).to.equal(
              JSON.stringify(
                ["0x0000000000000000000000000000000000000000", BigNumber.from(0), BigNumber.from(0)]
              )
            );

            await this.shop.listItems(pricePairs, items, ids, amounts);

            // items are transferred to shop
            expect((await this.erc1155.balanceOf(owner.address, GOLD_ID))).to.equal(90);
            expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(900);
            expect((await this.erc1155.balanceOf(this.shop.address, GOLD_ID))).to.equal(10);
            expect((await this.erc1155.balanceOf(this.shop.address, SILVER_ID))).to.equal(100);

            // inventory is updated as expected
            expect((JSON.stringify(await this.shop.inventory(0)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(GOLD_ID), BigNumber.from(10)]
                )
            );
            expect((JSON.stringify(await this.shop.inventory(1)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(SILVER_ID), BigNumber.from(100)]
                )
            );
            expect((JSON.stringify(await this.shop.inventory(2)))).to.equal(
                JSON.stringify(
                    ["0x0000000000000000000000000000000000000000", BigNumber.from(0), BigNumber.from(0)]
                )
            );

            // prices are updated as expected
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([pricePairs[1].assetType, pricePairs[1].asset, pricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(2);

            expect((JSON.stringify(await this.shop.prices(0, 2)))).to.equal(
                JSON.stringify(
                    [BigNumber.from(0), "0x0000000000000000000000000000000000000000", BigNumber.from(0)]
                )
            );
            expect((JSON.stringify(await this.shop.prices(1, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(1, 1)))).to.equal(
                JSON.stringify([pricePairs[1].assetType, pricePairs[1].asset, pricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(1)).to.equal(2);

            expect((JSON.stringify(await this.shop.prices(1, 2)))).to.equal(
                JSON.stringify(
                    [BigNumber.from(0), "0x0000000000000000000000000000000000000000", BigNumber.from(0)]
                )
            );

            expect((JSON.stringify(await this.shop.prices(2, 0)))).to.equal(
                JSON.stringify(
                    [BigNumber.from(0), "0x0000000000000000000000000000000000000000", BigNumber.from(0)]
                )
            );
            expect(await this.shop.pricePairLengths(2)).to.equal(0);

            pricePairs = [
                { assetType: BigNumber.from(1),
                  asset: '0x0000000000000000000000000000000000000000',
                  price: BigNumber.from(10) },
            ];
            items = [
              this.erc1155.address,
            ];
            ids = [
              [BRONZE_ID, SWORD_ID],
            ];
            amounts = [
              [1000, 5],
            ];

            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((JSON.stringify(await this.shop.inventory(2)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(BRONZE_ID), BigNumber.from(1000)]
                )
            );

            expect(await this.shop.pricePairLengths(2)).to.equal(1);
            expect((JSON.stringify(await this.shop.prices(2, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect(await this.shop.pricePairLengths(2)).to.equal(1);

            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((JSON.stringify(await this.shop.inventory(3)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(SWORD_ID), BigNumber.from(5)]
                )
            );

            expect(await this.shop.pricePairLengths(3)).to.equal(1);
            expect((JSON.stringify(await this.shop.prices(3, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect(await this.shop.pricePairLengths(3)).to.equal(1);
        });
    });

    describe("removeItem", function () {
        it("removes items as expected", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((await this.shop.getInventoryCount())).to.equal(2);
            // remove half
            await this.shop.removeItem(0, 5);
            // inventory is updated as expected
            expect((JSON.stringify(await this.shop.inventory(0)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(GOLD_ID), BigNumber.from(5)]
                )
            );
            // items are transferred back to owner
            expect((await this.erc1155.balanceOf(owner.address, GOLD_ID))).to.equal(95);
            // remove all
            await this.shop.removeItem(0, 5);
            // inventory is updated as expected
            expect((JSON.stringify(await this.shop.inventory(0)))).to.equal(
                JSON.stringify(
                    [this.erc1155.address, BigNumber.from(GOLD_ID), BigNumber.from(0)]
                )
            );
            // items are transferred back to owner
            expect((await this.erc1155.balanceOf(owner.address, GOLD_ID))).to.equal(100);
        });
    });

    describe("changeItemPrice", function () {
        it("changes itemPrices with same pricePairLengths", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([pricePairs[1].assetType, pricePairs[1].asset, pricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(2);

            newPricePairs = [
                { assetType: BigNumber.from(1),
                asset: this.erc20.address,
                price: BigNumber.from(100) },
                { assetType: BigNumber.from(2),
                asset: '0x0000000000000000000000000000000000000000',
                price: BigNumber.from(10) },
            ];
            this.shop.changeItemPrice(0, newPricePairs);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([newPricePairs[0].assetType, newPricePairs[0].asset, newPricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([newPricePairs[1].assetType, newPricePairs[1].asset, newPricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(2);
        });
        it("changes itemPrices with less pricePairs", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([pricePairs[1].assetType, pricePairs[1].asset, pricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(2);

            newPricePairs = [
                { assetType: BigNumber.from(1),
                asset: this.erc20.address,
                price: BigNumber.from(100) },
            ];
            this.shop.changeItemPrice(0, newPricePairs);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([newPricePairs[0].assetType, newPricePairs[0].asset, newPricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify(
                    [BigNumber.from(0), "0x0000000000000000000000000000000000000000", BigNumber.from(0)]
                )
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(1);
        });
        it("changes itemPrices with more pricePairs", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([pricePairs[0].assetType, pricePairs[0].asset, pricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([pricePairs[1].assetType, pricePairs[1].asset, pricePairs[1].price])
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(2);

            newPricePairs = [
                { assetType: BigNumber.from(1),
                asset: this.erc20.address,
                price: BigNumber.from(100) },
                { assetType: BigNumber.from(1),
                asset: this.erc20.address,
                price: BigNumber.from(1000) },
                { assetType: BigNumber.from(1),
                asset: this.erc20.address,
                price: BigNumber.from(1000) },
            ];
            this.shop.changeItemPrice(0, newPricePairs);
            expect((JSON.stringify(await this.shop.prices(0, 0)))).to.equal(
                JSON.stringify([newPricePairs[0].assetType, newPricePairs[0].asset, newPricePairs[0].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 1)))).to.equal(
                JSON.stringify([newPricePairs[1].assetType, newPricePairs[1].asset, newPricePairs[1].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 2)))).to.equal(
                JSON.stringify([newPricePairs[2].assetType, newPricePairs[2].asset, newPricePairs[2].price])
            );
            expect((JSON.stringify(await this.shop.prices(0, 3)))).to.equal(
                JSON.stringify(
                    [BigNumber.from(0), "0x0000000000000000000000000000000000000000", BigNumber.from(0)]
                )
            );
            expect(await this.shop.pricePairLengths(0)).to.equal(3);
        });
    });

    describe("purchaseItem", function () {
        it("reverts when some base cases occur", async function () {
            await expect(
                this.shop.purchaseItem(0, 10, 0)
            ).to.be.revertedWith("There is not enough of your desired item in stock to purchase.");

            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);

            await expect(
                this.shop.purchaseItem(0, 1, 5)
            ).to.be.revertedWith("Your specified asset ID is not valid.");

            await expect(
                this.shop.purchaseItem(0, 1, 0)
            ).to.be.revertedWith("You did not send enough Ether to complete this purchase.");

            await expect(
                this.shop.connect(signer1).purchaseItem(0, 10, 1)
            ).to.be.revertedWith("You do not have enough token to complete this purchase.");

            await expect(
                this.shop.purchaseItem(0, 1, 1)
            ).to.be.revertedWith("transfer amount exceeds allowance");
        });
        it("allows ether purchases when valid state/params/value", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);

            expect(await this.shop.feeOwner()).to.equal(feeOwner.address);
            expect(await this.shop.royaltyOwner()).to.equal(royaltyOwner.address);

            // outsider buys
            expect((await this.erc1155.balanceOf(signer1.address, GOLD_ID))).to.equal(0);
            await expect(() => this.shop.connect(signer1).purchaseItem(0, 10, 0, { value: 1000 }))
              .to.changeEtherBalances([owner, signer1, feeOwner, royaltyOwner], [970, -1000, 10, 20]);
            expect((await this.erc1155.balanceOf(signer1.address, GOLD_ID))).to.equal(10);

            // shop owner buys
            expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(900);
            await expect(() => this.shop.purchaseItem(1, 1, 0, { value: 1000 }))
            .to.changeEtherBalances([owner, feeOwner, royaltyOwner], [-30, 10, 20]);
            expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(901);

            // feeOwner buys
            expect((await this.erc1155.balanceOf(feeOwner.address, SILVER_ID))).to.equal(0);
            await expect(() => this.shop.connect(feeOwner).purchaseItem(1, 1, 0, { value: 1000 }))
            .to.changeEtherBalances([owner, feeOwner, royaltyOwner], [970, -990, 20]);
            expect((await this.erc1155.balanceOf(feeOwner.address, SILVER_ID))).to.equal(1);

            // royaltyOwner buys
            expect((await this.erc1155.balanceOf(royaltyOwner.address, SILVER_ID))).to.equal(0);
            await expect(() => this.shop.connect(royaltyOwner).purchaseItem(1, 2, 0, { value: 2000 }))
            .to.changeEtherBalances([owner, feeOwner, royaltyOwner], [1940, 20, -1960]);
            expect((await this.erc1155.balanceOf(royaltyOwner.address, SILVER_ID))).to.equal(2);
        });
        it("allows erc20 purchases when valid state/params/value", async function () {
            await this.erc1155.setApprovalForAll(this.shop.address, true);
            await this.shop.listItems(pricePairs, items, ids, amounts);

            expect(await this.shop.feeOwner()).to.equal(feeOwner.address);
            expect(await this.shop.royaltyOwner()).to.equal(royaltyOwner.address);

            // outsider buys
            expect((await this.erc1155.balanceOf(signer1.address, GOLD_ID))).to.equal(0);
            await expect(() => this.shop.connect(signer1).purchaseItem(0, 10, 0, { value: 1000 }))
              .to.changeEtherBalances([owner, signer1, feeOwner, royaltyOwner], [970, -1000, 10, 20]);
            expect((await this.erc1155.balanceOf(signer1.address, GOLD_ID))).to.equal(10);

            // shop owner buys
            expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(900);
            await this.erc20.approve(this.shop.address, 1000);
            await expect(() => this.shop.purchaseItem(1, 1, 1, { value: 1000 }))
              .to.changeTokenBalances(this.erc20, [owner, feeOwner, royaltyOwner], [-30, 10, 20]);
            expect((await this.erc1155.balanceOf(owner.address, SILVER_ID))).to.equal(901);

            // feeOwner buys
            expect((await this.erc1155.balanceOf(feeOwner.address, SILVER_ID))).to.equal(0);
            await this.erc20.transfer(feeOwner.address, 1000);
            await this.erc20.connect(feeOwner).approve(this.shop.address, 1000);
            await expect(() => this.shop.connect(feeOwner).purchaseItem(1, 1, 1, { value: 1000 }))
              .to.changeTokenBalances(this.erc20, [owner, feeOwner, royaltyOwner], [970, -990, 20]);
            expect((await this.erc1155.balanceOf(feeOwner.address, SILVER_ID))).to.equal(1);

            // royaltyOwner buys
            expect((await this.erc1155.balanceOf(royaltyOwner.address, SILVER_ID))).to.equal(0);
            await this.erc20.transfer(royaltyOwner.address, 2000);
            await this.erc20.connect(royaltyOwner).approve(this.shop.address, 2000);
            await expect(() => this.shop.connect(royaltyOwner).purchaseItem(1, 2, 1, { value: 2000 }))
              .to.changeTokenBalances(this.erc20, [owner, feeOwner, royaltyOwner], [1940, 20, -1960]);
            expect((await this.erc1155.balanceOf(royaltyOwner.address, SILVER_ID))).to.equal(2);
        });
    });
});