import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as mocha from "mocha-steps";
import { BigNumber, BigNumberish, Contract } from "ethers";
import "@nomiclabs/hardhat-web3";
import { toUtf8Bytes } from '@ethersproject/strings';



describe("Testing shop contract", () => {
  const ShopName = "Shoping shop"
  const feePercent = ethers.BigNumber.from("15"); // 
  const royaltyFeePercent = ethers.BigNumber.from("25"); // 100000

  let Shop: Contract;
  let ShopToken: Contract;
  let ShopItems: Contract;
  let Owner: SignerWithAddress;
  let RoyaltyOwner: SignerWithAddress;
  let RichBuyer: SignerWithAddress;
  let PoorBuyer: SignerWithAddress;
  let minter: SignerWithAddress;

  let oneMln = ethers.utils.parseEther("1000000");
  let tenK = ethers.utils.parseEther("10000");
  let PricePairs: any;

  let items = {
    ruble: { 
      id: 0,
      amount: 10000,
      data: 0
    },
    balalayka: {
      id: 1,
      amount: 1,
      data: toUtf8Bytes("Friend's balalayka")
    }, 
    vodka: {
      id: 2,
      amount: 1000,
      data: 0
    },
    ushanka: {
      id: 3, 
      amount: 1,
      data: toUtf8Bytes("old and torned")
    }
  }

  before(async function () {
    [Owner, RoyaltyOwner, RichBuyer, PoorBuyer] = await ethers.getSigners();
  });
  
  mocha.step("STEP 0: deploying contracts", async function () {
    const ShopContract = await ethers.getContractFactory("Shop");
    Shop = await ShopContract.deploy(
      ShopName,
      Owner.address, 
      feePercent,
      royaltyFeePercent,
      RoyaltyOwner.address
    );
    await Shop.deployed();
    
    expect(Shop.version()).to.be.equal(1);
    expect(Shop.name()).to.be.equal(ShopName);
    expect(Shop.feeOwner().to.be.equal(Owner.address));
    expect(Shop.feePercent()).to.be.equal(feePercent);
    expect(Shop.itemRoyaltyPercent()).to.be.equal(royaltyFeePercent);
    expect(Shop.royaltyOwner()).to.be.equal(RoyaltyOwner.address)
    

    const ShopTokenContract = await ethers.getContractFactory("ShopToken");
    ShopToken = await ShopTokenContract.deploy();
    await ShopToken.deployed();
    
    const ShopItemsContract = await ethers.getContractFactory("ShopItems")
    ShopItems = await ShopItemsContract.deploy();
    await ShopItems.deployed();
    await ShopItems.connect(Owner).grantRole(ethers.utils.id("MINTER_ROLE"), minter.address);
    await ShopToken.connect(Owner).mint(
      RichBuyer.address,
      oneMln
    );

    await ShopToken.connect(Owner).mint(
      PoorBuyer.address,
      tenK
    );

    expect(await ShopToken.totalSupply()).to.be.equal(oneMln.add(tenK));

    await ShopItems.connect(minter).mintBatch(
      Owner.address,
      [items.ruble.id, items.balalayka.id, items.vodka.id, items.ushanka.id],
      [items.ruble.amount, items.balalayka.amount, items.vodka.amount, items.ushanka.amount],
      [items.ruble.data, items.balalayka.data, items.vodka.data, items.ushanka.data]
    );
  
    await ShopItems.connect(Owner).setApprovalForAll(Owner.address, true);

  })

  mocha.step("STEP 1: list new item for sale", async function () {
    expect( await Shop.connect(Owner).listItems(
      PricePairs,
      [],
      [[]],
      [[]]
    )).to.be.revertedWith(
      "You must list at least one item."
    );

    expect( await Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[]],
      [[items.ruble.amount, items.balalayka.amount, items.vodka.amount, items.ushanka.amount]]
    )).to.be.revertedWith(
      "Items length cannot be mismatched with IDs length."
    );

    expect( await Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[items.ruble.id, items.balalayka.id, items.vodka.id, items.ushanka.id]],
      [[]]
    )).to.be.revertedWith(
      "Items length cannot be mismatched with amounts length."
    );

    // TODO normal operation
    await Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[items.ruble.id, items.balalayka.id, items.vodka.id, items.ushanka.id]],
      [[items.ruble.amount, items.balalayka.amount, items.vodka.amount, items.ushanka.amount]]
    );

    // TODO check that emits after 
      
  })

  mocha.step("STEP 2: remove items from sale", async function () {
    expect( await Shop.connect(Owner).removeItem(

    )).to.be.revertedWith(
      "There is not enough of your desired item to remove."
    );

    // TODO normal operation


  })

  mocha.step("STEP 3: change item's price", async function () {
    // TODO Normal operation
  })

  mocha.step("STEP 4: purchase item from shop", async function () {
    
  })

  mocha.step("", async function () {
    
  })
  

});
