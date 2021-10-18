import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as mocha from "mocha-steps";
import { BigNumber, BigNumberish, Contract } from "ethers";
import "@nomiclabs/hardhat-web3";
import { toUtf8Bytes } from '@ethersproject/strings';



describe("Testing shop contract", function(){
  const ShopName = "Shoping shop"
  const feePercent = ethers.BigNumber.from("1500"); // 
  const royaltyFeePercent = ethers.BigNumber.from("2500"); // 100000
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let Shop: Contract;
  let ShopToken: Contract;
  let ShopItems: Contract;
  let Owner: SignerWithAddress;
  let RoyaltyOwner: SignerWithAddress;
  let RichBuyer: SignerWithAddress;
  let PoorBuyer: SignerWithAddress;
  let minter: SignerWithAddress;

  let oneMln = ethers.utils.parseEther("1000000");
  let oneK = ethers.utils.parseEther("1000");
  let PricePairs: any;

  // testing items: different game staff for RUSSIAN LIFE SIMULATOR (joke) 
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

  before( async ()=>{
    [Owner, RoyaltyOwner, RichBuyer, PoorBuyer, minter] = await ethers.getSigners();
  });
  
  mocha.step("STEP 0: deploying contracts",  async ()=>{
    const ShopContract = await ethers.getContractFactory("Shop");
    Shop = await ShopContract.deploy(
      ShopName,
      Owner.address, 
      feePercent,
      royaltyFeePercent,
      RoyaltyOwner.address
    );
    await Shop.deployed();
    
    // check that variables values are ok
    expect(await Shop.version()).to.be.equal(1);
    expect(await Shop.name()).to.be.equal(ShopName);
    expect(await Shop.feeOwner()).to.be.equal(Owner.address);
    expect(await Shop.feePercent()).to.be.equal(feePercent);
    expect(await Shop.itemRoyaltyPercent()).to.be.equal(royaltyFeePercent);
    expect(await Shop.royaltyOwner()).to.be.equal(RoyaltyOwner.address)
    
    const ShopTokenContract = await ethers.getContractFactory("ShopToken");
    ShopToken = await ShopTokenContract.deploy();
    await ShopToken.deployed();

    PricePairs = [
      {assetType: 2, price: ethers.utils.parseEther("100"), asset: ShopToken.address},
      {assetType: 1, price: ethers.utils.parseEther("10"), asset: zeroAddress}
    ];
    
    // mint tokens for buyers 
    await ShopToken.connect(Owner).mint(RichBuyer.address, oneMln);
    await ShopToken.connect(Owner).mint(PoorBuyer.address, oneK);
 
    expect(await ShopToken.totalSupply()).to.be.equal(oneMln.add(oneK));
 
    const ShopItemsContract = await ethers.getContractFactory("ShopItems")
    ShopItems = await ShopItemsContract.deploy();
    await ShopItems.deployed();
    await ShopItems.connect(Owner).grantRole(ethers.utils.id("MINTER_ROLE"), minter.address);
   
    await ShopItems.connect(minter).mint(Owner.address, items.ruble.id, items.ruble.amount, items.ruble.data);
    await ShopItems.connect(minter).mint(Owner.address, items.balalayka.id, items.balalayka.amount, items.balalayka.data); // assumed as NFT
    await ShopItems.connect(minter).mint(Owner.address, items.vodka.id, items.vodka.amount, items.vodka.data); // assumed as FT
    await ShopItems.connect(minter).mint(Owner.address, items.ushanka.id, items.ushanka.amount, items.ushanka.data); // assumed as NFT 
    
    await ShopItems.connect(Owner).setApprovalForAll(Shop.address, true)

  })

  mocha.step("STEP 1: list new item for sale",  async ()=>{
    await expect( Shop.connect(Owner).listItems(
      PricePairs,
      [],
      [[]],
      [[]]
    )).to.be.revertedWith(
      "Shop: You must list at least one item."
    );
    
    // TODO normal operation
    await Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[items.ruble.id, items.balalayka.id, items.vodka.id, items.ushanka.id]],
      [[items.ruble.amount, items.balalayka.amount, items.vodka.amount, items.ushanka.amount]]
    );
    
    // TODO check that emits after 
    expect((await Shop.inventory(0)).id).to.be.equal(ethers.BigNumber.from(items.ruble.id));
    expect((await Shop.inventory(0)).amount).to.be.equal(ethers.BigNumber.from(items.ruble.amount));
    expect((await Shop.inventory(0)).token).to.be.equal(ShopItems.address);
    
    expect((await Shop.inventory(1)).id).to.be.equal(ethers.BigNumber.from(items.balalayka.id));
    expect((await Shop.inventory(1)).amount).to.be.equal(ethers.BigNumber.from(items.balalayka.amount));
    expect((await Shop.inventory(1)).token).to.be.equal(ShopItems.address);
    
    expect((await Shop.inventory(2)).id).to.be.equal(ethers.BigNumber.from(items.vodka.id));
    expect((await Shop.inventory(2)).amount).to.be.equal(ethers.BigNumber.from(items.vodka.amount));
    expect((await Shop.inventory(2)).token).to.be.equal(ShopItems.address);
    
    expect((await Shop.inventory(3)).id).to.be.equal(ethers.BigNumber.from(items.ushanka.id));
    expect((await Shop.inventory(3)).amount).to.be.equal(ethers.BigNumber.from(items.ushanka.amount));
    expect((await Shop.inventory(3)).token).to.be.equal(ShopItems.address);
    
    expect((await Shop.prices(0, 0)).price).to.be.eq(PricePairs[0].price)
    expect((await Shop.prices(0, 0)).assetType).to.be.eq(PricePairs[0].assetType)
    expect((await Shop.prices(0, 0)).asset).to.be.eq(PricePairs[0].asset)
            
    // check for pointer outside prices and inventory
    expect((await Shop.inventory(4)).id).to.be.eq(ethers.BigNumber.from(0))
    expect((await Shop.inventory(4)).amount).to.be.eq(ethers.BigNumber.from(0))
    expect((await Shop.inventory(4)).token).to.be.eq(zeroAddress)
    expect((await Shop.prices(4, 0)).price).to.be.eq(ethers.BigNumber.from(0))
    expect((await Shop.prices(4, 0)).assetType).to.be.eq(ethers.BigNumber.from(0))
    expect((await Shop.prices(4, 0)).asset).to.be.eq(zeroAddress)

    await expect( Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[items.ruble.amount],[items.balalayka.amount]],
      [[items.ruble.amount, items.balalayka.amount, items.vodka.amount, items.ushanka.amount]]
    )).to.be.revertedWith(
      "Shop: Items length cannot be mismatched with IDs length."
    );

    await expect( Shop.connect(Owner).listItems(
      PricePairs,
      [ShopItems.address],
      [[items.ruble.id, items.balalayka.id, items.vodka.id, items.ushanka.id]],
      [[items.ruble.id], [items.ruble.id]]
    )).to.be.revertedWith(
      "Shop: Items length cannot be mismatched with amounts length."
    );

  })

  mocha.step("STEP 2: remove items from sale",  async ()=>{
    // TODO normal operation
    await Shop.connect(Owner).removeItem(0, 3);
    expect((await Shop.inventory(0)).amount).to.be.eq(ethers.BigNumber.from(items.ruble.amount - 3))
    
    await expect( 
      Shop.connect(Owner).removeItem(
        0, items.ruble.amount
      )
    ).to.be.revertedWith(
      "Shop: There is not enough of your desired item to remove."
    );
  })

  mocha.step("STEP 3: change item's price",  async ()=>{
    // TODO Normal operation
    let newPricePairs = [
      {assetType: 1, price: ethers.utils.parseEther("1000"), asset: zeroAddress},
      {assetType: 2, price: ethers.utils.parseEther("10000"), asset: ShopToken.address} 
    ];

    // change price for ushanka, cause it very rare 
    await Shop.changeItemPrice(
      3,
      [newPricePairs[0], newPricePairs[1]]
    );

    expect((await Shop.prices(3, 0)).price).to.be.eq(newPricePairs[0].price)
    expect((await Shop.prices(3, 0)).assetType).to.be.eq(newPricePairs[0].assetType)
    expect((await Shop.prices(3, 0)).asset).to.be.eq(zeroAddress)
    expect((await Shop.prices(3, 1)).price).to.be.eq(newPricePairs[1].price)
    expect((await Shop.prices(3, 1)).assetType).to.be.eq(newPricePairs[1].assetType)
    expect((await Shop.prices(3, 1)).asset).to.be.eq(ShopToken.address)

  })

  mocha.step("STEP 4: purchase item from shop",  async ()=>{
    await ShopToken.connect(PoorBuyer).approve(Shop.address, oneMln)
    await ShopToken.connect(RichBuyer).approve(Shop.address, oneMln)
    let rublesAmount = (await Shop.inventory(0)).amount;
    await Shop.connect(RichBuyer).purchaseItem(items.ruble.id, rublesAmount, 0)
    expect((await Shop.inventory(items.ruble.id)).amount).to.be.eq(0)
    // check fees
    expect(await ShopToken.balanceOf(RoyaltyOwner.address)).to.be.eq(ethers.utils.parseEther((9997*25*100/1000).toString()))
    //try purchase some more rubles
    await expect(
      Shop.connect(PoorBuyer).purchaseItem(items.ruble.id, 1, 1)
    ).to.be.revertedWith(
      'Shop: There is not enough of your desired item in stock to purchase.'
    );
    //try purchase 0 rubles 
    await expect(
      Shop.connect(RichBuyer).purchaseItem(items.ruble.id, 0, 1)
    ).to.be.revertedWith(
      'Shop: There is not enough of your desired item in stock to purchase.'
    );
    // 
    await expect(
      Shop.connect(PoorBuyer).purchaseItem(items.ushanka.id, 1, 1)
    ).to.be.revertedWith(
        "Shop: You do not have enough token to complete this purchase."
    );

    // purchase cigar for native currency
    await Shop.connect(RichBuyer).purchaseItem(items.ushanka.id, items.ushanka.amount, 0, {value: ethers.utils.parseEther("1000")})
    expect((await Shop.inventory(3)).amount).to.be.eq(0)

  })

});