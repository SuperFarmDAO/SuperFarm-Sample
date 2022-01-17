import { expect } from "chai";
import { BigNumber } from "ethers";
import { toUtf8Bytes } from '@ethersproject/strings';
import { artifacts, ethers, waffle } from "hardhat";

export function shouldBehaveCorrectly(): void {

    //some inputs for tests
    let
        PaymentTokens = {
            alice: 49.9,
            bob: 1000,
            carl: 0,
            dan: 0
        },
        TradeTokens = {
            sword: {
                id: 0,
                amount: 15,
                data: 0
            },
            shield: {
                id: 1,
                amount: 9,
                data: 0
            },
            excalibur: {
                id: 2,
                amount: 1,
                data: toUtf8Bytes("legend")
            }
        },
        PricePairs: any;



    it("should mint correctly", async function () {

        PricePairs = [
            { assetType: 2, asset: this.paymentToken.address, price: ethers.utils.parseEther("10") },
            { assetType: 1, asset: this.hre.ethers.constants.AddressZero, price: ethers.utils.parseEther("5") }
        ];

        //minting tokens for pay
        await expect(this.paymentToken.connect(this.alice).mint(this.alice.address, PaymentTokens.alice)).to.be.reverted
        expect(await this.paymentToken.connect(this.signers.admin).mint(this.alice.address, this.hre.ethers.utils.parseEther(PaymentTokens.alice.toString()))).to.be.ok
        expect(await this.paymentToken.balanceOf(this.alice.address)).to.be.eq(this.hre.ethers.utils.parseEther(PaymentTokens.alice.toString()))

        expect(await this.paymentToken.connect(this.signers.admin).mint(this.bob.address, this.hre.ethers.utils.parseEther(PaymentTokens.bob.toString()))).to.be.ok
        expect(await this.paymentToken.balanceOf(this.bob.address)).to.be.eq(this.hre.ethers.utils.parseEther(PaymentTokens.bob.toString()))

        expect(await this.paymentToken.connect(this.signers.admin).mint(this.carl.address, this.hre.ethers.utils.parseEther(PaymentTokens.carl.toString()))).to.be.ok
        expect(await this.paymentToken.balanceOf(this.carl.address)).to.be.eq(this.hre.ethers.utils.parseEther(PaymentTokens.carl.toString()))

        expect(await this.paymentToken.connect(this.signers.admin).mint(this.dan.address, this.hre.ethers.utils.parseEther(PaymentTokens.dan.toString()))).to.be.ok
        expect(await this.paymentToken.balanceOf(this.dan.address)).to.be.eq(this.hre.ethers.utils.parseEther(PaymentTokens.dan.toString()))

        //minting tokens for sale
        await expect(this.tradeToken.connect(this.alice).mint(this.alice.address, TradeTokens.sword.id, TradeTokens.sword.amount, TradeTokens.sword.data)).to.be.reverted
        expect(await this.tradeToken.connect(this.signers.admin).mint(this.signers.admin.address, TradeTokens.sword.id, TradeTokens.sword.amount, TradeTokens.sword.data)).to.be.ok
        expect(await this.tradeToken.balanceOf(this.signers.admin.address, TradeTokens.sword.id)).to.be.eq(TradeTokens.sword.amount)

        expect(await this.tradeToken.connect(this.signers.admin).mint(this.signers.admin.address, TradeTokens.shield.id, TradeTokens.shield.amount, TradeTokens.shield.data)).to.be.ok
        expect(await this.tradeToken.balanceOf(this.signers.admin.address, TradeTokens.shield.id)).to.be.eq(TradeTokens.shield.amount)

        expect(await this.tradeToken.connect(this.signers.admin).mint(this.signers.admin.address, TradeTokens.excalibur.id, TradeTokens.excalibur.amount, TradeTokens.excalibur.data)).to.be.ok
        expect(await this.tradeToken.balanceOf(this.signers.admin.address, TradeTokens.excalibur.id)).to.be.eq(TradeTokens.excalibur.amount)

    })

    it("should list items correctly", async function () {

        //Check requires
        await expect(this.instance.listItems(
            PricePairs,
            [],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount]]
        )).to.be.revertedWith("Shop: You must list at least one item.")

        await expect(this.instance.listItems(
            [],
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount]]
        )).to.be.revertedWith("Shop: You must set at least one price pair for item.")

        await expect(this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id], [0]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount]]
        )).to.be.revertedWith("Shop: Items length cannot be mismatched with IDs length.")

        await expect(this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount], [0]]
        )).to.be.revertedWith("Shop: Items length cannot be mismatched with amounts length.")

        await expect(this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount]]
        )).to.be.revertedWith("Shop: You must specify at least one item ID.")

        await expect(this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[]]
        )).to.be.revertedWith("Shop: Item IDs length cannot be mismatched with amounts length.")

        await expect(this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[TradeTokens.sword.amount, 0, TradeTokens.excalibur.amount]]
        )).to.be.revertedWith("Shop: You cannot list an item with no starting amount.")


        //Finally trying to list
        expect(await this.tradeToken.setApprovalForAll(this.instance.address, true)).to.be.ok
        expect(await this.instance.listItems(
            PricePairs,
            [this.tradeToken.address],
            [[TradeTokens.sword.id, TradeTokens.shield.id, TradeTokens.excalibur.id]],
            [[TradeTokens.sword.amount, TradeTokens.shield.amount, TradeTokens.excalibur.amount]]
        )).to.be.ok

        //check that all listed correctly
        expect((await this.instance.inventory(0)).id).to.be.eq(TradeTokens.sword.id)
        expect((await this.instance.inventory(0)).amount).to.be.eq(TradeTokens.sword.amount)
        expect((await this.instance.inventory(0)).token).to.be.eq(this.tradeToken.address)

        expect((await this.instance.inventory(1)).id).to.be.eq(TradeTokens.shield.id)
        expect((await this.instance.inventory(1)).amount).to.be.eq(TradeTokens.shield.amount)
        expect((await this.instance.inventory(1)).token).to.be.eq(this.tradeToken.address)

        expect((await this.instance.inventory(2)).id).to.be.eq(TradeTokens.excalibur.id)
        expect((await this.instance.inventory(2)).amount).to.be.eq(TradeTokens.excalibur.amount)
        expect((await this.instance.inventory(2)).token).to.be.eq(this.tradeToken.address)

        expect((await this.instance.prices(0, 0)).price).to.be.eq(PricePairs[0].price)
        expect((await this.instance.prices(0, 0)).assetType).to.be.eq(PricePairs[0].assetType)
        expect((await this.instance.prices(0, 0)).asset).to.be.eq(PricePairs[0].asset)

        expect((await this.instance.prices(0, 1)).price).to.be.eq(PricePairs[1].price)
        expect((await this.instance.prices(0, 1)).assetType).to.be.eq(PricePairs[1].assetType)
        expect((await this.instance.prices(0, 1)).asset).to.be.eq(this.hre.ethers.constants.AddressZero)

        // check that nothing more listed
        expect(await this.instance.nextItemId()).to.be.eq(3)
        expect((await this.instance.inventory(3)).id).to.be.eq(0)
        expect((await this.instance.inventory(3)).amount).to.be.eq(0)
        expect((await this.instance.inventory(3)).token).to.be.eq(this.hre.ethers.constants.AddressZero)

        expect((await this.instance.inventory(4)).id).to.be.eq(0)
        expect((await this.instance.inventory(4)).amount).to.be.eq(0)
        expect((await this.instance.inventory(4)).token).to.be.eq(this.hre.ethers.constants.AddressZero)

        expect((await this.instance.prices(3, 0)).price).to.be.eq(0)
        expect((await this.instance.prices(3, 0)).assetType).to.be.eq(0)
        expect((await this.instance.prices(3, 0)).asset).to.be.eq(this.hre.ethers.constants.AddressZero)
    })

    it("should change prices correctly", async function () {
        //check require
        await expect(this.instance.changeItemPrice(1, [])).to.be.revertedWith("Shop: You must set at least one price pair for item.")

        let newPricePairs = [
            { assetType: 1, asset: this.hre.ethers.constants.AddressZero, price: ethers.utils.parseEther("3") },
            { assetType: 2, asset: this.paymentToken.address, price: ethers.utils.parseEther("7") }
        ]

        await this.instance.changeItemPrice(
            1,
            newPricePairs
        )

        // check changes
        expect((await this.instance.prices(1, 0)).price).to.be.eq(newPricePairs[0].price)
        expect((await this.instance.prices(1, 0)).assetType).to.be.eq(newPricePairs[0].assetType)
        expect((await this.instance.prices(1, 0)).asset).to.be.eq(this.hre.ethers.constants.AddressZero)
        expect((await this.instance.prices(1, 1)).price).to.be.eq(newPricePairs[1].price)
        expect((await this.instance.prices(1, 1)).assetType).to.be.eq(newPricePairs[1].assetType)
        expect((await this.instance.prices(1, 1)).asset).to.be.eq(this.paymentToken.address)
    })

    it("should remove item correctly", async function () {
        // check require
        await expect(this.instance.removeItem(0, 16)).to.be.revertedWith("Shop: There is not enough of your desired item to remove.")

        // check remove
        await this.instance.removeItem(0, 10)
        expect((await this.instance.inventory(0)).amount).to.be.eq(TradeTokens.sword.amount - 10)
    })

    it("should buy items from shop correctly", async function () {
        // check requires
        await expect(this.instance.connect(this.alice).purchaseItem(TradeTokens.sword.id, 6, 0)).to.be.revertedWith("Shop: There is not enough of your desired item in stock to purchase.")

        await expect(this.instance.connect(this.alice).purchaseItem(TradeTokens.sword.id, 5, 2)).to.be.revertedWith("Shop: Your specified asset ID is not valid.")

        await expect(this.instance.connect(this.alice).purchaseItem(TradeTokens.sword.id, 5, 1, { value: this.hre.ethers.utils.parseEther("24.9") }))
            .to.be.revertedWith("Shop: You did not send enough Ether to complete this purchase.")

        // alice's balance is 49.9 TKN now
        await expect(this.instance.connect(this.alice).purchaseItem(TradeTokens.sword.id, 5, 0))
            .to.be.revertedWith("Shop: You do not have enough token to complete this purchase.")

        // minting a bit to alice
        expect(await this.paymentToken.connect(this.signers.admin).mint(this.alice.address, this.hre.ethers.utils.parseEther("0.1"))).to.be.ok

        // purchasing for ERC20
        await this.paymentToken.connect(this.alice).approve(this.instance.address, this.hre.ethers.utils.parseEther("50"))
        expect(await this.instance.connect(this.alice).purchaseItem(TradeTokens.sword.id, 2, 0)).to.be.ok

        // check changes
        expect((await this.instance.inventory(0)).amount).to.be.eq(3)

        // check balances
        expect(await this.paymentToken.balanceOf(this.alice.address)).to.be.eq(this.hre.ethers.utils.parseEther("30"))
        // check fee owner balance
        expect(await this.paymentToken.balanceOf(this.carl.address)).to.be.eq(this.hre.ethers.utils.parseEther((20 * await this.instance.feePercent() / 1000 / 100).toString()))
        // check royalty owner balance
        expect(await this.paymentToken.balanceOf(this.dan.address)).to.be.eq(this.hre.ethers.utils.parseEther((20 * await this.instance.itemRoyaltyPercent() / 1000 / 100).toString()))
        // check shop owner's balance
        expect(await this.paymentToken.balanceOf(this.signers.admin.address)).to.be.eq(this.hre.ethers.utils.parseEther((20 -
            20 * (await this.instance.itemRoyaltyPercent() / 1000 + await this.instance.feePercent() / 1000) / 100).toString()))
        expect(await this.tradeToken.balanceOf(this.alice.address, TradeTokens.sword.id)).to.be.eq(2)


        // purchasing for Ether
        let oldBobBalance: BigNumber = await this.bob.getBalance()
        let oldCarlBalance: BigNumber = await this.carl.getBalance()
        let oldDanBalance: BigNumber = await this.dan.getBalance()
        let tx = await this.instance.connect(this.bob).purchaseItem(TradeTokens.shield.id, 4, 0, { value: this.hre.ethers.utils.parseEther("1000") })
        let receipt = await tx.wait()
        let txPrice: BigNumber = receipt.effectiveGasPrice.mul(receipt.cumulativeGasUsed)
        let newBobBalance: BigNumber = oldBobBalance.sub(txPrice.add(this.hre.ethers.utils.parseEther("12")))
        // check balances
        expect(await this.paymentToken.balanceOf(this.alice.address)).to.be.eq(this.hre.ethers.utils.parseEther("30"))
        expect(await this.bob.getBalance()).to.be.eq(newBobBalance)
        // check fee owner balance
        expect(await this.carl.getBalance()).to.be.eq(oldCarlBalance.add(this.hre.ethers.utils.parseEther((12 * await this.instance.feePercent() / 1000 / 100).toString())))
        // check royalty owner balance
        expect(await this.dan.getBalance()).to.be.eq(oldDanBalance.add(this.hre.ethers.utils.parseEther((12 * await this.instance.itemRoyaltyPercent() / 1000 / 100).toString())))
        expect(await this.tradeToken.balanceOf(this.bob.address, TradeTokens.shield.id)).to.be.eq(4)

        // extra check for full coverage without change return
        expect(await this.instance.connect(this.bob).purchaseItem(TradeTokens.shield.id, 3, 0, { value: this.hre.ethers.utils.parseEther("9") })).to.be.ok
        expect(await this.tradeToken.balanceOf(this.bob.address, TradeTokens.shield.id)).to.be.eq(7)
    })

    it("should get inventory items from shop correctly", async function () {

        //check require
        await expect(this.instance.getInventoryItem(3)).to.be.revertedWith("Shop: Wrong inventory item id")

        expect(await this.instance.getInventoryItem(2)).to.be.ok
        expect((await this.instance.getInventoryItem(2))[0][2]).to.be.eq(1)
        expect((await this.instance.getInventoryItem(2))[1][0][2]).to.be.eq(this.hre.ethers.utils.parseEther("10"))
    })

    it("should change procentiles for fee and royalties correctly", async function () {

        //check requires
        await expect(this.instance.changeFeePercent(97000)).to.be.revertedWith("Shop: Invalid new value of fee percent")
        await expect(this.instance.changeRoyaltyPercent(96000)).to.be.revertedWith("Shop: Invalid new value of royalties percent")

        expect(await this.instance.changeFeePercent(96000)).to.be.ok
        expect(await this.instance.changeRoyaltyPercent(3900)).to.be.ok

        //extra checks for full coverage
        expect(await this.instance.changeFeePercent(96000)).to.be.ok
        expect(await this.instance.changeRoyaltyPercent(3900)).to.be.ok
    })

    it("should change fee and royalty owners correctly", async function () {

        //check requires
        await expect(this.instance.changeFeeOwner(this.hre.ethers.constants.AddressZero)).to.be.revertedWith("Shop: Invalid new address of new fee owner")
        await expect(this.instance.changeRoyaltyOwner(this.hre.ethers.constants.AddressZero)).to.be.revertedWith("Shop: Invalid new address of new royalty owner")

        expect(await this.instance.changeFeeOwner(this.alice.address)).to.be.ok
        expect(await this.instance.changeRoyaltyOwner(this.bob.address)).to.be.ok

        //extra checks for full coverage
        expect(await this.instance.changeFeeOwner(this.alice.address)).to.be.ok
        expect(await this.instance.changeRoyaltyOwner(this.bob.address)).to.be.ok
    })
}