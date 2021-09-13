import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { BigNumber } from 'bignumber.js';
import fs from 'fs';
import dotenv from 'dotenv';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import * as mocha from "mocha-steps";
import { toUtf8Bytes } from '@ethersproject/strings';
 
BigNumber.config({ EXPONENTIAL_AT: 60 }) // dont shorten strings with bignumbers unless length > 60
const network = hre.network.name;
const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
for (const parameter in envConfig) {
    process.env[parameter] = envConfig[parameter]
}

//Test the Shop
describe(process.env.SHOP_NAME as string, function(){
    let creator: SignerWithAddress,
        minter: SignerWithAddress,
        customer: SignerWithAddress,
        TonySoprano: SignerWithAddress,
        shop: Contract,
        item: Contract,
        asset: Contract,
        // inputs for tests
        Assets = {
            customer: 1_000_000,
            TonySoprano: 3_000_000
        },
        Items ={
            gold: {
                id: 0,
                amount: 10,
                data: 0
            },
            silver: {
                id: 1,
                amount: 100,
                data: 0
            },
            cigar: {
                id: 2,
                amount: 1,
                data: toUtf8Bytes("Macanudos")
            }
        },
        zeroAddress = "0x0000000000000000000000000000000000000000",
        PricePairs : any;
        
    before(async ()=>{
        [TonySoprano, creator, minter, customer] = await ethers.getSigners();
    })
    mocha.step('Step 1: Should deploy contracts and mint assets and items', async ()=>{
        // Deploy Item
        const Item =  await ethers.getContractFactory(process.env.ITEM_NAME as string);
        item = await Item.deploy(process.env.ITEM_URI as string);
        await item.deployed()

        // Deploy Asset 
        const Asset = await ethers.getContractFactory(process.env.ASSET_NAME as string);
        asset = await Asset.deploy(
            process.env.ASSET_NAME as string,
            process.env.ASSET_SYMBOL as string
        );
        await asset.deployed()

        // initialize with asset.address
        // these are two price pairs for which customer can buy items
        PricePairs = [
                {assetType: 2, price: ethers.utils.parseEther("100"), asset: asset.address},
                {assetType: 1, price: ethers.utils.parseEther("10"), asset: zeroAddress}
            ];
        
        // Deploy Shop
        const Shop = await ethers.getContractFactory(process.env.SHOP_NAME as string);
        shop = await Shop.deploy(
            process.env.SHOP_NAME as string,
            minter.address,
            process.env.SHOP_FEE as string,
            process.env.SHOP_ROYALTY_PERCENT as string,
            creator.address 
        );
        await shop.deployed()
        // Grant Roles
        await asset.connect(TonySoprano).grantRole(ethers.utils.id("MINTER_ROLE"), minter.address)
        await item.connect(TonySoprano).grantRole(ethers.utils.id("MINTER_ROLE"), minter.address)

        // Mint 
        
        await asset.connect(minter).mint(
            customer.address,
            ethers.utils.parseEther(Assets.customer.toString())
        )
        await asset.connect(minter).mint(
            TonySoprano.address,
            ethers.utils.parseEther(Assets.TonySoprano.toString())
        )
        expect(await asset.totalSupply()).to.be.eq(ethers.utils.parseEther((Assets.TonySoprano+Assets.customer).toString()))

        await item.connect(minter).mint(creator.address, Items.gold.id, Items.gold.amount, Items.gold.data)
        await item.connect(minter).mint(creator.address, Items.silver.id, Items.silver.amount, Items.silver.data)    
        await item.connect(minter).mint(creator.address, Items.cigar.id, Items.cigar.amount, Items.cigar.data) // lets assume its nft, even tho I haven't implemented anything to differ FTs from NFTs in the Item contract
        
        // Deliever
        await item.connect(creator).setApprovalForAll(TonySoprano.address, true)
        await item.connect(TonySoprano).safeBatchTransferFrom(
            creator.address,
            TonySoprano.address,
            [Items.gold.id, Items.silver.id, Items.cigar.id],
            [Items.gold.amount, Items.silver.amount, Items.cigar.amount],
            0
        )
        expect(await item.balanceOf(TonySoprano.address, Items.gold.id)).to.be.eq(ethers.BigNumber.from(Items.gold.amount));
        expect(await item.balanceOf(TonySoprano.address, Items.silver.id)).to.be.eq(ethers.BigNumber.from(Items.silver.amount));
        expect(await item.balanceOf(TonySoprano.address, Items.cigar.id)).to.be.eq(ethers.BigNumber.from(Items.cigar.amount));
    })
    mocha.step('Step 2: Should list items correctly', async ()=>{
        await item.setApprovalForAll(shop.address, true);
        // list Tony Soprano's items for the PricePair
        await shop.listItems(
            PricePairs,
            [item.address],
            [[Items.gold.id, Items.silver.id, Items.cigar.id]],
            [[Items.gold.amount, Items.silver.amount, Items.cigar.amount]]
        )
        // check for gold
        expect((await shop.inventory(0)).id).to.be.eq(ethers.BigNumber.from(Items.gold.id))
        expect((await shop.inventory(0)).amount).to.be.eq(ethers.BigNumber.from(Items.gold.amount))
        expect((await shop.inventory(0)).token).to.be.eq(item.address)
        // check for silver
        expect((await shop.inventory(1)).id).to.be.eq(ethers.BigNumber.from(Items.silver.id))
        expect((await shop.inventory(1)).amount).to.be.eq(ethers.BigNumber.from(Items.silver.amount))
        expect((await shop.inventory(1)).token).to.be.eq(ethers.BigNumber.from(item.address))
        // check for cigar
        expect((await shop.inventory(2)).id).to.be.eq(ethers.BigNumber.from(Items.cigar.id))
        expect((await shop.inventory(2)).amount).to.be.eq(ethers.BigNumber.from(Items.cigar.amount))
        expect((await shop.inventory(2)).token).to.be.eq(ethers.BigNumber.from(item.address))
        //check price pairs for items
        // check for erc20 asset type
        expect((await shop.prices(0, 0)).price).to.be.eq(PricePairs[0].price)
        expect((await shop.prices(0, 0)).assetType).to.be.eq(PricePairs[0].assetType)
        expect((await shop.prices(0, 0)).asset).to.be.eq(PricePairs[0].asset)
        // check for erc20 asset type
        expect((await shop.prices(0, 1)).price).to.be.eq(PricePairs[1].price)
        expect((await shop.prices(0, 1)).assetType).to.be.eq(PricePairs[1].assetType)
        expect((await shop.prices(0, 1)).asset).to.be.eq(zeroAddress)
        // check for pointer outside prices and inventory
        expect((await shop.inventory(3)).id).to.be.eq(ethers.BigNumber.from(0))
        expect((await shop.inventory(3)).amount).to.be.eq(ethers.BigNumber.from(0))
        expect((await shop.inventory(3)).token).to.be.eq(zeroAddress)
        expect((await shop.prices(3, 0)).price).to.be.eq(ethers.BigNumber.from(0))
        expect((await shop.prices(3, 0)).assetType).to.be.eq(ethers.BigNumber.from(0))
        expect((await shop.prices(3, 0)).asset).to.be.eq(zeroAddress)
        // list items with bad arguments   
        await expect(shop.listItems(
            PricePairs,
            [item.address],
            [[Items.gold.id, Items.silver.id]],
            [[Items.gold.amount, Items.silver.amount, Items.cigar.amount]] 
        )).to.be.revertedWith("ERC1155: ids and amounts length mismatch")
    })
    mocha.step('Step 3: Should change items prices', async ()=>{
        // for test
        let newPricePairs = [
            {assetType: 1, price: ethers.utils.parseEther("500"), asset: zeroAddress},
            {assetType: 2, price: ethers.utils.parseEther("500"), asset: asset.address} 
        ]
        // Tony decided he is not selling his cigar that cheap
        await shop.changeItemPrice(
            2,
            [newPricePairs[0], newPricePairs[1]]
        )
        // check out new cigar prices
        expect((await shop.prices(2, 0)).price).to.be.eq(newPricePairs[0].price)
        expect((await shop.prices(2, 0)).assetType).to.be.eq(newPricePairs[0].assetType)
        expect((await shop.prices(2, 0)).asset).to.be.eq(zeroAddress)
        expect((await shop.prices(2, 1)).price).to.be.eq(newPricePairs[1].price)
        expect((await shop.prices(2, 1)).assetType).to.be.eq(newPricePairs[1].assetType)
        expect((await shop.prices(2, 1)).asset).to.be.eq(asset.address)
    })
    mocha.step('Step 4: Should remove item', async ()=>{
        // remove 2 gold bars
        await shop.removeItem(0, 2)
        expect((await shop.inventory(0)).amount).to.be.eq(ethers.BigNumber.from(Items.gold.amount - 2))
        // remove more gold bars than there are in shop
        await expect(shop.removeItem(0, Items.gold.amount)).to.be.revertedWith("There is not enough of your desired item to remove.")
    })
    mocha.step('Step 5: Should purchase item', async ()=>{
        // purchase entire silver stock for ERC20
        await asset.connect(customer).approve(shop.address, ethers.utils.parseEther("10100"))
        await shop.connect(customer).purchaseItem(Items.silver.id, Items.silver.amount, 0)
        expect((await shop.inventory(Items.silver.id)).amount).to.be.eq(0)
        // check fees
        expect(await asset.balanceOf(minter.address)).to.be.eq(ethers.utils.parseEther((10000*6/100).toString()))
        //try purchase some more silver
        await expect(shop.connect(customer).purchaseItem(Items.silver.id, 1, 0)).to.be.revertedWith('There is not enough of your desired item in stock to purchase.')
        //try purchase 0 silver 
        await expect(shop.connect(customer).purchaseItem(Items.silver.id, 0, 0)).to.be.revertedWith('There is not enough of your desired item in stock to purchase.')

        // purchase cigar for native currency
        let  before = (await creator.getBalance()).toString();
        await shop.connect(customer).purchaseItem(Items.cigar.id, Items.cigar.amount, 0, {value: ethers.utils.parseEther("500")})
        let after = (await creator.getBalance()).toString()
        expect((await shop.inventory(2)).amount).to.be.eq(0)
        //check eth fee
        expect(ethers.utils.parseEther((500*4/100).toString())).to.be.eq(ethers.BigNumber.from(after).sub(ethers.BigNumber.from(before)))
    })
    mocha.step('Step 6: View function should work correctly', async ()=>{
        // getShopInfo
        let info = await shop.getShopInfo();
        expect(info[0]).to.be.eq(process.env.SHOP_NAME as string)
        expect(info[1]).to.be.eq(minter.address)
        expect(info[2]).to.be.eq(creator.address)
        expect(info[3].toString()).to.be.eq(process.env.SHOP_FEE as string)
        expect(info[4].toString()).to.be.eq(process.env.SHOP_ROYALTY_PERCENT as string)
        // getVersion
        expect(await shop.getVersion()).to.be.eq(1)
        // getInventoryCount
        expect(await shop.getInventoryCount()).to.be.eq(3)
    })
})